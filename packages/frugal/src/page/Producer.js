import { FrugalConfig } from "../Config.js";
import * as page from "../page/Page.js";
import * as pageDescriptor from "../page/PageDescriptor.js";
import * as pathObject from "../page/PathObject.js";
import { log } from "../utils/log.js";
import * as assets from "./Assets.js";
import { LiveGenerationResponse } from "./GenerationResponse.js";

export class Producer {
	/** @type {assets.PageAssets} */
	#assets;
	/** @type {page.Page} */
	#page;
	/** @type {FrugalConfig} */
	#config;
	/** @type {string} */
	#configHash;

	/**
	 *
	 * @param {assets.Assets} manifestAssets
	 * @param {page.Page} page
	 * @param {string} configHash
	 * @param {FrugalConfig} config
	 */
	constructor(manifestAssets, page, configHash, config) {
		this.#assets = new assets.PageAssets(manifestAssets, page.entrypoint);
		this.#page = page;
		this.#config = config;
		this.#configHash = configHash;
	}

	async buildAll() {
		if (this.#page.type === "dynamic") {
			throw new ProducerError("Can't build dynamic page");
		}

		const pathList = await this.#page.getBuildPaths({
			resolve: (path) => this.#config.resolve(path),
		});

		const responses = await Promise.all(pathList.map((params) => this.build(params)));

		if (responses.some((response) => response === undefined)) {
			throw new ProducerError(
				`No response returned while building route "${this.#page.route}"`,
			);
		}

		return /** @type {LiveGenerationResponse[]} */ (responses);
	}

	/**
	 * @param {pathObject.Collapse<unknown>} params
	 */
	async build(params) {
		if (this.#page.type === "dynamic") {
			throw new ProducerError("Can't build dynamic page");
		}

		const path = this.#page.compile(params);

		const response = await this.#page.build({
			path,
			params,
			resolve: (path) => this.#config.resolve(path),
		});

		if (response === undefined) {
			log(
				`No response returned while building route "${
					this.#page.route
				}" for params "${JSON.stringify(params)}"`,
				{ level: "warning", scope: "Builder" },
			);

			return undefined;
		}

		return new LiveGenerationResponse(response, {
			render: (data) =>
				this.#page.render({
					path,
					params,
					assets: this.#assets,
					data,
					descriptor: this.#page.entrypoint,
				}),
			path,
			moduleHash: this.#page.moduleHash,
			configHash: this.#configHash,
		});
	}

	/**
	 * @param {Request} request
	 * @param {string} path
	 * @param {pathObject.Collapse<unknown>} params
	 * @param {pageDescriptor.State} state
	 * @param {pageDescriptor.Session | undefined} session
	 */
	async generate(request, path, params, state, session) {
		const response =
			this.#page.type === "static" && request.method === "GET"
				? await this.#page.build({
						params,
						path,
						resolve: (path) => this.#config.resolve(path),
						state: state,
						request: request,
						session: session,
				  })
				: await this.#page.generate({
						params,
						path,
						resolve: (path) => this.#config.resolve(path),
						state: state,
						request: request,
						session: session,
				  });

		if (response === undefined) {
			log(
				`No response returned while generating route "${request.method} ${
					this.#page.route
				}" for params "${JSON.stringify(params)}"`,
				{ level: "warning", scope: "Builder" },
			);

			return undefined;
		}

		return new LiveGenerationResponse(response, {
			render: (data) =>
				this.#page.render({
					path,
					params,
					assets: this.#assets,
					data,
					descriptor: this.#page.entrypoint,
				}),
			path,
			moduleHash: this.#page.moduleHash,
			configHash: this.#configHash,
		});
	}

	/**
	 * @param {pathObject.Collapse<unknown>} params
	 */
	async refresh(params) {
		if (this.#page.type === "dynamic") {
			throw new ProducerError("Can't refresh dynamic page");
		}

		const path = this.#page.compile(params);

		const response = await this.#page.build({
			path,
			params,
			resolve: (path) => this.#config.resolve(path),
		});

		if (response === undefined) {
			log(
				`No response returned while refreshing route "${
					this.#page.route
				}" for params "${JSON.stringify(params)}"`,
				{ level: "warning", scope: "Builder" },
			);

			return undefined;
		}

		return new LiveGenerationResponse(response, {
			render: (data) =>
				this.#page.render({
					path,
					params,
					assets: this.#assets,
					data,
					descriptor: this.#page.entrypoint,
				}),
			path,
			moduleHash: this.#page.moduleHash,
			configHash: this.#configHash,
		});
	}
}

class ProducerError extends Error {}
