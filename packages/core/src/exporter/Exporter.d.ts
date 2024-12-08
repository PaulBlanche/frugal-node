import type { InternalBuildConfig } from "../BuildConfig.js";
import type { Page } from "../page/Page.js";
import type { ServerData } from "../utils/serverData.js";
import type { BuildSnapshot } from "./BuildSnapshot.js";

export type ExporterContext = {
	config: InternalBuildConfig;
	readonly snapshot: BuildSnapshot;
	readonly staticManifestPath: string;
	readonly dynamicManifestPath: string;
};

export type Exporter = {
	name: string;
	validate?: (pages: Page<string, ServerData>[]) => Promise<void> | void;
	export(context: ExporterContext): Promise<void> | void;
};
