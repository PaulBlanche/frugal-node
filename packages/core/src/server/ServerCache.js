/** @import * as self from "./ServerCache.js" */

import { FrugalResponse } from "../page/FrugalResponse.js";

/** @type {self.ServerCacheCreator} */
export const ServerCache = {
	create,
};

/** @type {self.ServerCacheCreator['create']} */
function create(storage) {
	return {
		add(response) {
			return Promise.resolve(storage.set(response.path, response.serialize()));
		},

		async get(path) {
			const serializedResponse = await storage.get(path);
			if (serializedResponse === undefined) {
				return undefined;
			}

			return FrugalResponse.from(serializedResponse);
		},

		invalidate(path) {
			return Promise.resolve(storage.delete(path));
		},
	};
}
