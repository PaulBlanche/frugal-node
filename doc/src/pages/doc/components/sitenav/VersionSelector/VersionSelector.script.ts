import { hydrate } from "@frugal-node/preact/client";
import { VersionSelector } from "./VersionSelector.tsx";

export const NAME = "VersionSelector";

if (import.meta.environment === "client") {
	hydrate(NAME, () => VersionSelector);
}
