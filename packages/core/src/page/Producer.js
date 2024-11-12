/** @import * as self from "./Producer.js" */

import { log } from "../utils/log.js";
import { FrugalResponse } from "./FrugalResponse.js";
import { PageAssets } from "./PageAssets.js";

/**@type {self.ProducerCreator} */
export const Producer = {
	create,
};

/**@type {self.ProducerCreator['create']} */
function create(manifestAssets, page, configHash) {
	const pageAssets = PageAssets.create(manifestAssets, page.entrypoint);

	return {
		buildAll,
		build,
		generate,
		refresh,
	};

	/** @type {self.Producer['buildAll']} */
	async function buildAll() {
		if (page.type === "dynamic") {
			throw new ProducerError("Can't build dynamic page");
		}

		const pathList = await page.getBuildPaths();

		log(
			`building all paths for page "${page.entrypoint}" with route "${page.route}" (${pathList.length} paths)`,
			{
				scope: "Page",
				level: "info",
			},
		);

		const responses = await Promise.all(pathList.map((params) => build({ params })));

		if (responses.some((response) => response === undefined)) {
			throw new ProducerError(`No response returned while building route "${page.route}"`);
		}

		return /** @type {FrugalResponse[]} */ (responses);
	}

	/** @type {self.Producer['build']} */
	async function build({ params }) {
		if (page.type === "dynamic") {
			throw new ProducerError("Can't statically build a dynamic page");
		}

		const path = page.compile(params);
		const location = { pathname: path, search: "" };

		const response = await page.build({
			location,
			params,
		});

		if (response === undefined) {
			log(
				`No response returned while building route "${
					page.route
				}" for params "${JSON.stringify(params)}"`,
				{ level: "warning", scope: "Builder" },
			);

			return undefined;
		}

		return FrugalResponse.create(response, {
			render: (data) =>
				page.render({
					location,
					params,
					assets: pageAssets,
					data,
					entrypoint: page.entrypoint,
				}),
			path,
			moduleHash: page.moduleHash,
			configHash: configHash,
		});
	}

	/** @type {self.Producer['generate']} */
	async function generate({ request, path, params, state, session }) {
		const url = new URL(request.url);
		const location = { pathname: url.pathname, search: url.search };

		const response =
			page.type === "static" && request.method === "GET"
				? await page.build({
						params,
						location,
						state: state,
						request: request,
						session: session,
					})
				: await page.generate({
						params,
						location,
						state: state,
						request: request,
						session: session,
					});

		if (response === undefined) {
			log(
				`No response returned while generating route "${request.method} ${
					page.route
				}" for params "${JSON.stringify(params)}"`,
				{ level: "warning", scope: "Builder" },
			);

			return undefined;
		}

		return FrugalResponse.create(response, {
			render: (data) =>
				page.render({
					location,
					params,
					assets: pageAssets,
					data,
					entrypoint: page.entrypoint,
				}),
			path,
			moduleHash: page.moduleHash,
			configHash: configHash,
		});
	}

	/** @type {self.Producer['refresh']} */
	async function refresh({ request, params, jit }) {
		if (page.type === "dynamic") {
			throw new ProducerError("Can't refresh dynamic page");
		}

		if (jit && page.strictPaths) {
			const url = new URL(request.url);
			const pathList = await page.getBuildPaths();

			const hasMatchingPath = pathList.some((path) => {
				return page.compile(path) === url.pathname;
			});

			if (!hasMatchingPath) {
				return undefined;
			}
		}

		return build({ params });
	}
}

class ProducerError extends Error {}
