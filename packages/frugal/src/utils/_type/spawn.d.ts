import type * as child_process from "node:child_process";
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

export type stdioStream = {
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
	addEventListener<TYPE extends keyof Listeners>(type: TYPE, listener: Listeners[TYPE]): void;
}

export type ErrorListener = (error: Error) => void;
export type RestartListener = () => void;
export type ExitListener = (code: number | null, signal: NodeJS.Signals | null) => void;

type Listeners = {
	exit: ExitListener;
	error: ErrorListener;
	restart: RestartListener;
};
