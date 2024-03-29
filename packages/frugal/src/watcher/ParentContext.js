import * as watchProcess from "./WatchProcess.js";
import { LiveReloadServer } from "./livereload/LiveReloadServer.js";

/** @type {import('./ParentContext.ts').ParentContextMaker} */
export const ParentContext = {
	create,
};

/** @type {import('./ParentContext.ts').ParentContextMaker['create']} */
export function create() {
	const liveReloadController = new AbortController();
	const process = watchProcess.create();
	const liveReload = LiveReloadServer.create();
	/** @type {import("./WatchProcess.ts").Listener[]} */
	const listeners = [];

	return {
		addEventListener(listener) {
			listeners.push(listener);
		},

		removeEventListener(listener) {
			const index = listeners.indexOf(listener);
			if (index !== -1) {
				listeners.splice(index, 1);
			}
		},
		async watch() {
			process.addEventListener((type) => {
				switch (type) {
					case "build:start": {
						liveReload.dispatch({ type: "suspend" });
						break;
					}
					case "build:end": {
						liveReload.dispatch({ type: "reload" });
						break;
					}
				}
				_emit(type);
			});

			await Promise.all([
				liveReload.serve({
					signal: liveReloadController.signal,
				}),
				process.spawn(),
			]);
		},

		async dispose() {
			liveReloadController.abort();
			await process.kill();
		},
	};

	/**
	 * @param {watchProcess.EventType} type
	 */
	function _emit(type) {
		for (const listener of listeners) {
			listener(type);
		}
	}
}
