import { CookieConfig } from "../../utils/cookies.ts";
import { SessionStorage } from "./SessionStorage.ts";

interface CookieStorageMaker {
	create(cookieConfig?: CookieConfig): SessionStorage;
}

export const CookieStorage: CookieStorageMaker;
