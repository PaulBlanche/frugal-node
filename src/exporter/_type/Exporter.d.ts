import { FrugalConfig } from "../../Config.js";

export type ExporterContext = {
	config: FrugalConfig;
};

export interface Exporter {
	name: string;
	export: (context: ExporterContext) => Promise<void> | void;
}
