import * as livereload from "./LiveReloadClient.js";

/** @type {any} */
const global = window;

if (global.__FRUGAL__DEV__LIVRERELOAD === undefined) {
	const url = new URL("/", location.href);
	url.port = "4075";
	global.__FRUGAL__DEV__LIVRERELOAD = livereload.create(url.href);
}
