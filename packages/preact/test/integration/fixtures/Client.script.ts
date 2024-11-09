import { hydrate } from "@frugal-node/preact/client";
import { Client } from "./Client.tsx";

export const NAME = "Client";

if (import.meta.environment === "client") {
	hydrate(NAME, () => Client);
}
