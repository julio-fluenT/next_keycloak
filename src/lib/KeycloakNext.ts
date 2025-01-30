import { KeycloakConfig } from "./types";
import { refreshAccessToken } from "./utils/tokenRefresher";
import { encrypt, decrypt } from "./utils/encryption";
import { getDecodedAccessToken } from "./utils/tokenUtils";

/**
 * Configuration for encryption and decryption operations.
 */
interface EncryptionConfig {
  /** The encryption key used for AES-256-CBC algorithm. Must be 32 characters long. */
  encryptionKey: string;
  /** The initialization vector (IV) for the encryption. Must be 16 characters long. */
  iv: string;
}
export class KeycloakNext {
  private config: KeycloakConfig;
  private storage: Storage | null = null;

  private static readonly ENCRYPTION_KEY = "f47ac10b58cc4372a5670e02b2c3d479";
  private static readonly ENCRYPTION_IV = "1e72d836a2f1d4b8";

  private encryptionConfig: EncryptionConfig = {
    encryptionKey:
      process.env[KeycloakNext.ENCRYPTION_KEY] ||
      "f47ac10b58cc4372a5670e02b2c3d479",
    iv: process.env[KeycloakNext.ENCRYPTION_IV] || "1e72d836a2f1d4b8",
  };

  constructor(config: KeycloakConfig) {
    this.config = config;
    if (typeof window !== "undefined") {
      this.storage = window.localStorage;
    }
  }

  setEncryptionConfig(encryptionKey: string, iv: string) {
    this.encryptionConfig = { encryptionKey, iv };
  }

  private async fetchWithCORS(url: string, options: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Accept: "application/json",
      },
      mode: "cors",
    });
    return response;
  }

  async signIn(redirectUri?: string): Promise<void> {
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

    const url = `${
      this.config.issuer
    }/protocol/openid-connect/auth?${params.toString()}`;
    window.location.href = url;
  }

  async handleCallback(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    id_token: string;
  }> {
    const response = await this.fetchWithCORS(
      `${this.config.issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await response.json();

    if (this.storage) {
      this.storage.setItem(
        "kc_access_token",
        encrypt(tokens.access_token, this.encryptionConfig)
      );
      this.storage.setItem(
        "kc_refresh_token",
        encrypt(tokens.refresh_token, this.encryptionConfig)
      );
      this.storage.setItem(
        "kc_id_token",
        encrypt(tokens.id_token, this.encryptionConfig)
      );
    }

    return tokens;
  }

  async logout(redirectUri?: string): Promise<void> {
    const idToken = await this.getIdToken();
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

    const url = `${
      this.config.issuer
    }/protocol/openid-connect/logout?${params.toString()}`;
    window.location.href = url;
  }

  private async getRawDecryptedToken(tokenKey: string): Promise<string | null> {
    if (!this.storage) return null;
    const encryptedToken = this.storage.getItem(tokenKey);
    return encryptedToken
      ? decrypt(encryptedToken, this.encryptionConfig)
      : null;
  }

  private async isTokenExpired(): Promise<boolean> {
    try {
      const token = await this.getRawDecryptedToken("kc_access_token");
      if (!token) return true;

      const decoded = await getDecodedAccessToken(token);
      if (!decoded || !decoded.exp) return true;

      // Add a 30-second buffer to ensure we refresh before actual expiration
      const expirationTime = decoded.exp * 1000 - 30000;
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  }

  private async getDecryptedAccessToken(): Promise<string | null> {
    if (!this.storage) return null;

    try {
      const token = await this.getRawDecryptedToken("kc_access_token");
      if (!token) return null;

      // Check if token is expired and try to refresh if needed
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return await this.getRawDecryptedToken("kc_access_token");
        }
        return null;
      }

      return token;
    } catch (error) {
      console.error("Error getting decrypted access token:", error);
      return null;
    }
  }

  getAccessToken(): string | null {
    if (!this.storage) return null;
    return this.storage.getItem("kc_access_token");
  }

  async getIdToken(): Promise<string | null> {
    return this.getRawDecryptedToken("kc_id_token");
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getRawDecryptedToken("kc_refresh_token");
  }

  async getUserRoles(): Promise<string[]> {
    const token = await this.getDecryptedAccessToken();
    if (!token) return [];

    const decoded = await getDecodedAccessToken(token);
    return decoded?.realm_access?.roles || [];
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const result = await refreshAccessToken(refreshToken, this.config);
      if (!result.success || !result.tokens) return false;

      if (this.storage) {
        this.storage.setItem(
          "kc_access_token",
          encrypt(result.tokens.access_token, this.encryptionConfig)
        );
        this.storage.setItem(
          "kc_refresh_token",
          encrypt(result.tokens.refresh_token, this.encryptionConfig)
        );
        this.storage.setItem(
          "kc_id_token",
          encrypt(result.tokens.id_token, this.encryptionConfig)
        );
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getDecryptedAccessToken();
    if (!token) return false;

    const decoded = await getDecodedAccessToken(token);
    if (!decoded) return false;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  }

  async hasRole(role: string): Promise<boolean> {
    const roles = await this.getUserRoles();
    return roles.includes(role);
  }
}
