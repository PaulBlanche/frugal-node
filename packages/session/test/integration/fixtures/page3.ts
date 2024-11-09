import { RenderContext } from "@frugal-node/core/page";
import "./session.script.ts";

export const route = "/page3";

export function render({ assets }: RenderContext<typeof route, any>) {
	return `<html>
    <head>
        <title>page 3</title>
        <script type="module" src="${assets.get("js")[0].path}"></script>
    </head>
    <body>
        <a href="/page1"><span class="nested">nested</span></a>
        <a class="external" rel="external" href="/page5">external</a>
        <a class="disabled" data-frugal-navigate="false" href="/page5">disabled</a>
        <a class="remote-disabled" href="/page4">remote disabled</a>
    </body>
</html>`;
}
