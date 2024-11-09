import { RenderContext } from "@frugal-node/core/page";
import "./session.script.ts";

export const route = "/page2";

export function render({ assets }: RenderContext<typeof route, any>) {
	return `<html>
    <head>
        <title>page 2</title>
        <script type="module" src="${assets.get("js")[0].path}"></script>
    </head>
    <body>
        <a href="/page1">page1</a>
        <div style="height:1000px;" />
    </body>
</html>`;
}
