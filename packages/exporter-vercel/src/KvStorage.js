/** @import * as self from "./KvStorage.js" */
/** @import { SerializedFrugalResponse } from "@frugal-node/core/server"; */

import { kv } from "@vercel/kv";

/** @type {self.KvStorageCreator} */
export const KvStorage = {
	create,
};

/** @type {self.KvStorageCreator['create']} */
function create() {
	return {
		async set(path, response) {
			await kv.set(path, response);
		},
		async get(path) {
			/** @type {SerializedFrugalResponse|null} */
			const data = await kv.get(path);
			if (data === null) {
				return undefined;
			}
			return data;
		},
		async delete(path) {
			await kv.del(path);
		},
	};
}
