import type { ModuleWalker } from "../../../utils/ModuleWalker.js";
import type { MetaAsset, UrlMetaTransformer } from "./UrlMetaTransformer.js";

export function collectAndReplaceMetaAssets(
	modulePath: string,
	walker: ModuleWalker,
	transformer: UrlMetaTransformer,
): Promise<MetaAsset[]>;
