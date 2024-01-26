import * as assert from "node:assert/strict";
import { test } from "node:test";

import * as webstream from "../../../src/utils/webstream.js";

test("utils/webstream.js: readStream", async () => {
	const stream = webstream.ReadableStream.from(["1", "2", "3"]);
	assert.strictEqual(await webstream.readStream(stream), "123");
});
