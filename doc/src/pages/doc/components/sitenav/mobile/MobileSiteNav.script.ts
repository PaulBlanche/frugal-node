import { hydrate } from "@frugal-node/preact/client";
import { MobileSiteNav } from "./MobileSiteNav.tsx";

export const NAME = "MobileSiteNav";

if (import.meta.environment === "client") {
	hydrate(NAME, () => MobileSiteNav);
}
