import * as webStream from "node:stream/web";
import * as pathToRegexp from "path-to-regexp";
import * as jsonValue from "../utils/jsonValue.js";
import { log } from "../utils/log.js";
import * as descriptor from "./PageDescriptor.js";
import * as pageResponse from "./PageResponse.js";
import * as pathObject from "./PathObject.js";

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @template {descriptor.PageDescriptor<PATH, DATA>} [DESCRIPTOR=descriptor.PageDescriptor<PATH, DATA>]
 */
class BasePage {
	/** @type {string} */
	#entrypoint;
	/** @type {DESCRIPTOR} */
	#descriptor;
	/** @type {pathToRegexp.PathFunction<pathObject.PathObject<PATH>>} */
	#urlCompiler;
	/** @type {pathToRegexp.MatchFunction<pathObject.PathObject<PATH>>} */
	#urlMatcher;
	/** @type {string} */
	#moduleHash;

	/**
	 * @param {DESCRIPTOR} descriptor
	 * @param {string} moduleHash
	 * @param {string} entrypoint
	 */
	constructor(descriptor, moduleHash, entrypoint) {
		this.#descriptor = descriptor;
		try {
			this.#urlCompiler = pathToRegexp.compile(this.#descriptor.route);
			this.#urlMatcher = pathToRegexp.match(this.#descriptor.route);
		} catch (error) {
			throw new PageError(`Malformed route pattern "${this.route}"`, { cause: error });
		}
		this.#moduleHash = moduleHash;
		this.#entrypoint = entrypoint;
	}

	/**
	 * @param {descriptor.RenderContext<PATH, DATA>} context
	 * @returns {string | webStream.ReadableStream<string>}
	 */
	render(context) {
		log(
			`Rendering page "${this.entrypoint}" (${this.moduleHash}) with route "${
				this.route
			}" for params "${JSON.stringify(context.params)}"`,
			{
				scope: "Page",
				level: "verbose",
			},
		);

		try {
			return this.#descriptor.render(context);
		} catch (/** @type {any} */ error) {
			throw new PageError(
				`Error while rendering route "${this.route}" for params "${JSON.stringify(
					context.params,
				)}"`,
				{ cause: error },
			);
		}
	}

	/**
	 * @param {descriptor.GenerateContext<PATH>} context
	 * @returns {Promise<pageResponse.PageResponse<DATA>|undefined>}
	 */
	async generate(context) {
		if (this.#descriptor.generate === undefined) {
			log(
				`generating default DataResponse object for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "generate" function`,
				{
					scope: "Page",
					level: "verbose",
				},
			);

			return new pageResponse.DataResponse(/** @type {DATA} */ ({}));
		}

		log(
			`generating DataResponse object for page "${this.entrypoint}" (${
				this.moduleHash
			}) with route "${this.route}" for params "${JSON.stringify(context.params)}"`,
			{
				scope: "Page",
				level: "verbose",
			},
		);

		try {
			return await this.#descriptor.generate(context);
		} catch (/** @type {any} */ error) {
			if (error instanceof PageError) {
				throw error;
			}
			throw new PageError(
				`Error while generating route "${this.route}" for params "${JSON.stringify(
					context.params,
				)}"`,
				{ cause: error },
			);
		}
	}

	get moduleHash() {
		return this.#moduleHash;
	}

	get entrypoint() {
		return this.#entrypoint;
	}

	/** @returns {PATH} */
	get route() {
		return this.#descriptor.route;
	}

	/**
	 * @param {pathObject.PathObject<PATH>} path
	 * @returns {string}
	 */
	compile(path) {
		log(
			`compiling route route "${this.route}" of page "${this.entrypoint}" (${
				this.moduleHash
			})  for params "${JSON.stringify(path)}"`,
			{
				scope: "Page",
				level: "verbose",
			},
		);

		try {
			return this.#urlCompiler(path);
		} catch (/** @type {any} */ error) {
			throw new PageError(
				`Error while compiling route "${this.route}" for params "${JSON.stringify(path)}"`,
				{ cause: error },
			);
		}
	}

	/**
	 * @param {string} path
	 * @returns {pathToRegexp.Match<pathObject.PathObject<PATH>>}
	 */
	match(path) {
		log(
			`matching route route "${this.route}" of page "${this.entrypoint}" (${this.moduleHash})  for path "${path}"`,
			{
				scope: "Page",
				level: "verbose",
			},
		);

		return this.#urlMatcher(path);
	}
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @template {descriptor.DynamicPageDescriptor<PATH, DATA>} [DESCRIPTOR=descriptor.DynamicPageDescriptor<PATH, DATA>]
 * @extends {BasePage<PATH, DATA, DESCRIPTOR>}
 */
export class DynamicPage extends BasePage {
	/** @type {DESCRIPTOR} */
	#descriptor;

	/**
	 * @param {DESCRIPTOR} descriptor
	 * @param {string} moduleHash
	 * @param {string} entrypoint
	 */
	constructor(descriptor, moduleHash, entrypoint) {
		super(descriptor, moduleHash, entrypoint);
		this.#descriptor = descriptor;
	}

	/** @type {"dynamic"} */
	get type() {
		return "dynamic";
	}
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @template {descriptor.StaticPageDescriptor<PATH, DATA>} [DESCRIPTOR=descriptor.StaticPageDescriptor<PATH, DATA>]
 * @extends {BasePage<PATH, DATA, DESCRIPTOR>}
 */
export class StaticPage extends BasePage {
	/** @type {DESCRIPTOR} */
	#descriptor;

	/**
	 * @param {DESCRIPTOR} descriptor
	 * @param {string} moduleHash
	 * @param {string} entrypoint
	 */
	constructor(descriptor, moduleHash, entrypoint) {
		super(descriptor, moduleHash, entrypoint);
		this.#descriptor = descriptor;
	}

	get strictPaths() {
		return this.#descriptor.strictPaths ?? true;
	}

	/** @type {"static"} */
	get type() {
		return "static";
	}

	/**
	 * @param {descriptor.BuildContext<PATH>} context
	 * @returns {Promise<pageResponse.PageResponse<DATA> | undefined>}
	 */
	async build(context) {
		if (this.#descriptor.build === undefined) {
			log(
				`building default DataResponse object for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "build" function`,
				{
					scope: "Page",
					level: "verbose",
				},
			);

			return new pageResponse.DataResponse(/** @type {DATA} */ ({}));
		}

		log(
			`building DataResponse object for page "${this.entrypoint}" (${
				this.moduleHash
			}) with route "${this.route}" for params "${JSON.stringify(context.params)}"`,
			{
				scope: "Page",
				level: "verbose",
			},
		);

		try {
			return await this.#descriptor.build(context);
		} catch (/** @type {any} */ error) {
			if (error instanceof PageError) {
				throw error;
			}
			throw new PageError(
				`Error while building route "${this.route}" for params "${JSON.stringify(
					context.params,
				)}"`,
				{ cause: error },
			);
		}
	}

	/**
	 * @param {descriptor.GetBuildPathsContext} context
	 * @returns {descriptor.PathList<PATH> | Promise<descriptor.PathList<PATH>>}
	 */
	getBuildPaths(context) {
		if (this.#descriptor.getBuildPaths === undefined) {
			log(
				`building default path list for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "getBuildPaths" function`,
				{
					scope: "Page",
					level: "verbose",
				},
			);

			return /** @type {descriptor.PathList<PATH>} */ ([{}]);
		}

		log(
			`building path list for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}"`,
			{
				scope: "Page",
				level: "verbose",
			},
		);

		try {
			return this.#descriptor.getBuildPaths(context);
		} catch (/** @type {any} */ error) {
			throw new PageError(`Error while building path list for route "${this.route}"`, {
				cause: error,
			});
		}
	}
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {StaticPage<PATH, DATA> | DynamicPage<PATH, DATA>} Page
 */

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @param {{
 *     entrypoint: string;
 *     moduleHash: string;
 *     pageDescriptor: descriptor.PageDescriptor<PATH, DATA>;
 * }} config
 * @returns {Page<PATH, DATA>}
 */
export function compile({ entrypoint, moduleHash, pageDescriptor }) {
	log(`compile page "${entrypoint}" (${moduleHash})`, {
		scope: "Router",
		level: "debug",
	});

	if (
		typeof pageDescriptor === "object" &&
		pageDescriptor !== null &&
		pageDescriptor.type === "dynamic"
	) {
		try {
			process.env.NODE_ENV !== "production" &&
				descriptor.parseDynamicDescriptor(pageDescriptor);

			log(`compiling page descriptor "${entrypoint}" (${moduleHash}) as DynamicPage`, {
				scope: "Page",
				level: "verbose",
			});
			return new DynamicPage(pageDescriptor, moduleHash, entrypoint);
		} catch (/** @type {any} */ error) {
			if (error instanceof PageError) {
				throw error;
			}

			throw new PageError(
				`Error while parsing descriptor "${entrypoint}": ${error.message}`,
				{ cause: error },
			);
		}
	}

	try {
		process.env.NODE_ENV !== "production" && descriptor.parseStaticDescriptor(pageDescriptor);

		log(`compiling page descriptor "${entrypoint}" (${moduleHash}) as StaticPage`, {
			scope: "Page",
			level: "verbose",
		});
		return new StaticPage(pageDescriptor, moduleHash, entrypoint);
	} catch (/** @type {any} */ error) {
		if (error instanceof PageError) {
			throw error;
		}

		throw new PageError(`Error while parsing descriptor "${entrypoint}": ${error.message}`, {
			cause: error,
		});
	}
}

export class PageError extends Error {}
