import * as frugal from "../../../../../index.js";
import { store } from "./store.js";

export const route = "/page2/:id";

export function getBuildPaths() {
	return [{ id: "1" }, { id: "2" }];
}

export async function build({ params, resolve }: frugal.BuildContext<typeof route>) {
	const dataStore = await store(resolve("./data.json"));
	const pageData = dataStore[1];
	return new frugal.DataResponse(pageData[params.id].data, {
		headers: pageData[params.id].headers,
	});
}

export function render({ data, params }: frugal.RenderContext<typeof route, number>) {
	return `data: ${data}, params: ${JSON.stringify(params)}`;
}
