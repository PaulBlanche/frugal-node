import { log } from "../utils/log.js";
import { Assets } from "./Assets.js";
import { GenerationResponse } from "./GenerationResponse.js";
import { PageResponse } from "./PageResponse.js";

/**@type {import('./Producer.ts').ProducerMaker} */
export const Producer = {
	create,
};

/**@type {import('./Producer.ts').ProducerMaker['create']} */
export function create(manifestAssets, page, configHash, config) {
	const pageAssets = Assets.create(manifestAssets, page.entrypoint);

	return {
		async buildAll() {
			if (page.type === "dynamic") {
				throw new ProducerError("Can't build dynamic page");
			}

			const pathList = await page.getBuildPaths({
				resolve: config.resolve,
			});

			const responses = await Promise.all(pathList.map((params) => this.build(params)));

			if (responses.some((response) => response === undefined)) {
				throw new ProducerError(
					`No response returned while building route "${page.route}"`,
				);
			}

			return /** @type {import("./GenerationResponse.ts").GenerationResponse[]} */ (
				responses
			);
		},

		async build(params) {
			if (page.type === "dynamic") {
				throw new ProducerError("Can't build dynamic page");
			}

			const path = page.compile(params);

			const response = await page.build({
				path,
				params,
				resolve: config.resolve,
				data: PageResponse.data,
				empty: PageResponse.empty,
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

			return GenerationResponse.create(response, {
				render: (data) =>
					page.render({
						path,
						params,
						assets: pageAssets,
						data,
						descriptor: page.entrypoint,
					}),
				path,
				moduleHash: page.moduleHash,
				configHash: configHash,
			});
		},

		async generate(request, path, params, state, session) {
			const response =
				page.type === "static" && request.method === "GET"
					? await page.build({
							params,
							path,
							resolve: config.resolve,
							data: PageResponse.data,
							empty: PageResponse.empty,
							state: state,
							request: request,
							session: session,
					  })
					: await page.generate({
							params,
							path,
							resolve: config.resolve,
							data: PageResponse.data,
							empty: PageResponse.empty,
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

			return GenerationResponse.create(response, {
				render: (data) =>
					page.render({
						path,
						params,
						assets: pageAssets,
						data,
						descriptor: page.entrypoint,
					}),
				path,
				moduleHash: page.moduleHash,
				configHash: configHash,
			});
		},

		async refresh(params) {
			if (page.type === "dynamic") {
				throw new ProducerError("Can't refresh dynamic page");
			}

			const path = page.compile(params);

			const response = await page.build({
				path,
				params,
				resolve: config.resolve,
				data: PageResponse.data,
				empty: PageResponse.empty,
			});

			if (response === undefined) {
				log(
					`No response returned while refreshing route "${
						page.route
					}" for params "${JSON.stringify(params)}"`,
					{ level: "warning", scope: "Builder" },
				);

				return undefined;
			}

			return GenerationResponse.create(response, {
				render: (data) =>
					page.render({
						path,
						params,
						assets: pageAssets,
						data,
						descriptor: page.entrypoint,
					}),
				path,
				moduleHash: page.moduleHash,
				configHash: configHash,
			});
		},
	};
}

class ProducerError extends Error {}
