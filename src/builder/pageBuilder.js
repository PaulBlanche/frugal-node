import * as page from "../page/Page.js";
import * as pathObject from "../page/PathObject.js";
import * as jsonValue from "../utils/jsonValue.js";
import { CacheableResponse } from "./CacheableResponse.js";
import * as _type from "./_type/pageBuilder.js";

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @param {page.StaticPage<PATH, DATA>} staticPage
 * @param {_type.BuildConfig} config
 */
export async function build(staticPage, config) {
	const pathList = await staticPage.getBuildPaths({
		phase: "build",
		resolve: config.resolve,
	});

	return await Promise.all(
		pathList.map(async (pathObject) => {
			return await buildPath(staticPage, pathObject, config);
		}),
	);
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @param {page.StaticPage<PATH, DATA>} staticPage
 * @param {pathObject.PathObject<PATH>} pathObject
 * @param {_type.BuildConfig} config
 * @returns {Promise<CacheableResponse<DATA>>}
 */
async function buildPath(staticPage, pathObject, config) {
	const path = staticPage.compile(pathObject);

	return new CacheableResponse(
		await staticPage.build({
			phase: "build",
			path,
			params: pathObject,
			resolve: config.resolve,
		}),
		{
			render: (data) =>
				staticPage.render({
					phase: "build",
					path,
					params: pathObject,
					assets: config.assets,
					data,
					descriptor: staticPage.entrypoint,
				}),
			path,
			moduleHash: staticPage.moduleHash,
			configHash: config.configHash,
		},
	);
}
