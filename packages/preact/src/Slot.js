/** @import * as self from "./Slot.js" */

import * as preact from "preact";
import * as hooks from "preact/hooks";
import { environmentContext } from "./environmentContext.js";

/** @type {self.Slot} */
export function Slot(props) {
	const environment = hooks.useContext(environmentContext);

	// if we are in a slot context (server side or client side), slot behave
	// like a fragment
	if (environment.type === "slot") {
		return preact.h(preact.Fragment, {}, props.children);
	}

	// if we are in an island context server side, render the slot comments
	//  markers and switch to a server context
	if (typeof document === "undefined") {
		return preact.h(environmentContext.Provider, { value: { type: "slot" } }, [
			preact.h(`!--frugal-slot:start:${props.islandId}:${props.slotId}--`, null),
			props.children,
			preact.h(`!--frugal-slot:end:${props.islandId}:${props.slotId}--`, null),
		]);
	}

	// if we are in an island context client side, render a slot placeholder
	return preact.h(`frugal-slot-${props.islandId}-${props.slotId}`, null);
}
