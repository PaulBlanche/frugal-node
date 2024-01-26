import * as esbuild from "esbuild";

export type ScriptOptions = {
	outdir: string;
	filter: RegExp;
	esbuildOptions?: Omit<
		esbuild.BuildOptions,
		"entryPoints" | "outdir" | "bundle" | "absWorkingDir" | "metafile"
	>;
};

declare module "../../../page/_type/Assets.d.ts" {
	interface AssetTypes {
		js: BasePageAsset<"js"> & { path: string };
	}
}
