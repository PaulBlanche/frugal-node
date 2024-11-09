import { PageResponse } from "../../../../../exports/page/index.js";

export const type = "dynamic";

export const route = "/";

export function generate() {
	return PageResponse.data({});
}

export function render() {
	return "Hello world";
}
