import { hydrate } from "@frugal-node/preact/client";
import { DisplayCount } from "./DisplayCount.tsx";

export const NAME = "DisplayCount";

if (import.meta.environment === "client") {
	hydrate(NAME, () => DisplayCount);
}
