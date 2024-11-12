export function debounce<T>(
	stream: AsyncIterable<T>,
	interval: number,
): Generator<Promise<T[]>, void, unknown>;
