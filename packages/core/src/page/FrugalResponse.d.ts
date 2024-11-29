import type { ServerData } from "../utils/serverData.js";
import type { PageResponse } from "./PageResponse.js";

export type Init<DATA extends ServerData> = {
	path: string;
	moduleHash: string;
	configHash: string;
	cryptoKey: Promise<CryptoKey | undefined> | undefined;
	render: (data: DATA) => string;
};

export type SerializedFrugalResponse = {
	path: string;
	hash: string;
	body?: string | undefined;
	headers: [string, string][];
	status: number;
};

export interface FrugalResponse {
	readonly path: string;
	readonly hash: string;
	readonly body: string | undefined;
	readonly headers: Headers;
	readonly status: number;
	serialize(): SerializedFrugalResponse;
}

interface FrugalResponseCreator {
	create<DATA extends ServerData>(
		response: PageResponse<DATA>,
		init: Init<DATA>,
	): Promise<FrugalResponse>;
}

export let FORCE_GENERATE_COOKIE: string;

export let FrugalResponse: FrugalResponseCreator;

export function toResponse(response: FrugalResponse | SerializedFrugalResponse): Response;
