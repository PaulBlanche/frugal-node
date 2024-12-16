import * as fs from "node:fs/promises";
import { type GenerateContext, PageResponse } from "@frugal-node/core/page";

export const type = "dynamic";

export const route = "/_action/test/:id";

export async function generate(context: GenerateContext<typeof route>) {
	try {
		try {
			try {
				await fs.readFile("foo");
			} catch (e) {
				throw new Error("moo", { cause: e });
			}
		} catch (e) {
			throw new Error("moo", { cause: e });
		}
	} catch (e) {
		throw new Error("moo", { cause: e });
	}
	if (context.request.method === "POST") {
		const formData = await context.request.formData();
		if (formData.get("type") === "force_generate") {
			return PageResponse.redirect({
				forceDynamic: true,
				status: 303, // See Other
				location: `/test/${context.params.id}`,
			});
		}
		if (formData.get("type") === "force_refresh") {
			await context.forceRefresh(`/test/${context.params.id}`);
			return PageResponse.redirect({
				status: 303, // See Other
				location: `/test/${context.params.id}`,
			});
		}
	}

	return PageResponse.empty({ status: 404 });
}
