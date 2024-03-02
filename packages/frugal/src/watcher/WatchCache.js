import * as generationResponse from "../page/GenerationResponse.js";

/** @type {import('./WatchCache.ts').Maker} */
export const WatchCache = {
	create,
};

/** @type {import('./WatchCache.ts').Maker['create']} */
export function create() {
	/** @type {Record<string, import("../page/GenerationResponse.ts").SerializedGenerationResponse>} */
	const data = {};

	return {
		async add(response) {
			if (response.path in data) {
				const previous = data[response.path];
				if (previous.hash === response.hash) {
					return;
				}
			}

			data[response.path] = await response.serialize();
		},

		async has(key) {
			const entry = data[key];
			if (entry === undefined) {
				return false;
			}
			return true;
		},

		async get(key) {
			const entry = await data[key];
			if (entry === undefined) {
				return undefined;
			}

			return generationResponse.toResponse(entry);
		},

		save() {
			return Promise.resolve();
		},
	};
}
