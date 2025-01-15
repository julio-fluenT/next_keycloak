import { KeycloakConfig, TokenResponse } from '../types';
export declare function refreshAccessToken(refreshToken: string, config: KeycloakConfig, attempt?: number): Promise<{
    success: boolean;
    tokens?: TokenResponse;
}>;
