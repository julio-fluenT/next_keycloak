"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const DEFAULT_ENCRYPTION_KEY = 'your-default-encryption-key';
function encrypt(text, key = DEFAULT_ENCRYPTION_KEY) {
    // In a production environment, you should use a proper encryption library
    // This is a simple base64 encoding for demonstration
    return Buffer.from(text).toString('base64');
}
function decrypt(encryptedString, key = DEFAULT_ENCRYPTION_KEY) {
    // In a production environment, you should use a proper encryption library
    // This is a simple base64 decoding for demonstration
    return Buffer.from(encryptedString, 'base64').toString('utf-8');
}
