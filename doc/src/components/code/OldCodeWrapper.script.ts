import { hydrate } from "@frugal-node/preact/client";
import { CodeWrapper } from "./CodeWrapper.tsx";

export const NAME = "CodeWrapper";

if (import.meta.environment === "client") {
	hydrate(NAME, () => CodeWrapper);
}
