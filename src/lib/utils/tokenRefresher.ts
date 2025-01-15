import { KeycloakConfig } from '../types';

export async function refreshAccessToken(
  refreshToken: string,
  config: KeycloakConfig,
  attempt: number = 1
): Promise<{
  success: boolean;
  tokens?: {
    access_token: string;
    refresh_token: string;
    id_token: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${config.issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokens = await response.json();

    return {
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
