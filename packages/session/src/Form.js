import { EncodingType, Method } from "./form-constantes.js";
import * as utils from "./utils.js";

/** @type {import('./Form.ts').FormMaker} */
export const Form = {
	create,
};

/** @type {import('./Form.ts').FormMaker['create']} */
function create(form, submitter) {
	return {
		submit() {
			form.submit();
		},
		get directive() {
			return form.getAttribute("data-frugal-navigate");
		},
		get enctype() {
			return getEncType(form.enctype);
		},
		get url() {
			const url = utils.getUrl(
				submitter?.getAttribute("formaction") ??
					form.getAttribute("action") ??
					form.action ??
					"",
			);

			if (this.method === Method.GET) {
				url.search = formDataToUrlSearchParams(this.formData).toString();
			}

			return url;
		},
		get method() {
			const method =
				submitter?.getAttribute("formmethod") || form.getAttribute("method") || "GET";
			return getMethod(method);
		},
		get formData() {
			const formData = new FormData(form);
			const submitterName = submitter?.getAttribute("name");
			const submitterValue = submitter?.getAttribute("value");

			if (typeof submitterName === "string") {
				formData.set(submitterName, submitterValue ?? "");
			}

			return formData;
		},
		get body() {
			if (this.enctype === EncodingType.URLENCODED) {
				return formDataToUrlSearchParams(this.formData);
			}

			return this.formData;
		},
	};
}

/**
 *
 * @param {string} enctype
 * @returns {(typeof EncodingType)[keyof typeof EncodingType]}
 */
function getEncType(enctype) {
	switch (enctype) {
		case EncodingType.MULTIPART: {
			return EncodingType.MULTIPART;
		}
		case EncodingType.PLAIN: {
			return EncodingType.PLAIN;
		}
		default: {
			return EncodingType.URLENCODED;
		}
	}
}

/**
 *
 * @param {string} method
 * @returns {(typeof Method)[keyof typeof Method]}
 */
function getMethod(method) {
	switch (method.toUpperCase()) {
		case Method.GET: {
			return Method.GET;
		}
		case Method.DIALOG: {
			return Method.DIALOG;
		}
		default: {
			return Method.POST;
		}
	}
}

/**
 * @param {FormData} formData
 * @returns {URLSearchParams}
 */
function formDataToUrlSearchParams(formData) {
	const urlSearchParams = new URLSearchParams();

	for (const [name, value] of formData.entries()) {
		if (typeof value === "string") {
			urlSearchParams.set(name, value);
		}
	}

	return urlSearchParams;
}
