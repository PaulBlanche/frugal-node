import type {
	RestartableChildProcess,
	RestartableChildProcessOptions,
} from "../utils/RestartableChildProcess.js";

interface WatcherCreator {
	create(
		entrypoint: string,
		options: RestartableChildProcessOptions & { watch?: string[] | undefined },
	): Promise<Watcher>;
}

export interface Watcher {
	spawn(): RestartableChildProcess;
	dispose(): Promise<void>;
}

export let Watcher: WatcherCreator;
