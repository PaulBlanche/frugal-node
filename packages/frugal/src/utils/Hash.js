import murmur from "imurmurhash";

const DECODER = new TextDecoder();

/** @type {import('./Hash.ts').HashMaker} */
export const Hash = {
	create,
};

/** @type {import('./Hash.ts').HashMaker['create']} */
export function create() {
	const hasher = new murmur();

	return {
		update(data) {
			hasher.hash(typeof data === "string" ? data : DECODER.decode(data));
			return this;
		},
		digest() {
			return hasher.result().toString(36).toUpperCase();
		},
	};
}
