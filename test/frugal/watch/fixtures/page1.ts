import type {
	GenerateContext,
	RenderContext,
} from "../../../../packages/frugal/exports/page/index.ts";
import { store } from "./store.ts";

export const route = "/page1/:id";

export function getBuildPaths() {
	return [{ id: "1" }, { id: "2" }];
}

export async function build({ params, data }: GenerateContext<typeof route>) {
	const dataStore = await store();
	const pageData = dataStore[0];
	return data(pageData[params.id].data, {
		headers: pageData[params.id].headers,
	});
}

export function render({ data, location }: RenderContext<typeof route, number>) {
	return `data : ${data}, path: ${JSON.stringify(location)}`;
}
