export type ServerAsset = {
	path: string;
	out: string;
	importer: string;
};

export interface UrlMetaTransformer {
	dynamicUrl(paths: ServerAsset[], start: number): void;
	staticUrl(path: ServerAsset, start: number, end: number): void;
	readonly contents: string;
}

interface UrlMetaTransformerMaker {
	create(code: string): UrlMetaTransformer;
}

export let UrlMetaTransformer: UrlMetaTransformerMaker;
