import * as hooks from "preact/hooks";
import { pageDataContext } from "./PageDataProvider.js";

/** @type {import('./useLocation.ts').useLocation} */
export function useLocation() {
	const context = hooks.useContext(pageDataContext);
	if (context === null || context === undefined) {
		throw Error("wrap in DataProvider");
	}

	return context.location;
}
