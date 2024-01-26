import { RenderContext } from "../../page/PageDescriptor.js";
import { JsonValue } from "../../utils/jsonValue.js";
import * as webstream from "../../utils/webstream.js";

export type Init<DATA extends JsonValue> = {
	path: string;
	moduleHash: string;
	configHash: string;
	render: (data: DATA) => string | webstream.ReadableStream<string>;
};

export type SerializedCacheableResponse = {
	path: string;
	hash: string;
	body?: string;
	headers: [string, string][];
	status?: number;
};
