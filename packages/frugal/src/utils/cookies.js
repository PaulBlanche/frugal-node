/** @import * as self from "./cookies.js" */

import { parse, serialize } from "cookie";

/** @type {self.setCookie} */
export function setCookie(headers, cookie) {
	const value = cookieToString(cookie);
	if (value !== "") {
		headers.append("Set-Cookie", value);
	}
}

/** @type {self.getCookies} */
export function getCookies(headers) {
	const cookie = headers.get("Cookie");
	if (cookie !== null) {
		return parse(cookie);
	}
	return {};
}

/**
 * @param {self.Cookie} cookie
 * @returns {string}
 */
function cookieToString(cookie) {
	return serialize(cookie.name, cookie.value, {
		...cookie,
		expires: cookie.expires === undefined ? undefined : new Date(cookie.expires),
	});
}
