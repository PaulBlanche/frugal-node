/** @import { StaticManifest, DynamicManifest } from "@frugal-node/core/exporter" */

import * as http from "node:http";
import * as stream from "node:stream";
import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { InternalServer } from "@frugal-node/core/server";
import { ProxyServer } from "@frugal-node/core/server";
import * as cookies from "@frugal-node/core/utils/cookies";
import * as crypto from "@frugal-node/core/utils/crypto";

/**
 * @param {StaticManifest} staticManifest
 * @param {RuntimeConfig} runtimeConfig
 */
export function getStaticHandler(staticManifest, runtimeConfig) {
	const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

	return InternalServer.create({
		manifest: { static: staticManifest },
		config: internalRuntimeConfig,
		watch: false,
	}).nativeHandler(true);
}

/**
 * @param {DynamicManifest} dynamicManifest
 * @param {RuntimeConfig} runtimeConfig
 */
export function getDynamicHandler(dynamicManifest, runtimeConfig) {
	const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

	return InternalServer.create({
		manifest: { dynamic: dynamicManifest },
		config: internalRuntimeConfig,
		watch: false,
	}).nativeHandler(true);
}

/**
 * @param {StaticManifest} staticManifest
 * @param {DynamicManifest} dynamicManifest
 * @param {RuntimeConfig} runtimeConfig
 */
export function getProxyHandler(staticManifest, dynamicManifest, runtimeConfig) {
	const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

	return ProxyServer.create({
		manifest: { static: staticManifest, dynamic: dynamicManifest },
		publicDir: undefined,
		watch: false,
		internal: async (context, action) => {
			console.log("internal");
			/** @type {http.RequestOptions} */
			const requestOptions = {
				host: context.request.headers.get("host"),
				port: 443,
				method: context.request.method,
			};
			const requestHeaders = new Headers(context.request.headers);

			if (action.type === "static") {
				const frugalToken = await crypto.token(await internalRuntimeConfig.cryptoKey, {
					type: action.type,
					op: action.op,
					index: String(action.index),
					url: context.request.url,
					params: JSON.stringify(action.params),
				});

				requestOptions.path = `_static?token=${frugalToken}`;
				if (action.op === "refresh") {
					requestHeaders.set("x-prerender-revalidate", "bypass");
				}
				if (action.op === "generate") {
					cookies.setCookie(requestHeaders, {
						name: "__prerender_bypass",
						value: "bypass",
					});
				}
			} else {
				const frugalToken = await crypto.token(await internalRuntimeConfig.cryptoKey, {
					type: action.type,
					index: String(action.index),
					url: context.request.url,
					params: JSON.stringify(action.params),
				});

				requestOptions.path = `_dynamic?token=${frugalToken}`;
			}

			const fullRequestOptions = {
				...requestOptions,
				headers: Object.fromEntries(requestHeaders.entries()),
			};

			return new Promise((res) => {
				http.request(fullRequestOptions, (httpResponse) => {
					console.log("coucou");
					const response = new Response(
						/** @type {ReadableStream<Uint8Array>} */ (
							stream.Readable.toWeb(httpResponse)
						),
						{
							status: httpResponse.statusCode,
							statusText: httpResponse.statusMessage,
							headers: new Headers(
								Object.entries(httpResponse.headersDistinct)
									.filter(
										/** @return {entry is [string, string[]]} */ (entry) =>
											entry[1] !== undefined,
									)
									.map(([key, value]) => [key, value?.join(",")]),
							),
						},
					);

					res(response);
				});
			});
		},
		config: internalRuntimeConfig,
	}).nativeHandler(true);
}
