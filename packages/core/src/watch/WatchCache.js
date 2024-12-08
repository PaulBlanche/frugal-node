/** @import * as self from "./WatchCache.js" */
/** @import { SerializedFrugalResponse } from "../page/FrugalResponse.js" */

import { FrugalResponse } from "../page/FrugalResponse.js";
import * as fs from "../utils/fs.js";

/** @type {self.WatchCacheCreator} */
export const WatchCache = {
	create,
};

/** @type {self.WatchCacheCreator['create']} */
function create(config) {
	/** @type {Record<string, SerializedFrugalResponse>} */
	const data = config?.data ?? {};

	return {
		build: {
			async add(response) {
				if (response.path in data) {
					const previous = data[response.path];
					if (previous.hash === response.hash) {
						return Promise.resolve();
					}
				}

				data[response.path] = response.serialize();
				await _save();
			},

			save: _save,
		},
		server: {
			async add(response) {
				data[response.path] = response.serialize();

				await _save();
			},

			get(url) {
				const path = new URL(url).pathname;
				const serializedResponse = data[path];

				return Promise.resolve(FrugalResponse.from(serializedResponse));
			},
		},
	};

	async function _save() {
		if (config?.file !== undefined) {
			await fs.ensureFile(config.file);
			await fs.writeTextFile(config.file, JSON.stringify(data));
		}
	}
}
