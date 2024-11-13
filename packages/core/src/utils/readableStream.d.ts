// biome-ignore lint/correctness/noUnusedImports: false positive
import type { ReadableStream, TransformStream as TransformWebStream } from "node:stream/web";

// biome-ignore lint/correctness/noUndeclaredVariables: false positive
export class TextLineStream extends TransformWebStream<string, string> {}

export function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array>;

export function mergeReadableStreams<T>(...streams: ReadableStream<T>[]): ReadableStream<T>;
