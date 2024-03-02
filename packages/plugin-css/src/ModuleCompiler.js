import * as lightningcss from "lightningcss";

/** @type {import('./ModuleCompiler.ts').ModuleCompilerMaker} */
export const ModuleCompiler = {
	create,
};

/** @type {import('./ModuleCompiler.ts').ModuleCompilerMaker['create']} */
export function create(exports) {
	const state = {
		counter: 0,
	};
	/** @type {Map<string, import('./ModuleCompiler.ts').ClassName[]>} */
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
								/** @returns {compose is lightningcss.DependencyCSSModuleReference} */
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
	 * @param {import('./ModuleCompiler.ts').ClassName} className
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
	 * @returns {import('./ModuleCompiler.ts').ClassName[]}
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
			/** @returns {import('./ModuleCompiler.ts').ClassName} */
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
	 * @returns {import('./ModuleCompiler.ts').ClassName[]}
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
