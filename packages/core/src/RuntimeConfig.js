/** @import * as self from "./RuntimeConfig.js" */

import * as url from "node:url";
import { ServerCache } from "./server/ServerCache.js";
import { importKey } from "./utils/crypto.js";
import { config as configLog } from "./utils/log.js";

/** @type {self.RuntimeConfigCreator} */
export const RuntimeConfig = {
	create,
};

const DEFAULT_COMPRESS_OPTIONS =
	/** @type {const} */
	({
		brotli: true,
		gzip: true,
		deflate: true,
	});

/** @type {self.RuntimeConfigCreator['create']} */
function create(config) {
	configLog(config.log);

	const self = url.fileURLToPath(config.self);

	const state = {
		/** @type {Promise<CryptoKey>|undefined} */
		cryptoKey: undefined,
	};

	return {
		get self() {
			return self;
		},
		get secure() {
			return config?.secure ?? false;
		},

		get port() {
			return config?.port ?? 8000;
		},

		get cryptoKey() {
			if (state.cryptoKey === undefined) {
				state.cryptoKey = Promise.resolve(importKey(config.cryptoKey));
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

		get serverCache() {
			if (config.cacheStorage === undefined) {
				return undefined;
			}

			return ServerCache.create(config.cacheStorage);
		},

		get compress() {
			return {
				threshold: config.compress?.threshold ?? 1024,
				method:
					config.compress?.method === undefined || config.compress?.method === true
						? { ...DEFAULT_COMPRESS_OPTIONS }
						: config.compress?.method === false
							? {
									brotli: false,
									gzip: false,
									deflate: false,
								}
							: { ...DEFAULT_COMPRESS_OPTIONS, ...config.compress },
			};
		},
	};
}

export class RuntimeConfigError extends Error {}
