/** @import * as self from "./crypto.js" */

const KEY_FORMAT = "jwk";
/** @type {HmacKeyGenParams} */
const KEY_ALGORITHM = { name: "HMAC", hash: "SHA-512" };
const KEY_EXTRACTABLE = true;
/** @type {KeyUsage[]} */
const KEY_USAGE = ["sign", "verify"];

/** @type {self.exportKey}*/
export async function exportKey() {
	const key = await crypto.subtle.generateKey(KEY_ALGORITHM, KEY_EXTRACTABLE, KEY_USAGE);
	const jsonWebKey = await crypto.subtle.exportKey(KEY_FORMAT, key);
	return btoa(JSON.stringify(jsonWebKey));
}

/** @type {self.importKey} */
export async function importKey(key) {
	/** @type {JsonWebKey} */
	const jsonWebKey = JSON.parse(atob(key));

	return await crypto.subtle.importKey(
		KEY_FORMAT,
		jsonWebKey,
		KEY_ALGORITHM,
		KEY_EXTRACTABLE,
		KEY_USAGE,
	);
}

const ENCODER = new TextEncoder();

/** @type {self.sign} */
export async function sign(cryptoKey, data) {
	const signature = await crypto.subtle.sign(KEY_ALGORITHM, cryptoKey, ENCODER.encode(data));
	return new Uint8Array(signature);
}

/** @type {self.verify} */
export async function verify(cryptoKey, signature, data) {
	return await crypto.subtle.verify(KEY_ALGORITHM, cryptoKey, signature, ENCODER.encode(data));
}

/** @type {self.token} */
export async function token(cryptoKey, data) {
	const payload = JSON.stringify([Date.now(), data]);

	return `${Buffer.from(payload, "utf8").toString("base64url")}.${Buffer.from(await sign(cryptoKey, payload)).toString("base64url")}`;
}

/** @type {self.forceGenerateToken} */
export function forceGenerateToken(cryptoKey) {
	return token(cryptoKey, { __fg: "true" });
}

/** @type {self.isForceGenerateTokenValid} */
export async function isForceGenerateTokenValid(cryptoKey, token, msTimeout) {
	const payload = await parseToken(cryptoKey, token, msTimeout);
	return payload !== undefined && payload["__fg"] === "true";
}

/** @type {self.refreshToken} */
export function refreshToken(cryptoKey) {
	return token(cryptoKey, { __rf: "true" });
}

/** @type {self.isRefreshTokenValid} */
export async function isRefreshTokenValid(cryptoKey, token, msTimeout) {
	const payload = await parseToken(cryptoKey, token, msTimeout);
	return payload !== undefined && payload["__rf"] === "true";
}

/** @type {self.decode} */
export function decode(token) {
	try {
		const [payloadB64, signatureB64] = token.split(".");

		const signature = new Uint8Array(Buffer.from(signatureB64, "base64url"));
		const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
		const [timestamp, data] = JSON.parse(payload);

		return { signature, data, timestamp, payload };
	} catch {
		return undefined;
	}
}

/** @type {self.parseToken} */
export async function parseToken(cryptoKey, token, msTimeout = 10 * 1000) {
	try {
		const result = decode(token);
		if (result === undefined) {
			return undefined;
		}

		const verified = await verify(cryptoKey, result.signature, result.payload);

		if (!verified) {
			return undefined;
		}

		const delta = Math.abs(Date.now() - Number(result.timestamp));

		if (delta > msTimeout) {
			return undefined;
		}

		return result.data;
	} catch {
		return undefined;
	}
}
