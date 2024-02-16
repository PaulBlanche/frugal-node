import { Config, FrugalConfig } from "../../Config.js";
import { Manifest } from "../../builder/Manifest.js";
import { RuntimeCache } from "../cache/Cache.js";

export type ServerConfig = {
	config: FrugalConfig | Config;
	watch: boolean;
	manifest: Manifest;
	cache: RuntimeCache;
};
