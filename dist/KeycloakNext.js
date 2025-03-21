"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakNext = void 0;
const tokenRefresher_1 = require("./utils/tokenRefresher");
const encryption_1 = require("./utils/encryption");
const tokenUtils_1 = require("./utils/tokenUtils");
class KeycloakNext {
    constructor(config) {
        this.storage = null;
        this.encryptionConfig = {
            encryptionKey: process.env[KeycloakNext.ENCRYPTION_KEY] ||
                "f47ac10b58cc4372a5670e02b2c3d479",
            iv: process.env[KeycloakNext.ENCRYPTION_IV] || "1e72d836a2f1d4b8",
        };
        this.config = config;
        if (typeof window !== "undefined") {
            this.storage = window.localStorage;
        }
    }
    setEncryptionConfig(encryptionKey, iv) {
        this.encryptionConfig = { encryptionKey, iv };
    }
    fetchWithCORS(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(url, Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign({}, options.headers), { Accept: "application/json" }), mode: "cors" }));
            return response;
        });
    }
    signIn(redirectUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = Math.random().toString(36).substring(7);
            const nonce = Math.random().toString(36).substring(7);
            const params = new URLSearchParams({
                response_type: "code",
                client_id: this.config.clientId,
                redirect_uri: redirectUri || this.config.redirectUri,
                state,
                nonce,
                scope: "openid profile email",
            });
            const url = `${this.config.issuer}/protocol/openid-connect/auth?${params.toString()}`;
            window.location.href = url;
        });
    }
    handleCallback(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetchWithCORS(`${this.config.issuer}/protocol/openid-connect/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: this.config.clientId,
                    //client_secret: this.config.clientSecret,
                    code,
                    redirect_uri: this.config.redirectUri,
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to exchange code for tokens");
            }
            const tokens = yield response.json();
            if (this.storage) {
                this.storage.setItem("kc_access_token", (0, encryption_1.encrypt)(tokens.access_token, this.encryptionConfig));
                this.storage.setItem("kc_refresh_token", (0, encryption_1.encrypt)(tokens.refresh_token, this.encryptionConfig));
                this.storage.setItem("kc_id_token", (0, encryption_1.encrypt)(tokens.id_token, this.encryptionConfig));
            }
            return tokens;
        });
    }
    logout(redirectUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const idToken = yield this.getIdToken();
            if (this.storage) {
                this.storage.removeItem("kc_access_token");
                this.storage.removeItem("kc_refresh_token");
                this.storage.removeItem("kc_id_token");
            }
            const params = new URLSearchParams({
                client_id: this.config.clientId,
                post_logout_redirect_uri: redirectUri || this.config.redirectUri,
                id_token_hint: idToken || "",
            });
            const url = `${this.config.issuer}/protocol/openid-connect/logout?${params.toString()}`;
            window.location.href = url;
        });
    }
    getRawDecryptedToken(tokenKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage)
                return null;
            const encryptedToken = this.storage.getItem(tokenKey);
            return encryptedToken
                ? (0, encryption_1.decrypt)(encryptedToken, this.encryptionConfig)
                : null;
        });
    }
    isTokenExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = yield this.getRawDecryptedToken("kc_access_token");
                if (!token)
                    return true;
                const decoded = yield (0, tokenUtils_1.getDecodedAccessToken)(token);
                if (!decoded || !decoded.exp)
                    return true;
                // Add a 30-second buffer to ensure we refresh before actual expiration
                const expirationTime = decoded.exp * 1000 - 30000;
                console.log("Expiration time:", expirationTime);
                console.log("Current time:", Date.now());
                console.log("Is token expired?", Date.now() >= expirationTime);
                return Date.now() >= expirationTime;
            }
            catch (error) {
                console.error("Error checking token expiration:", error);
                return true;
            }
        });
    }
    getDecryptedAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage)
                return null;
            try {
                const token = yield this.getRawDecryptedToken("kc_access_token");
                if (!token)
                    return null;
                // Check if token is expired and try to refresh if needed
                console.log("Checking token expiration...");
                const isExpired = yield this.isTokenExpired();
                console.log("Token is expired:", isExpired);
                if (isExpired) {
                    const refreshed = yield this.refreshToken();
                    console.log("Refreshing token:", refreshed);
                    if (refreshed) {
                        return yield this.getRawDecryptedToken("kc_access_token");
                    }
                    return null;
                }
                return token;
            }
            catch (error) {
                console.error("Error getting decrypted access token:", error);
                return null;
            }
        });
    }
    getAccessToken() {
        if (!this.storage)
            return null;
        return this.storage.getItem("kc_access_token");
    }
    getIdToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getRawDecryptedToken("kc_id_token");
        });
    }
    getRefreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getRawDecryptedToken("kc_refresh_token");
        });
    }
    getUserRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = yield this.getDecryptedAccessToken();
            if (!token)
                return [];
            const decoded = yield (0, tokenUtils_1.getDecodedAccessToken)(token);
            return ((_a = decoded === null || decoded === void 0 ? void 0 : decoded.realm_access) === null || _a === void 0 ? void 0 : _a.roles) || [];
        });
    }
    refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = yield this.getRefreshToken();
            console.log("Refreshing token:", refreshToken);
            if (!refreshToken)
                return false;
            console.log("refresh token", (0, tokenUtils_1.getDecodedAccessToken)(refreshToken));
            try {
                const result = yield (0, tokenRefresher_1.refreshAccessToken)(refreshToken, this.config);
                if (!result.success || !result.tokens)
                    return false;
                if (this.storage) {
                    this.storage.setItem("kc_access_token", (0, encryption_1.encrypt)(result.tokens.access_token, this.encryptionConfig));
                    this.storage.setItem("kc_refresh_token", (0, encryption_1.encrypt)(result.tokens.refresh_token, this.encryptionConfig));
                    this.storage.setItem("kc_id_token", (0, encryption_1.encrypt)(result.tokens.id_token, this.encryptionConfig));
                }
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    isAuthenticated() {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getDecryptedAccessToken();
            if (!token)
                return false;
            const decoded = yield (0, tokenUtils_1.getDecodedAccessToken)(token);
            console.log("Decoded token:", decoded);
            if (!decoded)
                return false;
            const now = Math.floor(Date.now() / 1000);
            console.log("Now:", now);
            console.log("Token expiration:", decoded.exp);
            console.log("Is token expired?", decoded.exp > now);
            return decoded.exp > now;
        });
    }
    hasRole(role) {
        return __awaiter(this, void 0, void 0, function* () {
            const roles = yield this.getUserRoles();
            return roles.includes(role);
        });
    }
}
exports.KeycloakNext = KeycloakNext;
KeycloakNext.ENCRYPTION_KEY = "f47ac10b58cc4372a5670e02b2c3d479";
KeycloakNext.ENCRYPTION_IV = "1e72d836a2f1d4b8";
