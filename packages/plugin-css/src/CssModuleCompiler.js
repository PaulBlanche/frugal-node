/** @import * as self from "./CssModuleCompiler.js" */
/** @import { DependencyCSSModuleReference } from "lightningcss" */

/** @type {self.CssModuleCompilerCreator} */
export const CssModuleCompiler = {
	create,
};

/** @type {self.CssModuleCompilerCreator['create']} */
function create(exports) {
	const state = {
		counter: 0,
	};
	/** @type {Map<string, self.ClassName[]>} */
	const classNameCache = new Map();
	/** @type {Record<string, string>} */
	const importIdentifierCache = {};

	return {
		compile(compiledCssPath) {
			return `${Array.from(
				new Set(
					Object.values(exports).flatMap((exportData) => {
						return exportData.composes
							.filter(
								/** @returns {compose is DependencyCSSModuleReference} */
								(compose) => compose.type === "dependency",
							)
							.map((compose) => {
								return compose.specifier;
							});
					}),
				),
			)
				.map((specifier) => {
					return `import * as ${_importIdentifier(specifier)} from "${specifier}";`;
				})
				.join("\n")}
	import "${compiledCssPath}";
	import { format } from "cssModuleHelper:format.js"
	
	${Object.entries(exports)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([exportName, exportData]) => {
			return `export const ${camelizeClassname(exportName)} = format("${
				exportData.name
			}", ${_getClassNames(exportName).map((className) => {
				return _toJsCode(className);
			})});`;
		})
		.join("\n")}
	`;
		},
	};

	/**
	 * @param {self.ClassName} className
	 * @returns {string}
	 */
	function _toJsCode(className) {
		switch (className.type) {
			case "dependency": {
				return `${className.importIdentifier}["${camelizeClassname(className.name)}"]`;
			}
			case "global": {
				return `"${className.name}"`;
			}
			case "local": {
				return [
					`"${className.name}"`,
					...className.names.map((className) => _toJsCode(className)),
				].join(", ");
			}
		}
	}

	/** @param {string} specifier */
	function _importIdentifier(specifier) {
		if (!(specifier in importIdentifierCache)) {
			importIdentifierCache[specifier] = `$${state.counter++}`;
		}

		return importIdentifierCache[specifier];
	}

	/**
	 * @param {string} name
	 * @returns {self.ClassName[]}
	 */
	function _getClassNames(name) {
		const cached = classNameCache.get(name);
		if (cached !== undefined) {
			return cached;
		}

		const localExport = exports[name];

		if (localExport === undefined) {
			throw new Error(`name "${name}" is not exported from css module`);
		}

		const classNames = localExport.composes.map(
			/** @returns {self.ClassName} */
			(compose) => {
				if (compose.type === "dependency") {
					return {
						type: "dependency",
						importIdentifier: _importIdentifier(compose.specifier),
						name: compose.name,
					};
				}

				if (compose.type === "local") {
					return {
						type: "local",
						name: compose.name,
						names: _resolveClassNames(compose.name),
					};
				}

				return { type: "global", name: compose.name };
			},
		);

		classNameCache.set(name, classNames);
		return classNames;
	}

	/**
	 * @param {string} name
	 * @returns {self.ClassName[]}
	 */
	function _resolveClassNames(name) {
		const found = Object.entries(exports).find(([_, exportData]) => exportData.name === name);

		if (found === undefined) {
			throw new Error("");
		}

		return _getClassNames(found[0]);
	}
}

/**
 * @param {string} str
 * @returns {string}
 */
function camelizeClassname(str) {
	return str.replace(/-(\w|$)/g, (_, x) => x.toUpperCase());
}
