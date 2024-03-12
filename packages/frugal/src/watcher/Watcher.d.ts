import { ChildProcess, ChildProcessOptions } from "../utils/ChildProcess.ts";

interface WatcherMaker {
	create(entrypoint: string, options: Omit<ChildProcessOptions, "args">): Promise<Watcher>;
}

export interface Watcher {
	spawn(): ChildProcess;
	dispose(): Promise<void>;
}

export const Watcher: WatcherMaker;
