import { DataResponse } from "../../../../../index.js";

export const route = "/";

export function generate() {
	return new DataResponse({});
}

export function render() {
	return "Hello world";
}
