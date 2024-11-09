import type * as webstream from "node:stream/web";

export class TextLineStream extends webstream.TransformStream<string, string> {}

export function readStream(stream: webstream.ReadableStream<Uint8Array>): Promise<Uint8Array>;

export function mergeReadableStreams<T>(
	...streams: webstream.ReadableStream<T>[]
): webstream.ReadableStream<T>;
