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
        this.config = config;
        if (typeof window !== 'undefined') {
            this.storage = window.localStorage;
        }
    }
    signIn(redirectUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = Math.random().toString(36).substring(7);
            const nonce = Math.random().toString(36).substring(7);
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: this.config.clientId,
                redirect_uri: redirectUri || this.config.redirectUri,
                state,
                nonce,
                scope: 'openid profile email',
            });
            const url = `${this.config.issuer}/protocol/openid-connect/auth?${params.toString()}`;
            window.location.href = url;
        });
    }
    handleCallback(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.config.issuer}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    code,
                    redirect_uri: this.config.redirectUri,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to exchange code for tokens');
            }
            const tokens = yield response.json();
            if (this.storage) {
                this.storage.setItem('kc_access_token', (0, encryption_1.encrypt)(tokens.access_token));
                this.storage.setItem('kc_refresh_token', (0, encryption_1.encrypt)(tokens.refresh_token));
                this.storage.setItem('kc_id_token', (0, encryption_1.encrypt)(tokens.id_token));
            }
            return tokens;
        });
    }
    logout(redirectUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const idToken = yield this.getIdToken();
            if (this.storage) {
                this.storage.removeItem('kc_access_token');
                this.storage.removeItem('kc_refresh_token');
                this.storage.removeItem('kc_id_token');
            }
            const params = new URLSearchParams({
                client_id: this.config.clientId,
                post_logout_redirect_uri: redirectUri || this.config.redirectUri,
                id_token_hint: idToken || '',
            });
            const url = `${this.config.issuer}/protocol/openid-connect/logout?${params.toString()}`;
            window.location.href = url;
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage)
                return null;
            const encryptedToken = this.storage.getItem('kc_access_token');
            return encryptedToken ? (0, encryption_1.decrypt)(encryptedToken) : null;
        });
    }
    getIdToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage)
                return null;
            const encryptedToken = this.storage.getItem('kc_id_token');
            return encryptedToken ? (0, encryption_1.decrypt)(encryptedToken) : null;
        });
    }
    getRefreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage)
                return null;
            const encryptedToken = this.storage.getItem('kc_refresh_token');
            return encryptedToken ? (0, encryption_1.decrypt)(encryptedToken) : null;
        });
    }
    getUserRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = yield this.getAccessToken();
            if (!token)
                return [];
            const decoded = yield (0, tokenUtils_1.getDecodedAccessToken)(token);
            return ((_a = decoded === null || decoded === void 0 ? void 0 : decoded.realm_access) === null || _a === void 0 ? void 0 : _a.roles) || [];
        });
    }
    refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = yield this.getRefreshToken();
            if (!refreshToken)
                return false;
            try {
                const result = yield (0, tokenRefresher_1.refreshAccessToken)(refreshToken, this.config);
                if (!result.success || !result.tokens)
                    return false;
                if (this.storage) {
                    this.storage.setItem('kc_access_token', (0, encryption_1.encrypt)(result.tokens.access_token));
                    this.storage.setItem('kc_refresh_token', (0, encryption_1.encrypt)(result.tokens.refresh_token));
                    this.storage.setItem('kc_id_token', (0, encryption_1.encrypt)(result.tokens.id_token));
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
            const token = yield this.getAccessToken();
            if (!token)
                return false;
            const decoded = yield (0, tokenUtils_1.getDecodedAccessToken)(token);
            if (!decoded)
                return false;
            const now = Math.floor(Date.now() / 1000);
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
