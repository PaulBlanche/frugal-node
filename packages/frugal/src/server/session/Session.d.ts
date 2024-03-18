import type { Session as PublicSession } from "../../page/PageDescriptor.js";
import type { SessionData } from "./SessionStorage.js";

interface PrivateSession extends PublicSession {
	readonly id: string | undefined;
	readonly data: SessionData;
	readonly shouldBePersisted: boolean;

	persist(): void;
}

interface SessionMaker {
	create(data?: SessionData, id?: string): PrivateSession;
}

export let Session: SessionMaker;
