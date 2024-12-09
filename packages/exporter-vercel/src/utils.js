/** @import { FrugalServerConfig } from "@frugal-node/core/server"; */

import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { FrugalServer, Server } from "@frugal-node/core/server";
import * as cookies from "@frugal-node/core/utils/cookies";
import nodeFetch from "node-fetch";

/**
 * @param {FrugalServerConfig['manifest']} manifest
 * @param {RuntimeConfig} runtimeConfig
 * @param {string} bypassToken
 */
export function getFrugalHandler(manifest, runtimeConfig, bypassToken) {
	const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig, {
		async forceRefresh({ url }) {
			console.log(url.toString());
			const response = await nodeFetch(url, {
				method: "HEAD",
				redirect: "manual",
				headers: {
					"x-prerender-revalidate": bypassToken,
				},
				compress: false,
			});
			console.log(response);
			return response.ok;
		},
		setupForceGenerate(response) {
			cookies.setCookie(response.headers, {
				name: "__prerender_bypass",
				value: bypassToken,
			});
		},
		shouldForceGenerate(request) {
			const cookis = cookies.getCookies(request.headers);
			const prerenderBypass = cookis["__prerender_bypass"];
			return prerenderBypass === bypassToken;
		},
		cleanupForceGenerate(response) {
			cookies.setCookie(response.headers, {
				name: "__prerender_bypass",
				value: "",
				expires: new Date(0),
				maxAge: 0,
			});
		},
	});

	const furgalHandler = FrugalServer.create({
		manifest,
		publicDir: undefined,
		config: internalRuntimeConfig,
		watch: false,
	}).handler(true);

	return Server.create((request, serverContext) => {
		const url = new URL(request.url);

		if (url.pathname.endsWith("/index")) {
			const rewritePath = url.pathname.slice(0, -6);
			url.pathname = rewritePath === "" ? "/" : rewritePath;

			const rewriteRequest = new Request(url, request);
			return furgalHandler(rewriteRequest, serverContext.info);
		}
		return furgalHandler(request, serverContext.info);
	}).nativeHandler(true);
}
