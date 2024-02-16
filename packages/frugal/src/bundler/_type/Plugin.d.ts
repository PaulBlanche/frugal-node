import type * as esbuild from "esbuild";
import type { PluginContext } from "../PluginContext.js";

export type Plugin = {
	name: string;
	setup: (build: esbuild.PluginBuild, context: PluginContext) => void | Promise<void>;
};
