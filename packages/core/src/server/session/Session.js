/** @import * as self from "./Session.js" */

/** @type {self.SessionCreator} */
export const Session = {
	create,
};

/** @type {self.SessionCreator['create']} */
function create(data = {}, id = undefined) {
	const state = {
		/** @type {Map<string, any>} */
		data: new Map(Object.entries(data)),
		shouldBePersisted: false,
	};

	return {
		get id() {
			return id;
		},

		get data() {
			return Object.fromEntries(state.data);
		},

		get shouldBePersisted() {
			return state.shouldBePersisted;
		},

		persist() {
			state.shouldBePersisted = true;
		},

		get(key) {
			return state.data.get(key);
		},

		set(key, value) {
			state.data.set(key, value);
		},

		delete(key) {
			state.data.delete(key);
		},

		has(key) {
			return state.data.has(key);
		},
	};
}
