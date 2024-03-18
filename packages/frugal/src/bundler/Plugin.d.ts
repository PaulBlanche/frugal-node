import type * as esbuild from "esbuild";
import type { PluginContext, PrivatePluginContext } from "./PluginContext.ts";

export type Plugin = {
	name: string;
	setup: (build: esbuild.PluginBuild, context: PluginContext) => void | Promise<void>;
};

export type PrivatePlugin = {
	name: string;
	setup: (build: esbuild.PluginBuild, context: PrivatePluginContext) => void | Promise<void>;
};
