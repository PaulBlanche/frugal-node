import { EmptyResponse } from "../../../../../packages/frugal/exports/index.js";

export const route = "/";

export function build() {
	return new EmptyResponse({
		status: 204,
		headers: {
			"my-header": "quux",
		},
	});
}

export function render() {
	return "Hello world";
}
