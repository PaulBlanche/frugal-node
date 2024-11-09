/** @import * as self from "./UrlMetaTransformer.js" */

import MagicString from "magic-string";

/** @type {self.UrlMetaTransformerCreator} */
export const UrlMetaTransformer = {
	create,
};

/** @type {self.UrlMetaTransformerCreator['create']} */
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

	/** @type {self.UrlMetaTransformer['dynamicUrl']}*/
	function dynamicUrl(assets, start, end) {
		ms = ms || new MagicString(code);

		ms.prepend(
			`function __FRUGAL_DYNAMIC_ASSET_URL_${dynamicUrlMetaIndex}__(path, base) {
switch (path) {
${assets
	.map(({ path, out }) => {
		return `    case '${path}': return new URL('${out}', base);`;
	})
	.join("\n")}
${`    default: throw new Error("Unknown URL: " + path);
`}
}
}\n\n`,
		);

		ms.overwrite(start, end, `__FRUGAL_DYNAMIC_ASSET_URL_${dynamicUrlMetaIndex}__`);

		dynamicUrlMetaIndex += 1;
	}

	/** @type {self.UrlMetaTransformer['staticUrl']}*/
	function staticUrl(asset, start, end) {
		ms = ms || new MagicString(code);

		ms.overwrite(start, end, `new URL('${asset.out}', import.meta.url)`);
	}
}
