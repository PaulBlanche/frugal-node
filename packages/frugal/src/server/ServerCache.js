/** @import * as self from "./ServerCache.js" */

import { toResponse } from "../page/FrugalResponse.js";

/** @type {self.ServerCacheCreator} */
export const ServerCache = {
	create,
};

/** @type {self.ServerCacheCreator['create']} */
function create(storage) {
	return {
		async add(response) {
			return storage.set(response.path, await response.serialize());
		},

		async has(path) {
			const data = await storage.get(path);
			if (data === undefined) {
				return false;
			}
			return true;
		},

		async get(path) {
			const serializedCacheableResponse = await storage.get(path);
			if (serializedCacheableResponse === undefined) {
				return undefined;
			}

			return toResponse(serializedCacheableResponse);
		},
	};
}
