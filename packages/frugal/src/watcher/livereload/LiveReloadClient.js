/** @satisfies {Record<string, import("./LiveReloadClient.ts").LiveReloadStatus>} */
const LIVE_RELOAD_STATUS = /** @type {const} */ ({
	connected: 0,
	pristine: 1,
	suspended: 2,
	error: 3,
});

/** @type {import('./LiveReloadClient.ts').create} */
export function create(url) {
	const state = {
		retry: 0,
	};
	const indicator = new Indicator();
	_connect();

	/**
	 * @param {import("./LiveReloadClient.js").LiveReloadStatus} status
	 */
	function _setStatus(status) {
		indicator.setStatus(status);
	}

	function _connect() {
		const source = new EventSource(url);

		source.addEventListener("error", () => {
			_setStatus(LIVE_RELOAD_STATUS.error);
			source.close();

			const wait = Math.floor((1 - Math.exp(-state.retry / 60)) * 2000);
			console.log(`Unable to connect to live reload server, retry in ${wait} ms`);

			setTimeout(() => {
				state.retry += 1;
				_connect();
			}, wait);
		});

		source.addEventListener("message", (event) => {
			const message = JSON.parse(event.data);

			switch (message.type) {
				case "reload": {
					location.reload();
					break;
				}
				case "suspend": {
					_setStatus(LIVE_RELOAD_STATUS.suspended);
				}
			}
		});

		source.addEventListener("open", () => {
			console.log("Connected to live reload server");
			state.retry = 0;
			_setStatus(LIVE_RELOAD_STATUS.connected);
		});

		addEventListener("beforeunload", () => {
			console.log("close");
			source.close();
		});
	}
}

const UNIQUE_ID = String(Math.random()).replace(".", "");
const scope = `livereload-${UNIQUE_ID}`;

class Indicator {
	/** @type {HTMLElement | undefined} */
	#element;

	constructor() {
		this.#setupDOM();
	}

	#setupDOM() {
		if (typeof document === "undefined") {
			return;
		}

		const styleElement = document.createElement("style");
		document.head.appendChild(styleElement);

		const styleSheet = styleElement.sheet;

		// base style
		styleSheet?.insertRule(
			`.${scope} { position: fixed; z-index: 10000; width: 40px; height: 40px; right: 20px; bottom: 20px; pointer-events:none; }`,
		);
		styleSheet?.insertRule(`.${scope}.suspended, .${scope}.error { pointer-events: all }`);

		// suspend styme
		styleSheet?.insertRule(
			"@keyframes suspended { 0% { opacity: 1; transform: scale(0); } 100% { opacity: 0; transform: scale(1); } }",
		);
		styleSheet?.insertRule(`.${scope}.suspended::after { animation-delay: 1s; }`);
		styleSheet?.insertRule(
			`.${scope}.suspended::before,.${scope}.suspended::after { content: ''; position: absolute; inset: 0; background-color: black; border-radius: 50%; opacity: 1; transform: scale(0); animation: linear 2s infinite suspended; }`,
		);

		// error style
		styleSheet?.insertRule("@keyframes error { 0% { opacity: 1; } 100% { opacity: 0.6; } }");
		styleSheet?.insertRule(
			`.${scope}.error { background: rgb(204, 51, 0); border-radius: 50%; display: flex; justify-content: center; align-items: center; animation: linear 0.3s infinite alternate error; }`,
		);
		styleSheet?.insertRule(
			`.${scope}.error::before { content: "!"; color: white; font-weight: bold; font-size: 25px; }`,
		);

		this.#element = document.createElement("div");
		this.#element.classList.add(scope);
		document.body.append(this.#element);
	}

	/** @param {import("./LiveReloadClient.ts").LiveReloadStatus} status */
	setStatus(status) {
		switch (status) {
			case LIVE_RELOAD_STATUS.suspended: {
				this.#element?.classList.toggle("error", false);
				this.#element?.classList.toggle("suspended", true);
				this.#element?.setAttribute("title", "toto");
				break;
			}
			case LIVE_RELOAD_STATUS.connected: {
				this.#element?.classList.toggle("error", false);
				this.#element?.classList.toggle("suspended", false);
				this.#element?.removeAttribute("title");
				break;
			}
			case LIVE_RELOAD_STATUS.error: {
				this.#element?.classList.toggle("error", true);
				this.#element?.classList.toggle("suspended", false);
				this.#element?.setAttribute("title", "tata");
				break;
			}
		}
	}
}
