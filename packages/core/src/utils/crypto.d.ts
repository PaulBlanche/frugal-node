export function importKey(key: string): Promise<CryptoKey>;
export function exportKey(): Promise<string>;
export function sign(cryptoKey: CryptoKey, data: string): Promise<string>;
export function verify(cryptoKey: CryptoKey, signature: string, data: string): Promise<boolean>;
