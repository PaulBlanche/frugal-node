import { SessionHistory } from "./SessionHistory.js";
import * as utils from "./utils.js";

export const Navigator = {
	create,
};

/** @type {import('./Navigator.ts').NavigatorMaker['create']} */
function create(anchor, config) {
	const url = utils.getUrl(anchor.href);

	return {
		async navigate(event) {
			const reason = _shouldNavigate(url);
			if (reason !== undefined) {
				return { status: "aborted", reason };
			}

			event.preventDefault();

			try {
				await SessionHistory.navigate(url);

				return { status: "success" };
			} catch (error) {
				return { status: "failure", error };
			}
		},
	};

	/**
	 * @param {URL|string} url
	 * @returns {string|undefined}
	 */
	function _shouldNavigate(url) {
		const rel = anchor.rel ?? "";
		const isExternal = rel.split(" ").includes("external");
		const directive = anchor.getAttribute("data-frugal-navigate");

		if (!utils.shouldVisit(config.defaultNavigate, directive)) {
			return "anchor directive";
		}

		if (isExternal || !utils.isInternalUrl(url)) {
			return "external url";
		}
	}
}
