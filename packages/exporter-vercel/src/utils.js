/** @import * as webstream from "node:stream/web" */
/** @import { FrugalServerConfig } from "@frugal-node/core/server"; */

import * as stream from "node:stream";
import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { FrugalServer, Server } from "@frugal-node/core/server";
import * as cookies from "@frugal-node/core/utils/cookies";
import nodeFetch from "node-fetch";

/**
 * @param {FrugalServerConfig['manifest']} manifest
 * @param {RuntimeConfig} runtimeConfig
 */
export function getFrugalHandler(manifest, runtimeConfig) {
	const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

	const frugalServer = FrugalServer.create({
		manifest,
		publicDir: undefined,
		config: internalRuntimeConfig,
		watch: false,
	}).handler(true);

	return Server.create((request, serverContext) => {
		console.log(request.headers.get("x-now-route-matches"));
		return frugalServer(request, serverContext.info);
	});
}

/**
 * @param {string} bypassToken
 */
export function getProxyGenerateHandler(bypassToken) {
	return Server.create(
		async (request) => {
			const url = new URL(request.url);

			const headers = new Headers(request.headers);

			headers.append(
				"cookie",
				cookies.cookieToString({
					name: "__prerender_bypass",
					value: bypassToken,
				}),
			);

			const nodeResponse = await nodeFetch(url, {
				headers,
				body:
					request.body === null
						? null
						: stream.Readable.fromWeb(
								/** @type {webstream.ReadableStream<Uint8Array>}*/ (request.body),
							),
				method: request.method,
				compress: false,
			});

			return new Response(
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
		},
		{
			logScope: "proxyGenerate",
		},
	).nativeHandler(true);
}

/**
 * @param {string} bypassToken
 */
export function getProxyRefreshHandler(bypassToken) {
	return Server.create(
		async (request) => {
			const url = new URL(request.url);

			const headers = new Headers(request.headers);

			headers.append(
				"cookie",
				cookies.cookieToString({
					name: "__prerender_bypass",
					value: bypassToken,
				}),
			);

			await nodeFetch(url, {
				headers,
				body:
					request.body === null
						? null
						: stream.Readable.fromWeb(
								/** @type {webstream.ReadableStream<Uint8Array>}*/ (request.body),
							),
				method: request.method,
				compress: false,
			});

			return new Response(null, {
				status: 307,
				headers: {
					Location: url.pathname,
				},
			});
		},
		{
			logScope: "proxyGenerate",
		},
	).nativeHandler(true);
}
