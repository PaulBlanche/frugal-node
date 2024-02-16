import * as assert from "node:assert/strict";
import { test } from "node:test";
import * as crypto from "../../../packages/frugal/src/utils/crypto.js";

test("unit/frugal/utils/crypto.js: signature", async () => {
	const key = await crypto.exportKey();
	const cryptoKey = await crypto.importKey(key);

	const data = "data-to-sign";
	const signature = await crypto.sign(cryptoKey, data);

	assert.ok(await crypto.verify(cryptoKey, signature, data));
});
