import { hydrate } from "@frugal-node/preact/client";
import { Slotter } from "./Slotter.tsx";

export const NAME = "Slotter";

if (import.meta.environment === "client") {
	hydrate(NAME, () => Slotter);
}
