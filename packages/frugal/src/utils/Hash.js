/** @import * as self from "./Hash.js" */

import murmur from "imurmurhash";

const DECODER = new TextDecoder();

/** @type {self.HashCreator} */
export const Hash = {
	create,
};

/** @type {self.HashCreator['create']} */
function create() {
	const hasher = new murmur();

	/** @type {self.Hash} */
	const self = {
		update,
		digest,
	};

	return self;

	/** @type {self.Hash['update']} */
	function update(data) {
		hasher.hash(typeof data === "string" ? data : DECODER.decode(data));
		return self;
	}

	/** @type {self.Hash['digest']} */
	function digest() {
		return hasher.result().toString(36).toUpperCase();
	}
}
