import * as net from "node:net";
import { Deferred } from "../../packages/frugal/exports/utils/deferred/index.js";

/**
 * @param {{ port:number, hostname:string, timeout?:number, retry?:number }} options
 */
export async function waitForPort(options) {
	let isPortFree = false;
	const timeoutPromise = new Promise((_, rej) =>
		setTimeout(() => rej(new Error("timeout")), options.timeout ?? 2000),
	);
	const pollingPromise = (async () => {
		while (!isPortFree) {
			const isPortAcceptingConnections = await checkPort(options);
			isPortFree = !isPortAcceptingConnections;
			await new Promise((res) => setTimeout(res, options.retry ?? 250));
		}
	})();

	return Promise.race([pollingPromise, timeoutPromise]);
}

/**
 * @param {{ port:number, hostname:string }} options
 */
function checkPort({ port, hostname }) {
	const deferredResult = Deferred.create();

	const client = new net.Socket();

	client.once("connect", () => {
		cleanup(client);
		deferredResult.resolve(true);
	});

	client.once("error", (error) => {
		cleanup(client);
		if (/** @type {Error & {code?:string}}*/ (error).code === "ECONNREFUSED") {
			deferredResult.resolve(false);
		} else {
			deferredResult.reject(error);
		}
	});

	client.connect({ port, host: hostname });

	return deferredResult;
}

/**
 *
 * @param {net.Socket} socket
 */
function cleanup(socket) {
	socket.removeAllListeners();
	socket.end();
	socket.destroy();
	socket.unref();
}
