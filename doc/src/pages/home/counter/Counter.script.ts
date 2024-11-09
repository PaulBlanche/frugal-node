import { hydrate } from "@frugal-node/preact/client";
import { Counter } from "./Counter.tsx";

export const NAME = "Counter";

if (import.meta.environment === "client") {
	hydrate(NAME, () => Counter);
}
