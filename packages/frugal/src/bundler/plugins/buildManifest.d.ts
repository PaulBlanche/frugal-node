import * as esbuild from "esbuild";
import { PrivatePluginContext } from "../PluginContext.ts";

export function buildManifest(context: PrivatePluginContext): esbuild.Plugin;
