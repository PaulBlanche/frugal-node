/** @import * as self from "./WatchCache.js" */
/** @import { SerializedFrugalResponse } from "../page/FrugalResponse.js" */

import { toResponse } from "../page/FrugalResponse.js";

/** @type {self.WatchCacheCreator} */
export const WatchCache = {
	create,
};

/** @type {self.WatchCacheCreator['create']} */
function create() {
	/** @type {Record<string, SerializedFrugalResponse>} */
	const data = {};

	return {
		add(response) {
			if (response.path in data) {
				const previous = data[response.path];
				if (previous.hash === response.hash) {
					return Promise.resolve();
				}
			}

			data[response.path] = response.serialize();

			return Promise.resolve();
		},

		has(key) {
			const entry = data[key];
			if (entry === undefined) {
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		},

		async get(key) {
			const entry = await data[key];
			if (entry === undefined) {
				return undefined;
			}

			return toResponse(entry);
		},

		save() {
			return Promise.resolve();
		},
	};
}
