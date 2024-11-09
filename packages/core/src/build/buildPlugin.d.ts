import type { InternalPlugin } from "../esbuild/Plugin.js";
import type { BuildCache } from "./BuildCache.js";

export function buildPlugin(buildCache: BuildCache): InternalPlugin;
