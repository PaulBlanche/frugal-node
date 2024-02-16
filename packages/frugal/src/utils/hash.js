import murmur from "imurmurhash";

const DECODER = new TextDecoder();

class Hasher {
	/** @type {ReturnType<typeof murmur>} */
	#hasher;

	/** @param {ReturnType<typeof murmur>} hasher */
	constructor(hasher) {
		this.#hasher = hasher;
	}

	/**
	 * @param {Uint8Array | string} data
	 * @returns {Hasher}
	 */
	update(data) {
		this.#hasher.hash(typeof data === "string" ? data : DECODER.decode(data));
		return this;
	}

	/** @returns {string} */
	digest() {
		return this.#hasher.result().toString(36).toUpperCase();
	}
}

/** @returns {Hasher} */
export function create() {
	return new Hasher(new murmur());
}
