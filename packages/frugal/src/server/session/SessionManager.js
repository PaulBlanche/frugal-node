import { getCookies, setCookie } from "../../utils/cookies.js";
import { Session } from "./Session.js";

const DEFAULT_SESSION_COOKIE_NAME = "__frugal_session";

/** @type {import('./SessionManager.ts').SessionManagerMaker} */
export const SessionManager = {
	create,
};

/** @type {import('./SessionManager.ts').SessionManagerMaker['create']} */
function create(config) {
	const cookie = config.cookie ?? {};

	return {
		async get(headers) {
			const cookies = getCookies(headers);
			const id = cookies[cookie.name ?? DEFAULT_SESSION_COOKIE_NAME];
			if (id !== undefined) {
				const data = await config.storage.get(headers, id);
				if (data !== undefined) {
					return Session.create(data, id);
				}
			}
			return Session.create();
		},

		async persist(session, headers) {
			if (!session.shouldBePersisted) {
				return;
			}

			const expires = cookie.expires !== undefined ? Number(cookie.expires) : undefined;

			let id = session.id;
			const data = session.data;

			if (id !== undefined) {
				await config.storage.update(headers, id, data, expires);
			} else {
				id = await config.storage.create(headers, data, expires);
			}

			setCookie(headers, {
				name: DEFAULT_SESSION_COOKIE_NAME,
				...cookie,
				value: id,
			});
		},

		async destroy(session, headers) {
			if (session.id !== undefined) {
				await config.storage.delete(headers, session.id);
			}

			setCookie(headers, {
				name: DEFAULT_SESSION_COOKIE_NAME,
				...cookie,
				value: "",
				expires: new Date(0),
				maxAge: 0,
			});
		},
	};
}
