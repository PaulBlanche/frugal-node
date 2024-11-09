import { RenderContext } from "@frugal-node/core/page";
import "./session.script.ts";

export const route = "/page7";

export function render({ assets }: RenderContext<typeof route, any>) {
	return `<html>
	<head>
        <script type="module" src="${assets.get("js")[0].path}"></script>
		<script>window.scriptCount=(window.scriptCount??0)+1;</script>
		<script type="module" src="data:application/javascript,window.moduleCount=(window.moduleCount??0)+1;"></script>
		<script>dispatchEvent(new CustomEvent("script", { detail: window.scriptCount }));</script>
		<script>dispatchEvent(new CustomEvent("module", { detail: window.moduleCount }));</script>
	</head>
	<body>
		<a href="/page6">page6</a>
	</body>
</html>`;
}
