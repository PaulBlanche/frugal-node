/** @import * as self from "./Page.js" */
/** @import { ServerData } from "../utils/serverData.js" */
/** @import { PageDescriptor } from "./PageDescriptor.js" */
/** @import { PathParams } from "./PathParams.js" */

import * as pathToRegexp from "path-to-regexp";
import { log } from "../utils/log.js";
import { assertPathParamList } from "./PageDescriptor.js";
import { PageResponse, isPageResponse } from "./PageResponse.js";

/** @type {self.PageCreator} */
export const Page = {
	static: staticPage,
	dynamic: dynamicPage,
};

/** @type {self.PageCreator['dynamic']} */
function dynamicPage(page) {
	const base = basePage(page);

	return {
		...base,

		get type() {
			return /** @type {const} */ ("dynamic");
		},
	};
}

/** @type {self.PageCreator['static']} */
function staticPage(page) {
	const base = basePage(page);

	return {
		...base,

		get type() {
			return /** @type {const} */ ("static");
		},

		get strictPaths() {
			return page.descriptor.strictPaths ?? true;
		},

		async build(context) {
			if (page.descriptor.build === undefined) {
				log(
					`building default DataResponse object for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "build" function`,
					{
						scope: "Page",
						level: "verbose",
					},
				);

				return PageResponse.data(/** @type {any} */ ({}));
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
				const response = await page.descriptor.build(context);

				process.env["NODE_ENV"] !== "production" && assertPageResponse(response);

				return response;
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

		async getBuildPaths() {
			if (page.descriptor.getBuildPaths === undefined) {
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
				const paths = await page.descriptor.getBuildPaths();

				process.env["NODE_ENV"] !== "production" && assertPathParamList(paths);

				return paths;
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
 * @template {ServerData} [DATA=ServerData]
 * @param {{ descriptor:PageDescriptor<PATH, DATA>, moduleHash:string, entrypoint:string}} page
 * @return {self.BasePage<PATH, DATA>}
 */
function basePage(page) {
	const { compiler, matcher } = createMatcherAndCompiler(page.descriptor);

	return {
		get moduleHash() {
			return page.moduleHash;
		},

		get entrypoint() {
			return page.entrypoint;
		},

		get route() {
			return page.descriptor.route;
		},

		get regexpRoute() {
			return pathToRegexp.pathToRegexp(page.descriptor.route).regexp;
		},

		get hasGenerate() {
			return page.descriptor.generate !== undefined;
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

			if (page.descriptor.render === undefined) {
				return "";
			}

			try {
				return page.descriptor.render(context);
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
			if (page.descriptor.generate === undefined) {
				log(
					`generating default DataResponse object for page "${this.entrypoint}" (${this.moduleHash}) with route "${this.route}" with no "generate" function`,
					{
						scope: "Page",
						level: "verbose",
					},
				);

				return PageResponse.data(/** @type {DATA} */ ({}));
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
				const response = await page.descriptor.generate(context);

				process.env["NODE_ENV"] !== "production" && assertPageResponse(response);

				return response;
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
 * @param {PageDescriptor<PATH, any>} descriptor
 */
function createMatcherAndCompiler(descriptor) {
	try {
		/** @type {pathToRegexp.PathFunction<PathParams<PATH>>} */
		const compiler = pathToRegexp.compile(descriptor.route);
		/** @type {pathToRegexp.MatchFunction<PathParams<PATH>>} */
		const matcher = pathToRegexp.match(descriptor.route);

		return { compiler, matcher };
	} catch (error) {
		throw new PageError(`Malformed route pattern "${descriptor.route}"`, {
			cause: error,
		});
	}
}

export class PageError extends Error {}

/**
 *
 * @param {unknown} response
 * @returns {asserts response is PageResponse|undefined}
 */
function assertPageResponse(response) {
	if (response !== undefined && !isPageResponse(response)) {
		throw new Error('Page descriptor `build` method did not return a "PageResponse"');
	}
}
