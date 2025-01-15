import { KeycloakConfig } from "./types";
export declare class KeycloakNext {
    private config;
    private storage;
    constructor(config: KeycloakConfig);
    private fetchWithCORS;
    signIn(redirectUri?: string): Promise<void>;
    handleCallback(code: string): Promise<{
        access_token: string;
        refresh_token: string;
        id_token: string;
    }>;
    logout(redirectUri?: string): Promise<void>;
    getAccessToken(): Promise<string | null>;
    getIdToken(): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    getUserRoles(): Promise<string[]>;
    refreshToken(): Promise<boolean>;
    isAuthenticated(): Promise<boolean>;
    hasRole(role: string): Promise<boolean>;
}
