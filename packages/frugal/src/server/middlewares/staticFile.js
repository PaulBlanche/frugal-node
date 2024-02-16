import * as http from "../../utils/http.js";
import * as context from "../context.js";
import * as middleware from "../middleware.js";

const ONE_YEAR_IN_SECONDS = 31536000;

/**
 * @param {context.BaseContext} context
 * @param {middleware.Next<context.BaseContext>} next
 * @returns {Promise<Response>}
 */
export async function staticFile(context, next) {
	const response = await http.send(context.request, { rootDir: context.config.publicDir });

	if (!response.ok) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set("Cache-Control", `max-age=${ONE_YEAR_IN_SECONDS}, immutable`);

	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText,
	});
}
