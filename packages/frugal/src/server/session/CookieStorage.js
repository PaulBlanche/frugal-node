import { getCookies, setCookie } from "../../utils/cookies.js";

const DEFAULT_COOKIE_NAME = "__frugal_session_storage";

/** @type {import('./CookieStorage.ts').Maker} */
export const CookieStorage = {
	create,
};

/** @type {import('./CookieStorage.ts').Maker['create']} */
function create(cookie = {}) {
	return {
		create(headers, data, expires) {
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;

			setCookie(headers, {
				...cookie,
				name: cookieName,
				value: JSON.stringify(data),
				expires,
			});

			return "";
		},

		get(headers, _id) {
			const cookies = getCookies(headers);
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;
			const serializedData = cookies[cookieName];
			return JSON.parse(serializedData);
		},

		update(headers, _id, data, expires) {
			const cookieName = cookie.name ?? DEFAULT_COOKIE_NAME;

			setCookie(headers, {
				...cookie,
				name: cookieName,
				value: JSON.stringify(data),
				expires,
			});
		},

		delete(headers, _id) {
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
