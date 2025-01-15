const DEFAULT_ENCRYPTION_KEY = 'your-default-encryption-key';

export function encrypt(text: string, key: string = DEFAULT_ENCRYPTION_KEY): string {
  // In a production environment, you should use a proper encryption library
  // This is a simple base64 encoding for demonstration
  return Buffer.from(text).toString('base64');
}

export function decrypt(encryptedString: string, key: string = DEFAULT_ENCRYPTION_KEY): string {
  // In a production environment, you should use a proper encryption library
  // This is a simple base64 decoding for demonstration
  return Buffer.from(encryptedString, 'base64').toString('utf-8');
}
