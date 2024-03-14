/** @satisfies {Record<string, import("./LiveReloadClient.ts").LiveReloadStatus>} */
const LIVE_RELOAD_STATUS = /** @type {const} */ ({
	connected: 0,
	pristine: 1,
	suspended: 2,
	error: 3,
});

const BACKOFF = (() => {
	let i = 100;
	let m = 0.084;
	return Array.from({ length: 20 }, () => {
		const current = i;
		i = Math.floor(i + m * i);
		m = m + 0.01;
		return current;
	});
})();

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

			const wait = BACKOFF[Math.min(state.retry, BACKOFF.length - 1)];
			console.log(
				`%cFrugal dev server%c Unable to connect to live reload server, retry in ${wait} ms`,
				"background-color: #FFCB74; color: black; padding: 2px 5px;",
				"color: inherit",
			);

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
			console.log(
				"%cFrugal dev server%c Connected to live reload server",
				"background-color: #FFCB74; color: black; padding: 2px 5px;",
				"color: inherit",
			);
			state.retry = 0;
			_setStatus(LIVE_RELOAD_STATUS.connected);
		});

		addEventListener("beforeunload", () => {
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
