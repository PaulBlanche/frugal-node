import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { MemorySessionStorage } from "../../../src/server/session/MemorySessionStorage.js";
import { SessionManager } from "../../../src/server/session/SessionManager.js";

test("unit/server/SessionManager: load session", async () => {
	const storage = MemorySessionStorage.create();
	const sessionData = { foo: { bar: 1 } };
	storage.update("sessionId", sessionData, { headers: new Headers() });

	const manager = SessionManager.create({
		storage,
		cookie: {
			name: "session_cookie",
		},
	});

	const session = await manager.get(new Headers([["Cookie", "session_cookie=sessionId;"]]));
	assert.deepEqual(session.id, "sessionId");
	assert.deepEqual(session.data, sessionData);
});

test("unit/server/SessionManager: load session with no data in storage", async () => {
	const storage = MemorySessionStorage.create();

	const manager = SessionManager.create({
		storage,
		cookie: {
			name: "session_cookie",
		},
	});

	const session = await manager.get(new Headers([["Cookie", "session_cookie=sessionId;"]]));
	assert.deepEqual(session.id, undefined);
	assert.deepEqual(session.data, {});
});

test("unit/server/SessionManager: load session with no session cookie", async () => {
	const storage = MemorySessionStorage.create();
	storage.update("sessionId", { foo: { bar: 1 } }, { headers: new Headers() });

	const manager = SessionManager.create({
		storage,
		cookie: {
			name: "session_cookie",
		},
	});

	const session = await manager.get(new Headers());
	assert.deepEqual(session.id, undefined);
	assert.deepEqual(session.data, {});
});

test("unit/server/SessionManager: presist new session", async () => {
	const memoryStorage = MemorySessionStorage.create();
	const storage = {
		create: mock.fn(memoryStorage.create),
		get: mock.fn(memoryStorage.get),
		update: mock.fn(memoryStorage.update),
		delete: mock.fn(memoryStorage.delete),
	};

	const manager = SessionManager.create({
		storage,
		cookie: {
			name: "session_cookie",
		},
	});

	const session = await manager.get(new Headers());
	session.set("foo", { bar: 1 });
	session.persist();

	const headers = new Headers();
	await manager.persist(session, headers);

	assert.equal(storage.update.mock.calls.length, 0);
	assert.equal(storage.create.mock.calls.length, 1);

	// biome-ignore lint/performance/useTopLevelRegex: ok in tests
	assert.match(headers.getSetCookie()[0], /session_cookie=[^=]+/);
});

test("unit/server/SessionManager: presist existing session", async () => {
	const memoryStorage = MemorySessionStorage.create();
	memoryStorage.update("sessionId", { foo: { bar: 1 } }, { headers: new Headers() });

	const storage = {
		create: mock.fn(memoryStorage.create),
		get: mock.fn(memoryStorage.get),
		update: mock.fn(memoryStorage.update),
		delete: mock.fn(memoryStorage.delete),
	};

	const manager = SessionManager.create({
		storage,
		cookie: {
			name: "session_cookie",
		},
	});

	const session = await manager.get(new Headers([["Cookie", "session_cookie=sessionId;"]]));
	session.set("baz", { quux: 2 });
	session.persist();

	const headers = new Headers();
	await manager.persist(session, headers);

	assert.equal(storage.update.mock.calls.length, 1);
	assert.equal(storage.create.mock.calls.length, 0);

	assert.equal(headers.getSetCookie()[0], "session_cookie=sessionId");
});
