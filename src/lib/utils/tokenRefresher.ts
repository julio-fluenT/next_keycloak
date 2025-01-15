import { KeycloakConfig, TokenResponse } from '../types';

export async function refreshAccessToken(
  refreshToken: string,
  config: KeycloakConfig,
  attempt: number = 1
): Promise<{
  success: boolean;
  tokens?: TokenResponse;
}> {
  try {
    const response = await fetch(
      `${config.issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      return { success: false };
    }

    const tokens = await response.json();
    return { success: true, tokens };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false };
  }
}
