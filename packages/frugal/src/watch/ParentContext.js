/** @import * as self from "./ParentContext.js" */
/** @import { Listener, EventType } from "./WatchProcess.js" */

import { WatchProcess } from "./WatchProcess.js";
import { LiveReloadServer } from "./livereload/LiveReloadServer.js";

/** @type {self.ParentContextCreator} */
export const ParentContext = {
	create,
};

/** @type {self.ParentContextCreator['create']} */
function create() {
	const liveReloadController = new AbortController();
	const watchProcess = WatchProcess.create();
	const liveReload = LiveReloadServer.create();
	/** @type {Listener[]} */
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
			watchProcess.addEventListener((type) => {
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
				watchProcess.spawn({
					entrypoint: process.argv[1],
					args: process.argv.slice(2),
				}),
			]);
		},

		async dispose() {
			liveReloadController.abort();
			await watchProcess.kill();
		},
	};

	/**
	 * @param {EventType} type
	 */
	function _emit(type) {
		for (const listener of listeners) {
			listener(type);
		}
	}
}
