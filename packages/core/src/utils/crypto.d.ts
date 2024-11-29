export function importKey(key: string): Promise<CryptoKey>;
export function exportKey(): Promise<string>;
export function sign(cryptoKey: CryptoKey, data: string): Promise<Uint8Array>;
export function verify(cryptoKey: CryptoKey, signature: Uint8Array, data: string): Promise<boolean>;
export function token(cryptoKey: CryptoKey, data: Record<string, string>): Promise<string>;
export function decode(
	token: string,
):
	| { data: Record<string, string>; timestamp: number; payload: string; signature: Uint8Array }
	| undefined;
export function parseToken(
	cryptoKey: CryptoKey,
	token: string,
	msTimeout?: number,
): Promise<Record<string, string> | undefined>;
