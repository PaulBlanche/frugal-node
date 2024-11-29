/** @import * as self from "./Producer.js" */

import { log } from "../utils/log.js";
import { FrugalResponse } from "./FrugalResponse.js";

/**@type {self.ProducerCreator} */
export const Producer = {
	create,
};

/**@type {self.ProducerCreator['create']} */
function create(assets, page, configHash, cryptoKey) {
	return {
		getPathParams,
		build,
		generate,
	};

	/** @type {self.Producer['getPathParams']} */
	async function getPathParams() {
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

		return pathList;
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
					assets,
					data,
					entrypoint: page.entrypoint,
				}),
			path,
			moduleHash: page.moduleHash,
			configHash: configHash,
			cryptoKey,
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
					assets,
					data,
					entrypoint: page.entrypoint,
				}),
			path,
			moduleHash: page.moduleHash,
			configHash: configHash,
			cryptoKey,
		});
	}
}

class ProducerError extends Error {}
