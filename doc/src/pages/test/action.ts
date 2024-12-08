import { type GenerateContext, PageResponse } from "@frugal-node/core/page";

export const type = "dynamic";

export const route = "/test/:id/_action";

export async function generate(context: GenerateContext<typeof route>) {
	if (context.request.method === "POST") {
		const formData = await context.request.formData();
		console.log(Array.from(formData.entries()));
		if (formData.get("type") === "force_generate") {
			return PageResponse.redirect({
				forceDynamic: true,
				status: 303, // See Other
				location: context.request.url,
			});
		}
		if (formData.get("type") === "force_refresh") {
			await context.forceRefresh();
			return PageResponse.redirect({
				status: 303, // See Other
				location: context.request.url,
			});
		}
	}

	return PageResponse.empty({ status: 404 });
}
