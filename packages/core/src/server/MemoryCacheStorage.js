/** @import * as self from "./MemoryCacheStorage.js" */

/** @type {self.MemoryCacheStorageCreator} */
export const MemoryCacheStorage = {
	create,
};

/** @type {self.MemoryCacheStorageCreator['create']} */
function create() {
	const store = new Map();
	return {
		set(path, response) {
			store.set(path, response);
		},

		get(path) {
			return store.get(path);
		},
	};
}
