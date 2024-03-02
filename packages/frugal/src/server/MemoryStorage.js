/** @type {import('./MemoryStorage.ts').Maker} */
export const MemoryStorage = {
	create,
};

/** @type {import('./MemoryStorage.ts').Maker['create']} */
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
