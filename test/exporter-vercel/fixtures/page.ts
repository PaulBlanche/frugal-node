import * as fs from "node:fs";
import * as frugal from "../../../packages/frugal/exports/index.js";

export const route = "/page1/:id";

export function getBuildPaths(): frugal.PathList<typeof route> {
	return [{ id: "1" }, { id: "2" }];
}

export async function build(context: frugal.BuildContext<typeof route>) {
	const data = await fs.promises.readFile(new URL("./data.txt", import.meta.url), {
		encoding: "utf-8",
	});
	return context.data(data);
}

export function render({ data, params }: frugal.RenderContext<typeof route, string>) {
	return JSON.stringify({ data, params });
}
