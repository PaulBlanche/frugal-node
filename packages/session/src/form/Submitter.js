/** @import * as self from "./Submitter.js" */

import { SessionHistory } from "../SessionHistory.js";
import * as utils from "../utils.js";
import { Method } from "./form-constantes.js";

/** @type {self.SubmitterCreator} */
export const Submitter = {
	create,
};

/** @type {self.SubmitterCreator['create']} */
function create(form, config) {
	return {
		async submit(event) {
			const reason = _shouldSubmit();
			if (reason !== undefined) {
				return { status: "aborted", reason };
			}

			event?.preventDefault();

			try {
				await SessionHistory.navigate(form.url, {
					init: {
						method: form.method,
						body: form.method !== Method.GET ? form.body : undefined,
					},
					fallbackType: "throw",
				});

				return { status: "success" };
			} catch (error) {
				return { status: "failure", error };
			}
		},
	};

	/**
	 * @returns {string|undefined}
	 */
	function _shouldSubmit() {
		if (form.method === Method.DIALOG) {
			return "dialog method";
		}

		if (!utils.isInternalUrl(form.url)) {
			return "external url";
		}

		if (!utils.shouldVisit(config.defaultNavigate, form.directive)) {
			return "form directive";
		}

		return undefined;
	}
}
