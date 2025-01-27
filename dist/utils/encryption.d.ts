export declare function encrypt(text: string, encryptionConfig: {
    encryptionKey: string;
    iv: string;
}): string;
export declare function decrypt(encryptedString: string, encryptionConfig: {
    encryptionKey: string;
    iv: string;
}): string;
