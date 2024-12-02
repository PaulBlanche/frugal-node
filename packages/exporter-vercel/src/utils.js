/** @import { StaticManifest, DynamicManifest } from "@frugal-node/core/exporter" */
/** @import * as webstream from "node:stream/web" */

import * as stream from "node:stream";
import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { InternalServer } from "@frugal-node/core/server";
import { ProxyServer } from "@frugal-node/core/server";
import * as cookies from "@frugal-node/core/utils/cookies";
import * as crypto from "@frugal-node/core/utils/crypto";
import nodeFetch from "node-fetch";

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
			let requestUrl;
			const requestHeaders = new Headers(context.request.headers);

			if (action.type === "static") {
				const frugalToken = await crypto.token(await internalRuntimeConfig.cryptoKey, {
					type: action.type,
					op: action.op,
					index: String(action.index),
					url: context.request.url,
					params: JSON.stringify(action.params),
				});

				requestUrl = new URL(
					`/_static/${context.url.pathname}?token=${frugalToken}`,
					context.url,
				);
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

				requestUrl = new URL(
					`/_dynamic/${context.url.pathname}?token=${frugalToken}`,
					context.url,
				);
			}

			const nodeResponse = await nodeFetch(requestUrl, {
				headers: requestHeaders,
				body:
					context.request.body === null
						? null
						: stream.Readable.fromWeb(
								/** @type {webstream.ReadableStream<Uint8Array>}*/ (
									context.request.body
								),
							),
				method: context.request.method,
				compress: false,
			});

			const response = new Response(
				nodeResponse.body === null
					? null
					: /** @type {ReadableStream<Uint8Array>}*/ (
							stream.Readable.toWeb(new stream.Readable().wrap(nodeResponse.body))
						),
				{
					headers: new Headers(Object.fromEntries(nodeResponse.headers.entries())),
					status: nodeResponse.status,
				},
			);

			return response;
		},
		config: internalRuntimeConfig,
	}).nativeHandler(true);
}
