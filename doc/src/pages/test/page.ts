import {
	type BuildContext,
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

export function render(context: RenderContext<typeof route, Data>) {
	return `<html><body>
    <div>time:${context.data.time}</div>
    <div>id:${context.data.id}</div>
    <form method="POST" action="/_action/test/${context.params.id}" enctype="multipart/form-data">
        <input type="hidden" name="type" value="force_generate" />
        <input type="submit" value="Force Generate" />
    </form>
    <form method="POST" action="/_action/test/${context.params.id}" enctype="multipart/form-data">
        <input type="hidden" name="type" value="force_refresh" />
        <input type="submit" value="Force Refresh" />
    </form>

</body></html>`;
}
