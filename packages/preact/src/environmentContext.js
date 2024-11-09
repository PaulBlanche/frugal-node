import * as preact from "preact";

export const environmentContext = /** @type {preact.Context<{ type:"slot" }|{type:"island" }>} */ (
	preact.createContext({ type: "slot" })
);
