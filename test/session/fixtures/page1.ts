import { RenderContext } from "../../../packages/frugal/exports/page/index.js";
import "./session.script.ts";

export const route = "/page1";

export function render({ assets }: RenderContext<typeof route, any>) {
	return `<html>
    <head>
        <title>page 1</title>
        <script type="module" src="${assets.get("js")[0].path}"></script>
    </head>
    <body>
        <a href="/page2">page2</a>
        <div style="height:1000px;" />
    </body>
</html>`;
}
