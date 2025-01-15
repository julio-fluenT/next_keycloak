import { KeycloakConfig } from "./types";
import { refreshAccessToken } from "./utils/tokenRefresher";
import { encrypt, decrypt } from "./utils/encryption";
import { getDecodedAccessToken } from "./utils/tokenUtils";

export class KeycloakNext {
  private config: KeycloakConfig;
  private storage: Storage | null = null;

  constructor(config: KeycloakConfig) {
    this.config = config;
    if (typeof window !== "undefined") {
      this.storage = window.localStorage;
    }
  }

  private async fetchWithCORS(url: string, options: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Accept": "application/json",
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
      this.storage.setItem("kc_access_token", encrypt(tokens.access_token));
      this.storage.setItem("kc_refresh_token", encrypt(tokens.refresh_token));
      this.storage.setItem("kc_id_token", encrypt(tokens.id_token));
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

  async getAccessToken(): Promise<string | null> {
    if (!this.storage) return null;
    const encryptedToken = this.storage.getItem("kc_access_token");
    return encryptedToken ? decrypt(encryptedToken) : null;
  }

  async getIdToken(): Promise<string | null> {
    if (!this.storage) return null;
    const encryptedToken = this.storage.getItem("kc_id_token");
    return encryptedToken ? decrypt(encryptedToken) : null;
  }

  async getRefreshToken(): Promise<string | null> {
    if (!this.storage) return null;
    const encryptedToken = this.storage.getItem("kc_refresh_token");
    return encryptedToken ? decrypt(encryptedToken) : null;
  }

  async getUserRoles(): Promise<string[]> {
    const token = await this.getAccessToken();
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
          encrypt(result.tokens.access_token)
        );
        this.storage.setItem(
          "kc_refresh_token",
          encrypt(result.tokens.refresh_token)
        );
        this.storage.setItem("kc_id_token", encrypt(result.tokens.id_token));
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
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
