import { KeycloakConfig } from "./types";
export declare class KeycloakNext {
    private config;
    private storage;
    private static readonly ENCRYPTION_KEY;
    private static readonly ENCRYPTION_IV;
    private encryptionConfig;
    constructor(config: KeycloakConfig);
    setEncryptionConfig(encryptionKey: string, iv: string): void;
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
