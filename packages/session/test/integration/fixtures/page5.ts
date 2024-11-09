import { RenderContext } from "@frugal-node/core/page";
import "./session.script.ts";

export const route = "/page5";

export function render({}: RenderContext<typeof route, any>) {
	return `<html>
</html>`;
}
