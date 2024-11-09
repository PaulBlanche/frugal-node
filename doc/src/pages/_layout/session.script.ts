import { Session } from "@frugal-node/session";

if (import.meta.environment === "client") {
	Session.init();
}
