import { CookieConfig } from "../../utils/cookies.ts";
import { SessionStorage } from "./SessionStorage.ts";

interface CookieSessionStorageMaker {
	create(cookieConfig?: CookieConfig): SessionStorage;
}

export const CookieSessionStorage: CookieSessionStorageMaker;
