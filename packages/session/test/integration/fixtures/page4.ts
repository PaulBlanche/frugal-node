import { RenderContext } from "@frugal-node/core/page";
import "./session.script.ts";

export const route = "/page4";

export function render({}: RenderContext<typeof route, any>) {
	return `<html>
    <head>
        <meta name="frugal-navigate" content="false" />
    </head>
</html>`;
}
