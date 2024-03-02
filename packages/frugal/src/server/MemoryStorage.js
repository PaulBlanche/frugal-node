/** @type {import('./MemoryStorage.ts').MemoryStorageMaker} */
export const MemoryStorage = {
	create,
};

/** @type {import('./MemoryStorage.ts').MemoryStorageMaker['create']} */
export function create() {
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
