import { KeycloakConfig } from '../types';
export declare function refreshAccessToken(refreshToken: string, config: KeycloakConfig, attempt?: number): Promise<{
    success: boolean;
    tokens?: {
        access_token: string;
        refresh_token: string;
        id_token: string;
    };
    error?: string;
}>;
