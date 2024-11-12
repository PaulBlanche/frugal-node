export interface Hash {
	update(data: Uint8Array | string): Hash;
	digest(): string;
}

interface HashCreator {
	create(): Hash;
}

export let Hash: HashCreator;
