import * as webstream from "node:stream/web";

export function toReadableStream<T>(stream: webstream.ReadableStream<T>): ReadableStream<T>;

export function fromReadableStream<T>(stream: ReadableStream<T>): webstream.ReadableStream<T>;

export function readStringStream(stream: webstream.ReadableStream<string>): Promise<string>;

/**
 * @param {webstream.ReadableStream<Uint8Array>} stream
 * @returns {Promise<Uint8Array>}
 */
export function readStream(stream: webstream.ReadableStream<Uint8Array>): Promise<Uint8Array>;

export class TextLineStream extends webstream.TransformStream<string, string> {}

export function mergeReadableStreams<T>(
	...streams: webstream.ReadableStream<T>[]
): webstream.ReadableStream<T>;
