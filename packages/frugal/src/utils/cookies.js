import { parse, serialize } from "cookie";

/** @type {import('./cookies.ts').setCookie} */
export function setCookie(headers, cookie) {
	const value = cookieToString(cookie);
	if (value !== "") {
		headers.append("Set-Cookie", value);
	}
}

/** @type {import('./cookies.ts').getCookies} */
export function getCookies(headers) {
	const cookie = headers.get("Cookie");
	if (cookie !== null) {
		return parse(cookie);
	}
	return {};
}

/**
 * @param {import('./cookies.ts').Cookie} cookie
 * @returns {string}
 */
function cookieToString(cookie) {
	return serialize(cookie.name, cookie.value, {
		...cookie,
		expires: cookie.expires === undefined ? undefined : new Date(cookie.expires),
	});
}
