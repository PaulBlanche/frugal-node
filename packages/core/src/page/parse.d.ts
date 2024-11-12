import type { ServerData } from "../utils/serverData.js";
import type { Page } from "./Page.js";
import type { PageDescriptor } from "./PageDescriptor.js";

export function parse<PATH extends string, DATA extends ServerData>(page: {
	descriptor: PageDescriptor<PATH, DATA>;
	moduleHash: string;
	entrypoint: string;
}): Page<PATH, DATA>;
