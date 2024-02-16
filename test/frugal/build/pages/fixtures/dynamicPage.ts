import { DataResponse } from "../../../../../packages/frugal/exports/index.js";

export const type = "dynamic";

export const route = "/";

export function generate() {
	return new DataResponse({});
}

export function render() {
	return "Hello world";
}
