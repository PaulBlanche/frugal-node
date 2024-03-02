import { kv } from "@vercel/kv";

/** @type {import('./KvStorage.ts').KvStorageMaker} */
export const KvStorage = {
	create,
};

/** @type {import('./KvStorage.ts').KvStorageMaker['create']} */
function create() {
	return {
		async set(path, response) {
			await kv.set(path, response);
		},
		async get(path) {
			/** @type {import("frugal-node/exporter").SerializedGenerationResponse|null} */
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
