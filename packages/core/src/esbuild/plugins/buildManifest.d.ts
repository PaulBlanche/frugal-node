import type * as esbuild from "esbuild";
import type { InternalPluginContext } from "../Plugin.js";

export function buildManifest(context: InternalPluginContext): esbuild.Plugin;
