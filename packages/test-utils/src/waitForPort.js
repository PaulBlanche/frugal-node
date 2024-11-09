import * as net from "node:net";

/**
 * @param {{ port:number, hostname:string, timeout?:number, retry?:number }} options
 */
export async function waitForPort(options) {
	let isPortFree = false;
	let finished = false;
	const timeoutPromise = new Promise((_, rej) =>
		setTimeout(() => {
			finished = true;
			rej(new Error("timeout"));
		}, options.timeout ?? 2000),
	);
	const pollingPromise = (async () => {
		while (!(isPortFree || finished)) {
			const isPortAcceptingConnections = await checkPort(options);
			isPortFree = !isPortAcceptingConnections;
			await new Promise((res) => setTimeout(res, options.retry ?? 250));
		}
	})();

	return Promise.race([pollingPromise, timeoutPromise]);
}

/**
 * @param {{ port:number, hostname:string, timeout?:number, retry?:number }} options
 */
export async function waitForServer(options) {
	let isPortOccupied = false;
	let finished = false;
	const timeoutPromise = new Promise((_, rej) =>
		setTimeout(() => {
			finished = true;
			rej(new Error("timeout"));
		}, options.timeout ?? 2000),
	);
	const pollingPromise = (async () => {
		while (!(isPortOccupied || finished)) {
			const isPortAcceptingConnections = await checkPort(options);
			isPortOccupied = isPortAcceptingConnections;
			await new Promise((res) => setTimeout(res, options.retry ?? 250));
		}
	})();

	return Promise.race([pollingPromise, timeoutPromise]);
}

/**
 * @param {{ port:number, hostname:string }} options
 */
function checkPort({ port, hostname }) {
	const deferredResult = Promise.withResolvers();

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

	return deferredResult.promise;
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
