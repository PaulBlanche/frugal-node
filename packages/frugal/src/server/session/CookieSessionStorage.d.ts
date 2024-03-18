import type { CookieConfig } from "../../utils/cookies.ts";
import type { SessionStorage } from "./SessionStorage.ts";

interface CookieSessionStorageMaker {
	create(cookieConfig?: CookieConfig): SessionStorage;
}

export let CookieSessionStorage: CookieSessionStorageMaker;
