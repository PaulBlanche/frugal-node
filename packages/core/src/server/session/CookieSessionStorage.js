/** @import * as self from "./CookieSessionStorage.js" */

import { getCookies, setCookie } from "../../utils/cookies.js";

const DEFAULT_COOKIE_NAME = "__frugal_session_storage";

/** @type {self.CookieSessionStorageCreator} */
export const CookieSessionStorage = {
	create,
};

/** @type {self.CookieSessionStorageCreator['create']} */
function create(cookie = {}) {
	return {
		create(data, { headers, expires }) {
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;

			setCookie(headers, {
				...cookie,
				name: cookieName,
				value: JSON.stringify(data),
				expires,
			});

			return "";
		},

		get(_id, { headers }) {
			const cookies = getCookies(headers);
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;
			const serializedData = cookies[cookieName];
			if (serializedData === undefined) {
				return undefined;
			}
			return JSON.parse(serializedData);
		},

		update(_id, data, { expires, headers }) {
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;

			setCookie(headers, {
				...cookie,
				name: cookieName,
				value: JSON.stringify(data),
				expires,
			});
		},

		delete(_id, { headers }) {
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;

			setCookie(headers, {
				...cookie,
				name: cookieName,
				value: "",
				expires: new Date(0),
				maxAge: 0,
			});
		},
	};
}
