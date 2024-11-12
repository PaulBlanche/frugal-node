export type MetaAsset = {
	path: string;
	out: string;
	importer: string;
};

export interface UrlMetaTransformer {
	dynamicUrl(assets: MetaAsset[], start: number, end: number): void;
	staticUrl(asset: MetaAsset, start: number, end: number): void;
	readonly contents: string;
}

interface UrlMetaTransformerCreator {
	create(code: string): UrlMetaTransformer;
}

export let UrlMetaTransformer: UrlMetaTransformerCreator;
