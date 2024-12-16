import * as assert from "node:assert/strict";
import test from "node:test";
import { appendToBody } from "../../../src/server/utils.js";

test("unit/server/utils: appendToBody", () => {
	assert.strictEqual(appendToBody("hello world", "appended"), "hello worldappended");
	assert.strictEqual(
		appendToBody("<html>hello world</html>foo", "appended"),
		"<html>hello worldappended</html>foo",
	);
	assert.strictEqual(
		appendToBody("<html><body>hello world</body>quux</html>foo", "appended"),
		"<html><body>hello worldappended</body>quux</html>foo",
	);
});
