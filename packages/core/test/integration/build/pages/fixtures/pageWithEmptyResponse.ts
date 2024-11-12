import { PageResponse } from "../../../../../exports/page/index.js";

export const route = "/";

export function build() {
	return PageResponse.empty({
		status: 204,
		headers: {
			"my-header": "quux",
		},
	});
}

export function render() {
	return "Hello world";
}
