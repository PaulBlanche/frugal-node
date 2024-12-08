import {
	type BuildContext,
	type GenerateContext,
	PageResponse,
	type PathParamsList,
	type RenderContext,
} from "@frugal-node/core/page";
export const route = "/test/:id";

export function getBuildPaths(): PathParamsList<typeof route> {
	return [{ id: "1" }, { id: "2" }];
}

type Data = { time: number; id: string };

export function build(context: BuildContext<typeof route>) {
	return PageResponse.data<Data>({ time: Date.now(), id: context.params.id });
}

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

	return PageResponse.data<Data>({ time: Date.now(), id: context.params.id });
}

export function render(context: RenderContext<typeof route, Data>) {
	return `<html><body>
    <div>time:${context.data.time}</div>
    <div>id:${context.data.id}</div>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="type" value="force_generate" />
        <input type="submit" value="Force Generate" />
    </form>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="type" value="force_refresh" />
        <input type="submit" value="Force Refresh" />
    </form>

</body></html>`;
}
