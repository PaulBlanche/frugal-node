import type { CacheStorage } from "@frugal-node/core/server";

export interface KvStorage extends CacheStorage {}

interface KvStorageCreator {
	create(): KvStorage;
}

export let KvStorage: KvStorageCreator;
