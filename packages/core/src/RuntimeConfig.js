/** @import * as self from "./RuntimeConfig.js" */

import * as url from "node:url";
import { ServerCache } from "./server/ServerCache.js";
import * as cookies from "./utils/cookies.js";
import * as crypto from "./utils/crypto.js";
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
function create(config, cacheHandler) {
	configLog(config.log);

	const self = url.fileURLToPath(config.self);

	const state = {
		/** @type {Promise<CryptoKey>|undefined} */
		cryptoKey: undefined,
	};

	const serverCache =
		config.cacheStorage === undefined ? undefined : ServerCache.create(config.cacheStorage);

	const defaultCacheHandler = createDefaultCacheHandler(_getCryptoKey());

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
			return _getCryptoKey();
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
			return serverCache;
		},

		get compress() {
			if (config.compress === false) {
				return {
					threshold: Number.POSITIVE_INFINITY,
					method: {
						brotli: false,
						gzip: false,
						deflate: false,
					},
				};
			}
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

		get cacheHandler() {
			return cacheHandler ?? defaultCacheHandler;
		},
	};

	function _getCryptoKey() {
		if (state.cryptoKey === undefined) {
			state.cryptoKey = crypto.importKey(config.cryptoKey);
		}
		return state.cryptoKey;
	}
}

const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

/**
 *
 * @param {Promise<CryptoKey>} cryptoKey
 * @returns {self.CacheHandler}
 */
function createDefaultCacheHandler(cryptoKey) {
	return {
		async forceRefresh({ url, cache }) {
			try {
				if (cache === undefined) {
					return true;
				}

				await cache.invalidate(url.pathname);
				return true;
			} catch {
				return false;
			}
		},

		async setupForceGenerate(response) {
			cookies.setCookie(response.headers, {
				httpOnly: true,
				name: FORCE_GENERATE_COOKIE,
				value: await crypto.forceGenerateToken(await cryptoKey),
				path: "/",
			});
		},

		async shouldForceGenerate(request) {
			const cookis = cookies.getCookies(request.headers);
			const forceGenerateToken = cookis[FORCE_GENERATE_COOKIE];
			if (forceGenerateToken === undefined) {
				return false;
			}
			return await crypto.isForceGenerateTokenValid(await cryptoKey, forceGenerateToken);
		},

		cleanupForceGenerate(response) {
			cookies.setCookie(response.headers, {
				httpOnly: true,
				name: FORCE_GENERATE_COOKIE,
				value: "",
				expires: new Date(0),
				maxAge: 0,
			});
		},
	};
}

export class RuntimeConfigError extends Error {}
