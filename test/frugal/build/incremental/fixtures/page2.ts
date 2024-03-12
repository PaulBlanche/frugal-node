import * as frugal from "../../../../../packages/frugal/exports/index.js";
import { store } from "./store.js";

export const route = "/page2/:id";

export function getBuildPaths() {
	return [{ id: "1" }, { id: "2" }];
}

export async function build(context: frugal.BuildContext<typeof route>) {
	const dataStore = await store(new URL("./data.json", import.meta.url));
	const pageData = dataStore[1];
	return context.data(pageData[context.params.id].data, {
		headers: pageData[context.params.id].headers,
	});
}

export function render({ data, params }: frugal.RenderContext<typeof route, number>) {
	return `data: ${data}, params: ${JSON.stringify(params)}`;
}
