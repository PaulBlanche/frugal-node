import { Deferred } from "./Deferred.js";

/**
 * @type {import('./asyncIterator.ts').debounce}
 */
export function* debounce(stream, interval) {
	/** @type {boolean | undefined} */
	let first; // is this first event?  will pass
	/** @type {unknown[]} */
	const buffer = []; // the last event raised
	/** @type {import('./Deferred.ts').Deferred<unknown[]>} */
	let awaiter; // deferred promise instance
	let continueWaiting = true;

	/** @param {boolean} isFirst */
	function reset(isFirst) {
		first = isFirst;
		buffer.length = 0;
		awaiter = Deferred.create();
	}

	function passEvent() {
		// if no event to pass
		if (buffer.length === 0) {
			first = true; // reset first state
			return;
		}

		const eventsToEmit = [...buffer];
		const currentDeferred = awaiter;
		reset(false);
		setTimeout(passEvent, interval);
		currentDeferred.resolve(eventsToEmit);
	}

	reset(true);
	destreamify(stream, {
		onEvent: (event) => {
			buffer.push(event);
			if (first) {
				passEvent();
			}
		},
		onEnd: () => {
			continueWaiting = false;
		},
	});

	while (continueWaiting) {
		// @ts-expect-error: deferred is definitly assigned before in `reset` call
		yield awaiter;
	}
}

/**
 * @template T
 * @param {AsyncIterable<T>} stream
 * @param {{ onEvent: (event: T) => void, onEnd: () => void }} config
 */
async function destreamify(stream, config) {
	for await (const event of stream) {
		config.onEvent(event);
	}
	config.onEnd();
}
