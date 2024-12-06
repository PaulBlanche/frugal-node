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
		if (formData.get("type") === "force_generate") {
			const url = new URL(context.request.url);
			PageResponse.empty({
				forceDynamic: true,
				status: 303, // See Other
				headers: {
					Location: url.pathname,
				},
			});
		}
	}

	return PageResponse.data<Data>({ time: Date.now(), id: context.params.id });
}

export function render(context: RenderContext<typeof route, Data>) {
	return `<html></body>
    <div>time:${context.data.time}</div>
    <div>id:${context.data.id}</div>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="type" value="force_generate" />
        <input type="submit" value="Force Generate" />
    </form>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="type" value="refresh" />
        <input type="submit" value="Refresh" />
    </form>

</body></html>`;
}
