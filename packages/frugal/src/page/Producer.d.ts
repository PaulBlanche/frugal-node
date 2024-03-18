import type { FrugalConfig } from "../Config.ts";
import type { CollectedAssets } from "./Assets.js";
import type { GenerationResponse } from "./GenerationResponse.ts";
import type { Page } from "./Page.js";
import type { Session, State } from "./PageDescriptor.ts";
import type { Collapse } from "./PathObject.ts";

export interface Producer {
	buildAll(): Promise<GenerationResponse[]>;
	build(params: Collapse<unknown>): Promise<GenerationResponse | undefined>;
	generate(
		request: Request,
		path: string,
		params: Collapse<unknown>,
		state: State,
		session?: Session,
	): Promise<GenerationResponse | undefined>;
	refresh(params: Collapse<unknown>): Promise<GenerationResponse | undefined>;
}

interface ProducerMaker {
	create(
		manifestAssets: CollectedAssets,
		page: Page,
		configHash: string,
		config: FrugalConfig,
	): Producer;
}

export let Producer: ProducerMaker;

export class ProducerError extends Error {}
