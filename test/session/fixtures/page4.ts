import { RenderContext } from "../../../packages/frugal/exports/page/index.js";
import "./session.script.ts";

export const route = "/page4";

export function render({ assets }: RenderContext<typeof route, any>) {
	return `<html>
    <head>
        <meta name="frugal-navigate" content="false" />
    </head>
</html>`;
}
