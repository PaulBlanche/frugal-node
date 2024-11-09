/** @import * as self from "./CssModuleBundler.js" */

import { log } from "@frugal-node/core/utils/log";
import * as lightningcss from "lightningcss";
import { CssModuleCompiler } from "./CssModuleCompiler.js";

/** @type {self.CssModuleBundlerCreator} */
export const CssModuleBundler = {
	create,
};

/** @type {self.CssModuleBundlerCreator['create']} */
function create(config = {}) {
	/** @type {Map<string, self.CssModule>} */
	const cache = new Map();

	return {
		bundle(path, cssPath, contents) {
			const cached = cache.get(path);
			if (cached && isSameUint8Array(cached.contents, contents)) {
				return cached;
			}

			log(`compiling css module "${path}"`, { scope: "frugal:css", level: "debug" });

			const { css, exports } = _transform(path, contents);

			const js = CssModuleCompiler.create(exports ?? {}).compile(cssPath);

			const module = { contents, css, js };

			cache.set(path, module);

			return module;
		},
	};

	/**
	 * @param {string} path
	 * @param {Uint8Array} contents
	 * @returns {{ css: Uint8Array; exports: lightningcss.CSSModuleExports | void }}
	 */
	function _transform(path, contents) {
		const { code, exports } = lightningcss.transform({
			filename: path,
			code: contents,
			cssModules: config.options,
			sourceMap: config.sourceMap,
			projectRoot: config.projectRoot,
			targets: {
				chrome: 95 << 16,
			},
		});

		// copy css Uint8Array, because the underlying buffer coming from
		// lightningcss might become detached.
		const css = new Uint8Array(code.byteLength);

		css.set(code);

		return { css, exports };
	}
}

/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function isSameUint8Array(a, b) {
	if (a.byteLength !== b.byteLength) {
		return false;
	}

	for (let i = 0; i < a.byteLength; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
}
