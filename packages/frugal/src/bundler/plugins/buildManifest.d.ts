import type * as esbuild from "esbuild";
import type { PrivatePluginContext } from "../PluginContext.ts";

export function buildManifest(context: PrivatePluginContext): esbuild.Plugin;
