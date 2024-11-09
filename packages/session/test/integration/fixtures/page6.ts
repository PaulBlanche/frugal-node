import { RenderContext } from "@frugal-node/core/page";
import "./session.script.ts";

export const route = "/page6";

export function render({ assets }: RenderContext<typeof route, any>) {
	return `<html>
	<head>
        <script type="module" src="${assets.get("js")[0].path}"></script>
		<script>window.scriptCount=(window.scriptCount??0)+1;</script>
		<script type="module" src="data:application/javascript,window.moduleCount=(window.moduleCount??0)+1;"></script>
	</head>
	<body>
		<a href="/page7">page7</a>
	</body>
</html>`;
}
