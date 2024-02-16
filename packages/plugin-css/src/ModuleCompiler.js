import * as lightningcss from "lightningcss";
import * as _type from "./_type/ModuleCompiler.js";

export class ModuleCompiler {
	/** @type {lightningcss.CSSModuleExports} */
	#exports;
	/** @type {number} */
	#counter;
	/** @type {Record<string, string>} */
	#importIdentifierCache;
	/** @type {Map<string, _type.ClassName[]>} */
	#classNameCache;

	/** @param {lightningcss.CSSModuleExports} exports */
	constructor(exports) {
		this.#exports = exports;
		this.#counter = 0;
		this.#classNameCache = new Map();
		this.#importIdentifierCache = {};
	}

	/**
	 * @param {string} compiledCssPath
	 * @returns {string}
	 */
	compile(compiledCssPath) {
		return `${Array.from(
			new Set(
				Object.values(this.#exports).flatMap((exportData) => {
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
				return `import * as ${this.#importIdentifier(specifier)} from "${specifier}";`;
			})
			.join("\n")}
import "${compiledCssPath}";
import { format } from "cssModuleHelper:format.js"

${Object.entries(this.#exports)
	.sort((a, b) => a[0].localeCompare(b[0]))
	.map(([exportName, exportData]) => {
		return `export const ${camelizeClassname(exportName)} = format("${
			exportData.name
		}", ${this.#getClassNames(exportName).map((className) => {
			return this.#toJsCode(className);
		})});`;
	})
	.join("\n")}
`;
	}

	/**
	 * @param {_type.ClassName} className
	 * @returns {string}
	 */
	#toJsCode(className) {
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
					...className.names.map((className) => this.#toJsCode(className)),
				].join(", ");
			}
		}
	}

	/** @param {string} specifier */
	#importIdentifier(specifier) {
		if (!(specifier in this.#importIdentifierCache)) {
			this.#importIdentifierCache[specifier] = `$${this.#counter++}`;
		}

		return this.#importIdentifierCache[specifier];
	}

	/**
	 * @param {string} name
	 * @returns {_type.ClassName[]}
	 */
	#getClassNames(name) {
		const cached = this.#classNameCache.get(name);
		if (cached !== undefined) {
			return cached;
		}

		const localExport = this.#exports[name];

		if (localExport === undefined) {
			throw new Error(`name "${name}" is not exported from css module`);
		}

		const classNames = localExport.composes.map(
			/** @returns {_type.ClassName} */
			(compose) => {
				if (compose.type === "dependency") {
					return {
						type: "dependency",
						importIdentifier: this.#importIdentifier(compose.specifier),
						name: compose.name,
					};
				}

				if (compose.type === "local") {
					return {
						type: "local",
						name: compose.name,
						names: this.#resolveClassNames(compose.name),
					};
				}

				return { type: "global", name: compose.name };
			},
		);

		this.#classNameCache.set(name, classNames);
		return classNames;
	}

	/**
	 * @param {string} name
	 * @returns {_type.ClassName[]}
	 */
	#resolveClassNames(name) {
		const found = Object.entries(this.#exports).find(
			([_, exportData]) => exportData.name === name,
		);

		if (found === undefined) {
			throw new Error("");
		}

		return this.#getClassNames(found[0]);
	}
}

/**
 * @param {string} str
 * @returns {string}
 */
function camelizeClassname(str) {
	return str.replace(/-(\w|$)/g, (_, x) => x.toUpperCase());
}
