/** @import * as self from "./SessionManager.js" */

import { getCookies, setCookie } from "../../utils/cookies.js";
import { Session } from "./Session.js";

/** @type {self.SessionManagerCreator} */
export const SessionManager = {
	create,
};

/** @type {self.SessionManagerCreator['create']} */
function create(config) {
	const cookie = config.cookie;

	return {
		async get(headers) {
			const cookies = getCookies(headers);
			const id = cookies[config.cookie.name];
			if (id !== undefined) {
				const data = await config.storage.get(id, { headers });
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

			const expires =
				cookie.maxAge !== undefined ? Date.now() + cookie.maxAge * 1000 : undefined;

			let id = session.id;
			const data = session.data;

			if (id !== undefined) {
				await config.storage.update(id, data, { headers, expires });
			} else {
				id = await config.storage.create(data, { headers, expires });
			}

			setCookie(headers, {
				...cookie,
				value: id,
			});
		},

		async destroy(session, headers) {
			if (session.id !== undefined) {
				await config.storage.delete(session.id, { headers });
			}

			setCookie(headers, {
				...cookie,
				value: "",
				expires: new Date(0),
				maxAge: 0,
			});
		},
	};
}
