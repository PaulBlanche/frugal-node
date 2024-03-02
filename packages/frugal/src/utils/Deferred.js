/** @type {import('./Deferred.ts').Maker} */
export const Deferred = {
	create,
};

/** @type {import('./Deferred.ts').Maker['create']} */
export function create() {
	let methods;
	let state = "pending";
	const promise = new Promise((resolve, reject) => {
		methods = {
			/** @param {unknown | PromiseLike<unknown>} value */
			async resolve(value) {
				await value;
				state = "fulfilled";
				resolve(value);
			},
			/** @param {any} reason */
			reject(reason) {
				state = "rejected";
				reject(reason);
			},
		};
	});
	Object.defineProperty(promise, "state", { get: () => state });
	return Object.assign(promise, methods);
}
