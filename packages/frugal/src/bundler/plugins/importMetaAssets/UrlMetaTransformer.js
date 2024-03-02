import MagicString from "magic-string";

/** @type {import('./UrlMetaTransformer.ts').UrlMetaTransformerMaker} */
export const UrlMetaTransformer = {
	create,
};

/** @type {import('./UrlMetaTransformer.ts').UrlMetaTransformerMaker['create']} */
function create(code) {
	/** @type {MagicString|undefined} */
	let ms;

	let dynamicUrlMetaIndex = 0;

	return {
		dynamicUrl,
		staticUrl,
		get contents() {
			if (ms !== undefined) {
				const sourceMap = ms.generateMap({ hires: true, includeContent: true });

				return `${ms.toString()}\n//# sourceMappingURL=${sourceMap.toUrl()}`;
			}
			return code;
		},
	};

	/** @type {import('./UrlMetaTransformer.ts').UrlMetaTransformer['dynamicUrl']}*/
	function dynamicUrl(paths, start) {
		ms = ms || new MagicString(code);

		ms.prepend(
			`function __frugal__dynamicUrlRuntime__${dynamicUrlMetaIndex}__(path) {
switch (path) {
${paths
	.map(({ path, out }) => {
		return `    case '${path}': return new URL('${out}', import.meta.url);`;
	})
	.join("\n")}
${`    default: return new Promise((resolve, reject) => {
(typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
reject.bind(null, new Error("Unknown dynamic new URL statement: " + path))
);
})`}
}
}\n\n`,
		);

		ms.overwrite(start, start + 7, `__frugal__dynamicUrlRuntime__${dynamicUrlMetaIndex}__`);

		dynamicUrlMetaIndex += 1;
	}

	/** @type {import('./UrlMetaTransformer.ts').UrlMetaTransformer['staticUrl']}*/
	function staticUrl(path, start, end) {
		ms = ms || new MagicString(code);

		ms.overwrite(start, end, `new URL('${path.out}', import.meta.url)`);
	}
}
