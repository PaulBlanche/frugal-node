import { CacheStorage } from "frugal-node/server";

export interface KvStorage extends CacheStorage {}

interface KvStorageMaker {
	create(): KvStorage;
}

export const KvStorage: KvStorageMaker;
