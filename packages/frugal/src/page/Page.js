import * as pathToRegexp from "path-to-regexp";
import * as jsonValue from "../utils/jsonValue.js";
import { log } from "../utils/log.js";
import * as descriptor from "./PageDescriptor.js";
import * as pageResponse from "./PageResponse.js";

/** @type {import('./Page.ts').Maker} */
export const Page = {
	create,
};

/** @type {import('./Page.ts').Maker['create']} */
export function create({ entrypoint, moduleHash, pageDescriptor }) {
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
				descriptor.assertDynamicDescriptor(pageDescriptor);

			log(`compiling page descriptor "${entrypoint}" (${moduleHash}) as DynamicPage`, {
				scope: "Page",
				level: "verbose",
			});
			return dynamicPage(pageDescriptor, moduleHash, entrypoint);
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
		process.env.NODE_ENV !== "production" && descriptor.assertStaticDescriptor(pageDescriptor);

		log(`compiling page descriptor "${entrypoint}" (${moduleHash}) as StaticPage`, {
			scope: "Page",
			level: "verbose",
		});
		return staticPage(pageDescriptor, moduleHash, entrypoint);
	} catch (/** @type {any} */ error) {
		if (error instanceof PageError) {
			throw error;
		}

		throw new PageError(`Error while parsing descriptor "${entrypoint}": ${error.message}`, {
			cause: error,
		});
	}
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @param {import('./PageDescriptor.ts').DynamicPageDescriptor<PATH, DATA>} descriptor
 * @param {string} moduleHash
 * @param {string} entrypoint
 * @return {import('./Page.ts').DynamicPage<PATH, DATA>}
 */
function dynamicPage(descriptor, moduleHash, entrypoint) {
	const base = basePage(descriptor, moduleHash, entrypoint);

	return {
		...base,

		get type() {
			return /** @type {const} */ ("dynamic");
		},
	};
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @param {import('./PageDescriptor.ts').StaticPageDescriptor<PATH, DATA>} descriptor
 * @param {string} moduleHash
 * @param {string} entrypoint
 * @return {import('./Page.ts').StaticPage<PATH, DATA>}
 */
function staticPage(descriptor, moduleHash, entrypoint) {
	const base = basePage(descriptor, moduleHash, entrypoint);

	return {
		...base,

		get type() {
			return /** @type {const} */ ("static");
		},

		get strictPaths() {
			return descriptor.strictPaths ?? true;
		},

		async build(context) {
			if (descriptor.build === undefined) {
				log(
					`building default DataResponse object for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "build" function`,
					{
						scope: "Page",
						level: "verbose",
					},
				);

				return context.data(/** @type {any} */ ({}));
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
				return await descriptor.build(context);
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
		},

		getBuildPaths(context) {
			if (descriptor.getBuildPaths === undefined) {
				log(
					`building default path list for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "getBuildPaths" function`,
					{
						scope: "Page",
						level: "verbose",
					},
				);

				return /** @type {any} */ ([{}]);
			}

			log(
				`building path list for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}"`,
				{
					scope: "Page",
					level: "verbose",
				},
			);

			try {
				return descriptor.getBuildPaths(context);
			} catch (/** @type {any} */ error) {
				throw new PageError(`Error while building path list for route "${this.route}"`, {
					cause: error,
				});
			}
		},
	};
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @param {import('./PageDescriptor.ts').PageDescriptor<PATH, DATA>} descriptor
 * @param {string} moduleHash
 * @param {string} entrypoint
 * @return {import('./Page.ts').BasePage<PATH, DATA>}
 */
function basePage(descriptor, moduleHash, entrypoint) {
	const { compiler, matcher } = createMatcherAndCompiler(descriptor);

	return {
		get moduleHash() {
			return moduleHash;
		},

		get entrypoint() {
			return entrypoint;
		},

		get route() {
			return descriptor.route;
		},

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
				return descriptor.render(context);
			} catch (/** @type {any} */ error) {
				throw new PageError(
					`Error while rendering route "${this.route}" for params "${JSON.stringify(
						context.params,
					)}"`,
					{ cause: error },
				);
			}
		},

		async generate(context) {
			if (descriptor.generate === undefined) {
				log(
					`generating default DataResponse object for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "generate" function`,
					{
						scope: "Page",
						level: "verbose",
					},
				);

				return context.data(/** @type {DATA} */ ({}));
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
				const a = await descriptor.generate(context);
				return a;
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
		},

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
				return compiler(path);
			} catch (/** @type {any} */ error) {
				throw new PageError(
					`Error while compiling route "${this.route}" for params "${JSON.stringify(
						path,
					)}"`,
					{ cause: error },
				);
			}
		},

		match(path) {
			log(
				`matching route route "${this.route}" of page "${this.entrypoint}" (${this.moduleHash})  for path "${path}"`,
				{
					scope: "Page",
					level: "verbose",
				},
			);

			return matcher(path);
		},
	};
}

/**
 * @template {string} PATH
 * @param {import('./PageDescriptor.ts').PageDescriptor<PATH, any>} descriptor
 */
function createMatcherAndCompiler(descriptor) {
	try {
		/** @type {pathToRegexp.PathFunction<import("./PathObject.ts").PathObject<PATH>>} */
		const compiler = pathToRegexp.compile(descriptor.route);
		/** @type {pathToRegexp.MatchFunction<import("./PathObject.ts").PathObject<PATH>>} */
		const matcher = pathToRegexp.match(descriptor.route);

		return { compiler, matcher };
	} catch (error) {
		throw new PageError(`Malformed route pattern "${descriptor.route}"`, { cause: error });
	}
}

export class PageError extends Error {}
