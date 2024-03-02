import type * as stream from "node:stream";
import type * as streamWeb from "node:stream/web";

export type ChildProcessOptions = {
	args?: string[];
	env?: Record<string, string>;
};

export type ChildProcessStatus = {
	success: boolean;
	code?: number;
	signal?: NodeJS.Signals;
};

type StdioStream = {
	streamReadable?: stream.Readable;
	stream: streamWeb.ReadableStream<Uint8Array>;
	controller?: ReadableStreamDefaultController<Uint8Array>;
};

export interface ChildProcess {
	readonly status: Promise<ChildProcessStatus>;
	readonly stderr: streamWeb.ReadableStream<Uint8Array>;
	readonly stdout: streamWeb.ReadableStream<Uint8Array>;
	readonly pid: number | undefined;
	kill(signal?: NodeJS.Signals): void;
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

type Listeners = {
	exit: ExitListener[];
	error: ErrorListener[];
	restart: RestartListener[];
};

interface ChildProcessMaker {
	spawn(command: string, options?: ChildProcessOptions): ChildProcess;
}

export const ChildProcess: ChildProcessMaker;
