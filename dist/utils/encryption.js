"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
function encrypt(text, encryptionConfig) {
    const { encryptionKey, iv } = encryptionConfig;
    if (encryptionKey.length !== 32) {
        throw new Error("Encryption key must be 32 characters long");
    }
    if (iv.length !== 16) {
        throw new Error("Initialization vector (IV) must be 16 characters long");
    }
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey), Buffer.from(iv));
    let encrypted = cipher.update(text, "utf-8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}
function decrypt(encryptedString, encryptionConfig) {
    const { encryptionKey, iv } = encryptionConfig;
    if (encryptionKey.length !== 32) {
        throw new Error("Decryption key must be 32 characters long");
    }
    if (iv.length !== 16) {
        throw new Error("Initialization vector (IV) must be 16 characters long");
    }
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey), Buffer.from(iv));
    let decrypted = decipher.update(encryptedString, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
}
