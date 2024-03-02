import { Deferred } from "./Deferred.ts";

export function debounce<T>(
	stream: AsyncIterable<T>,
	interval: number,
): Generator<Deferred<T[]>, void, unknown>;
