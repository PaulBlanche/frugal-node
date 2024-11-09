import type { FrugalResponse } from "./FrugalResponse.js";
import type { Page } from "./Page.js";
import type { Asset } from "./PageAssets.js";
import type { PageSession, State } from "./PageDescriptor.ts";

export interface Producer {
	buildAll(): Promise<FrugalResponse[]>;
	build(context: { params: Partial<Record<string, string | string[]>> }): Promise<
		FrugalResponse | undefined
	>;
	generate(context: {
		request: Request;
		path: string;
		params: Partial<Record<string, string | string[]>>;
		state: State;
		session?: PageSession;
	}): Promise<FrugalResponse | undefined>;
	refresh(context: {
		request: Request;
		params: Partial<Record<string, string | string[]>>;
		jit: boolean;
	}): Promise<FrugalResponse | undefined>;
}

interface ProducerCreator {
	create(manifestAssets: Asset[], page: Page, configHash: string): Producer;
}

export let Producer: ProducerCreator;

export class ProducerError extends Error {}
