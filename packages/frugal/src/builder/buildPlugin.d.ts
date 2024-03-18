import type { PrivatePlugin } from "../bundler/Plugin.js";
import type { BuildCache } from "./BuildCache.js";

export function buildPlugin(buildCache: BuildCache): PrivatePlugin;
