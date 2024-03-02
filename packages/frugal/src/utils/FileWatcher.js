import events from "node:events";
import * as chokidar from "chokidar";
import { debounce } from "./asyncIterator.js";

/** @type {import('./FileWatcher.ts').FileWatcherMaker}*/
export const FileWatcher = {
	watch,
};

/** @type {import('./FileWatcher.ts').FileWatcherMaker['watch']}*/
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
			return watcher.close();
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
			/** @type {Partial<Record<import('./FileWatcher.ts').FsEvent["type"], string[]>>} */
			const combinedEvents = {};

			for (const [type, path] of events) {
				const standardType = mapEventType(type);
				combinedEvents[standardType] = combinedEvents[standardType] ?? [];
				combinedEvents[standardType]?.push(path);
				combinedEvents["any"] = combinedEvents["any"] ?? [];
				combinedEvents["any"]?.push(path);
			}

			for (const [type, paths] of Object.entries(combinedEvents)) {
				yield/** @type {import('./FileWatcher.ts').FsEvent} */ ({ type, paths });
			}
		}
	}

	/**
	 * @param {"add" | "addDir" | "change" | "unlink" | "unlinkDir"} type
	 * @returns {import('./FileWatcher.ts').FsEvent["type"]}
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
