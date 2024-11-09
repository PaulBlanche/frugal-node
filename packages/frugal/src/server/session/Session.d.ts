import type { PageSession } from "../../page/PageDescriptor.js";
import type { SessionData } from "./SessionStorage.js";

interface Session extends PageSession {
	readonly id: string | undefined;
	readonly data: SessionData;
	readonly shouldBePersisted: boolean;

	persist(): void;
}

interface SessionCreator {
	create(data?: SessionData, id?: string): Session;
}

export let Session: SessionCreator;
