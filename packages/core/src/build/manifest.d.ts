import type { Asset } from "../page/PageAssets.js";
import type { PageDescriptor, PathParamsList } from "../page/PageDescriptor.js";

export type WritableManifest = {
	hash: string;
	assets: Asset[];
	runtimeConfig: string;
	pages: {
		type?: "dynamic" | "static";
		params?: Partial<Record<string, string | string[]>>[];
		moduleHash: string;
		entrypoint: string;
		outputPath: string;
	}[];
};

export type StaticManifest = {
	hash: string;
	assets: Asset[];
	runtimeConfig: string;
	pages: {
		params?: Partial<Record<string, string | string[]>>[];
		moduleHash: string;
		entrypoint: string;
		descriptor: PageDescriptor;
	}[];
};

export type DynamicManifest = {
	hash: string;
	assets: Asset[];
	runtimeConfig: string;
	pages: {
		moduleHash: string;
		entrypoint: string;
		descriptor: PageDescriptor;
	}[];
};

type Config = {
	rootDir: string;
	outDir: string;
};

export function writeManifests(config: Config, manifest: WritableManifest): Promise<void>;

export function loadStaticManifest(config: Config): Promise<StaticManifest>;

export function loadDynamicManifest(config: Config): Promise<StaticManifest>;

export function getStaticManifestPath(config: Config): Promise<string>;

export function getDynamicManifestPath(config: Config): Promise<string>;

export class ManifestExecutionError extends Error {}
