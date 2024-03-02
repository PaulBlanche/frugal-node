import { ChildProcess, ChildProcessOptions } from "../utils/ChildProcess.ts";

export function spawnWatcher(
	entrypoint: string,
	options: Omit<ChildProcessOptions, "args">,
): Promise<ChildProcess>;
