import { Form } from "./Form.js";
import { SessionHistory } from "./SessionHistory.js";
import { Submitter } from "./Submitter.js";
import { Method } from "./form-constantes.js";

/** @type {import('./SubmitObserver.ts').SubmitObserverMaker} */
export const SubmitObserver = {
	create,
};

const WIRED_ATTRIBUTE = "data-submit-observer-wired";

/** @type {import('./SubmitObserver.ts').SubmitObserverMaker['create']} */
function create(config) {
	return {
		observe() {
			const isObserving = document.body.hasAttribute(WIRED_ATTRIBUTE);

			if (isObserving) {
				return;
			}

			document.addEventListener("submit", _submit, { capture: false });
			document.body.toggleAttribute(WIRED_ATTRIBUTE, true);
		},
		disconnect() {
			const isObserving = document.body.hasAttribute(WIRED_ATTRIBUTE);

			if (!isObserving) {
				return;
			}

			document.removeEventListener("submit", _submit, { capture: false });
			document.body.toggleAttribute(WIRED_ATTRIBUTE, false);
		},
	};

	/**
	 * @param {SubmitEvent} event
	 */
	async function _submit(event) {
		if (
			!event.cancelable ||
			event.defaultPrevented ||
			!(event.target instanceof HTMLFormElement)
		) {
			return;
		}

		const form = Form.create(event.target, event.submitter);

		if (form.method === Method.DIALOG) {
			return;
		}

		const submitter = Submitter.create(form, config);

		const result = await submitter.submit(event);

		if (result.status === "aborted") {
			console.log(`Navigation aborted: ${result.reason}`);
			SessionHistory.disconnect();
			form.submit();
		}
		if (result.status === "failure") {
			console.error(new Error("Navigation failure", { cause: result.error }));
			SessionHistory.disconnect();
			form.submit();
		}
	}
}
