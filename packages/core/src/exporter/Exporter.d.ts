import type { InternalBuildConfig } from "../BuildConfig.js";
import type { BuildSnapshot } from "./BuildSnapshot.js";

export type ExporterContext = {
	config: InternalBuildConfig;
	readonly snapshot: BuildSnapshot;
	readonly manifestPath: string;
};

export type Exporter = {
	name: string;
	export(context: ExporterContext): Promise<void> | void;
};
