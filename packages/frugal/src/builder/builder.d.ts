import type { FrugalBuildConfig } from "../BuildConfig.js";
import type { FrugalConfig } from "../Config.ts";

export function build(config: FrugalConfig, buildConfig: FrugalBuildConfig): Promise<void>;
