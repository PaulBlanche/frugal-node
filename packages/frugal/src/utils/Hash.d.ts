export interface Hash {
	update(data: Uint8Array | string): Hash;
	digest(): string;
}

interface HashMaker {
	create(): Hash;
}

export const Hash: HashMaker;
