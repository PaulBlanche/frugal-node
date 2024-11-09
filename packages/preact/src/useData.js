import * as hooks from "preact/hooks";
import { pageDataContext } from "./PageDataProvider.js";

/** @type {import('./useData.ts').useData} */
export function useData() {
	const context = hooks.useContext(pageDataContext);
	if (context === null || context === undefined) {
		throw Error("wrap in DataProvider");
	}

	if (!context.embedData && typeof document !== "undefined") {
		throw Error("data was not embeded in document");
	}

	return /** @type {any}*/ (context.data);
}
