import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as crypto from "../../../src/utils/crypto.js";

test("unit/crypto.js: signature", async () => {
	const key = await crypto.exportKey();
	const cryptoKey = await crypto.importKey(key);

	const data = "data-to-sign";
	const signature = await crypto.sign(cryptoKey, data);

	assert.ok(await crypto.verify(cryptoKey, signature, data));
});

test("unit/crypto.js: force generate token", async () => {
	const now = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 10);
	mock.timers.enable({ apis: ["Date"], now });

	const key = await crypto.exportKey();
	const cryptoKey = await crypto.importKey(key);

	const token = await crypto.forceGenerateToken(cryptoKey);

	assert.ok(await crypto.isForceGenerateTokenValid(cryptoKey, token));

	mock.timers.tick(10 * 1000 + 1);

	assert.ok(!(await crypto.isForceGenerateTokenValid(cryptoKey, token)));

	mock.timers.reset();
});

test("unit/crypto.js: refresh token", async () => {
	const now = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 10);
	mock.timers.enable({ apis: ["Date"], now });

	const key = await crypto.exportKey();
	const cryptoKey = await crypto.importKey(key);

	const token = await crypto.forceRefreshToken(cryptoKey);

	assert.ok(await crypto.isForceRefreshTokenValid(cryptoKey, token));

	mock.timers.tick(10 * 1000 + 1);

	assert.ok(!(await crypto.isForceRefreshTokenValid(cryptoKey, token)));

	mock.timers.reset();
});
