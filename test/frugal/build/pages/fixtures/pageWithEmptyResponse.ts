import * as frugal from "../../../../../packages/frugal/exports/page/index.js";

export const route = "/";

export function build(context: frugal.BuildContext<typeof route>) {
	return context.empty({
		status: 204,
		headers: {
			"my-header": "quux",
		},
	});
}

export function render() {
	return "Hello world";
}
