import type { InternalServerConfig, ServerConfig } from "./server/ServerConfig.js";

export type RuntimeConfig = ServerConfig & {
	self: string;
};

export type InternalRuntimeConfig = InternalServerConfig & {
	readonly self: string;
};

interface RuntimeConfigCreator {
	create(config: RuntimeConfig): InternalRuntimeConfig;
}

export let RuntimeConfig: RuntimeConfigCreator;

export class RuntimeConfigError extends Error {}
