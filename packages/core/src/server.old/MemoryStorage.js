/** @import * as self from "./MemoryStorage.js" */

/** @type {self.MemoryStorageCreator} */
export const MemoryStorage = {
	create,
};

/** @type {self.MemoryStorageCreator['create']} */
function create() {
	const store = new Map();
	return {
		set(path, response) {
			store.set(path, response);
		},

		get(path) {
			return store.get(path);
		},

		delete(path) {
			store.delete(path);
		},
	};
}
