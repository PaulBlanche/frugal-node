import type { FrugalResponse } from "./FrugalResponse.js";
import type { Page } from "./Page.js";
import type { PageAssets } from "./PageAssets.js";
import type { PageSession, State } from "./PageDescriptor.js";

export interface Producer {
	getPathParams(): Promise<Partial<Record<string, string | string[]>>[]>;
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
}

interface ProducerCreator {
	create(
		assets: PageAssets,
		page: Page,
		configHash: string,
		cryptoKey: Promise<CryptoKey | undefined> | undefined,
	): Producer;
}

export let Producer: ProducerCreator;

export class ProducerError extends Error {}
