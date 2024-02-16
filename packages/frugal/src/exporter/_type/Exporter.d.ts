import type { FrugalConfig } from "../../Config.js";

export type ExporterContext = {
	config: FrugalConfig;
};

export type Exporter = {
	name: string;
	export(context: ExporterContext): Promise<void> | void;
};
