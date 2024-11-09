import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mockFs } from "@frugal-node/test-utils";

const fsMockContext = mock.module(new URL("../../../src/utils/fs.js", import.meta.url).toString(), {
	namedExports: mockFs.MOCK_FS,
});

// use a hash to ensure getting a new instance of the module, that will be instanciated using the previously mocked module
const { dependencies } = /** @type {typeof import('../../../src/utils/dependencies.js')} */ (
	await import(`../../../src/utils/dependencies.js#${Math.random()}`)
);

test("unit/dependencies: extract list of dependencies of a module", async () => {
	await mockFs.MOCK_FS.writeTextFile("/root/foo.js", 'import "./bar.js"');
	await mockFs.MOCK_FS.writeTextFile("/root/bar.js", 'import "./quux.js"');
	await mockFs.MOCK_FS.writeTextFile("/root/quux.js", "export const a = 1;");
	await mockFs.MOCK_FS.writeTextFile("/root/baz.js", "export const b = 1;");

	const deps = await dependencies("/root/foo.js");

	assert.deepEqual(deps, ["/root/foo.js", "/root/bar.js", "/root/quux.js"]);
});

fsMockContext.restore();
