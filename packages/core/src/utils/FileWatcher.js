/** @import * as self from "./FileWatcher.js" */

import events from "node:events";
import * as chokidar from "chokidar";
import { debounce } from "./asyncIterator.js";

/** @type {self.FileWatcherCreator}*/
export const FileWatcher = {
	watch,
};

/** @type {self.FileWatcherCreator['watch']}*/
export function watch(paths, { interval = 300 } = {}) {
	const watcher = chokidar.watch(paths, { ignoreInitial: true });

	/**@type {Promise<void>} */
	const readyPromise = new Promise((res) => {
		watcher.on("ready", () => {
			res();
		});
	});

	return {
		get ready() {
			return readyPromise;
		},
		close() {
			return Promise.resolve(watcher.close());
		},
		[Symbol.asyncIterator]() {
			return asyncIterator();
		},
	};

	async function* asyncIterator() {
		const chokidarAsyncIterator =
			/** @type {AsyncIterable<["add" | "addDir" | "change" | "unlink" | "unlinkDir", string]>} */ (
				events.on(watcher, "all")
			);

		for await (const events of debounce(chokidarAsyncIterator, interval)) {
			/** @type {Partial<Record<self.FsEvent["type"], string[]>>} */
			const combinedEvents = {};

			for (const [type, path] of events) {
				const standardType = mapEventType(type);
				combinedEvents[standardType] = combinedEvents[standardType] ?? [];
				combinedEvents[standardType]?.push(path);
			}

			for (const [type, paths] of Object.entries(combinedEvents)) {
				yield/** @type {self.FsEvent} */ ({ type, paths });
			}
		}
	}

	/**
	 * @param {"add" | "addDir" | "change" | "unlink" | "unlinkDir"} type
	 * @returns {self.FsEvent["type"]}
	 */
	function mapEventType(type) {
		switch (type) {
			case "add": {
				return "create";
			}
			case "addDir": {
				return "create";
			}
			case "change": {
				return "modify";
			}
			case "unlink": {
				return "remove";
			}
			case "unlinkDir": {
				return "remove";
			}
		}
	}
}
