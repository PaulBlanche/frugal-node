/** @import * as self from "./MemorySessionStorage.js" */

/** @type {self.MemorySessionStorageCreator} */
export const MemorySessionStorage = {
	create,
};

/** @type {self.MemorySessionStorageCreator['create']} */
function create() {
	const store = new Map();

	return {
		create(data, { expires }) {
			const id = crypto.randomUUID();

			store.set(id, { data, expires });

			return id;
		},

		get(id) {
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

		update(id, data, { expires }) {
			store.set(id, { data, expires });
		},

		delete(id) {
			store.delete(id);
		},
	};
}
