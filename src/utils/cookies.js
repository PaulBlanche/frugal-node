import { parse, serialize } from "cookie";
import * as _type from "./_type/cookies.js";

/** @typedef {_type.Cookie} Cookie */

/**
 * @param {Headers} headers
 * @param {_type.Cookie} cookie
 */
export function setCookie(headers, cookie) {
	const value = cookieToString(cookie);
	if (value !== "") {
		headers.append("Set-Cookie", value);
	}
}

/**
 * @param {Headers} headers
 * @returns {Record<string, string>}
 */
export function getCookie(headers) {
	const cookie = headers.get("Cookie");
	if (cookie !== null) {
		return parse(cookie);
	}
	return {};
}

/**
 * @param {_type.Cookie} cookie
 * @returns {string}
 */
function cookieToString(cookie) {
	return serialize(cookie.name, cookie.value, {
		...cookie,
		expires: cookie.expires === undefined ? undefined : new Date(cookie.expires),
	});
}
