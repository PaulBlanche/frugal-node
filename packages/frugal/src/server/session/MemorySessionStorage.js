/** @type {import('./MemorySessionStorage.ts').MemorySessionStorageMaker} */
export const MemoryStorage = {
	create,
};

/** @type {import('./MemorySessionStorage.ts').MemorySessionStorageMaker['create']} */
export function create() {
	const store = new Map();

	return {
		create(_headers, data, expires) {
			const id = crypto.randomUUID();

			store.set(id, { data, expires });

			return id;
		},

		get(_headers, id) {
			const stored = store.get(id);

			if (stored === undefined) {
				return undefined;
			}

			if (stored.expires && stored.expires < Date.now()) {
				store.delete(id);
				return undefined;
			}

			return stored.data;
		},

		update(_headers, id, data, expires) {
			store.set(id, { data, expires });
		},

		delete(_headers, id) {
			store.delete(id);
		},
	};
}
