import * as http from "../../utils/http.js";
import * as sessionStorage from "./sessionStorage.js";

/**
 * @implements {sessionStorage.SessionStorage}
 */
export class CookieSessionStorage {
	/** @type {http.CookieConfig} */
	#cookie;

	/**
	 * @param {http.CookieConfig} [cookie]
	 */
	constructor(cookie = {}) {
		this.#cookie = cookie;
	}

	/**
	 * @param {Headers} headers
	 * @param {sessionStorage.SessionData} data
	 * @param {number | undefined} expires
	 * @returns {string}
	 */
	create(headers, data, expires) {
		const cookieName = this.#cookie.name ?? "__frugal_session_storage";

		http.setCookie(headers, {
			...this.#cookie,
			name: cookieName,
			value: JSON.stringify(data),
			expires,
		});

		return "";
	}

	/**
	 * @param {Headers} headers
	 * @param {string} _id
	 * @returns {sessionStorage.SessionData | undefined}
	 */
	get(headers, _id) {
		const cookies = http.getCookies(headers);
		const cookieName = this.#cookie.name ?? "__frugal_session_storage";
		const serializedData = cookies[cookieName];
		return JSON.parse(serializedData);
	}

	/**
	 * @param {Headers} headers
	 * @param {string} _id
	 * @param {sessionStorage.SessionData} data
	 * @param {number|undefined} [expires]
	 */
	update(headers, _id, data, expires) {
		const cookieName = this.#cookie.name ?? "__frugal_session_storage";

		http.setCookie(headers, {
			...this.#cookie,
			name: cookieName,
			value: JSON.stringify(data),
			expires,
		});
	}

	/**
	 * @param {Headers} headers
	 * @param {string} _id
	 */
	delete(headers, _id) {
		const cookieName = this.#cookie.name ?? "__frugal_session_storage";

		http.setCookie(headers, {
			...this.#cookie,
			name: cookieName,
			value: "",
			expires: new Date(0),
			maxAge: 0,
		});
	}
}
