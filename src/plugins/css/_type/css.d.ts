import * as esbuild from "esbuild";

export type CssOptions = {
	outdir?: string;
	scope?: "global" | "page";
	globalCss?: string[] | string;
	cssModule?:
		| boolean
		| {
				pattern?: string;
				dashedIdents?: boolean;
		  };
	esbuildOptions?: Omit<
		esbuild.BuildOptions,
		"entryPoints" | "outdir" | "bundle" | "absWorkingDir" | "metafile"
	>;
};

export type Bundle =
	| {
			cssBundle: string;
			entrypoint: string;
			type: "page";
	  }
	| {
			cssBundle: string;
			type: "global";
	  };

declare module "../../../page/_type/Assets.d.ts" {
	interface AssetTypes {
		css:
			| (BaseGlobalAsset<"css"> & { path: string })
			| (BasePageAsset<"css"> & { path: string });
	}
}
