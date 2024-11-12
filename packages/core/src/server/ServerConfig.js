/** @import * as self from "./ServerConfig.js" */

import { importKey } from "../utils/crypto.js";

/** @type {self.ServerConfigCreator} */
export const ServerConfig = {
	create,
};

/** @type {self.ServerConfigCreator['create']} */
function create(config) {
	const state = {
		/** @type {Promise<CryptoKey|undefined>|undefined} */
		cryptoKey: undefined,
	};
	return {
		get secure() {
			return config?.secure ?? false;
		},

		get port() {
			return config?.port ?? 8000;
		},

		get cryptoKey() {
			if (state.cryptoKey === undefined) {
				state.cryptoKey = Promise.resolve(
					config?.cryptoKey ? importKey(config.cryptoKey) : undefined,
				);
			}
			return state.cryptoKey;
		},

		get session() {
			if (config.session === undefined) {
				return undefined;
			}

			return {
				storage: config.session.storage,
				cookie: {
					name: "__frugal_session",
				},
			};
		},

		get middlewares() {
			return config?.middlewares ?? [];
		},
	};
}
