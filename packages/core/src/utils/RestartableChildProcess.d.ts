import type * as stream from "node:stream";
import type * as streamWeb from "node:stream/web";

export type RestartableChildProcessOptions = {
	args?: string[];
	env?: Record<string, string>;
};

export type ProcessStatus = {
	success: boolean;
	code?: number;
	signal?: NodeJS.Signals;
};

export type StdioStream = {
	streamReadable?: stream.Readable;
	stream: streamWeb.ReadableStream<Uint8Array>;
	controller?: ReadableStreamDefaultController<Uint8Array>;
};

export interface RestartableChildProcess {
	readonly status: Promise<ProcessStatus>;
	readonly stderr: streamWeb.ReadableStream<Uint8Array>;
	readonly stdout: streamWeb.ReadableStream<Uint8Array>;
	readonly pid: number | undefined;
	kill(signal?: NodeJS.Signals): Promise<void>;
	restart(): Promise<void>;
	addEventListener<TYPE extends keyof ListenerDict>(
		type: TYPE,
		listener: ListenerDict[TYPE],
	): void;
}

export type ErrorListener = (error: Error) => void;
export type RestartListener = () => void;
export type ExitListener = (code: number | null, signal: NodeJS.Signals | null) => void;

type ListenerDict = {
	exit: ExitListener;
	error: ErrorListener;
	restart: RestartListener;
};

export type Listeners = {
	exit: ExitListener[];
	error: ErrorListener[];
	restart: RestartListener[];
};

interface RestartableChildProcessCreator {
	spawn(command: string, options?: RestartableChildProcessOptions): RestartableChildProcess;
}

export let RestartableChildProcess: RestartableChildProcessCreator;
