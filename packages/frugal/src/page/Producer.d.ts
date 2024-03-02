import { FrugalConfig } from "../Config.ts";
import { CollectedAssets } from "./Assets.js";
import { GenerationResponse } from "./GenerationResponse.ts";
import { Page } from "./Page.js";
import { Session, State } from "./PageDescriptor.ts";
import { Collapse } from "./PathObject.ts";

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

export const Producer: ProducerMaker;

export class ProducerError extends Error {}
