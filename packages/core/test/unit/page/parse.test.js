import * as assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "../../../src/page/parse.js";

test("unit/parse: empty descriptor", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({}),
		});
	});
});

test("unit/parse: descriptor with just a route", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
			}),
		});
	});
});

test("unit/parse: descriptor with route and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				render: () => "",
			},
		});
	});
});

test("unit/parse: descriptor with route not starting with '/'", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "foo",
				render: () => "",
			},
		});
	});
});

test("unit/parse: descriptor with non string route", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: true,
				render: () => "",
			}),
		});
	});
});

test("unit/parse: descriptor with non function render", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				render: 3,
			}),
		});
	});
});

test("unit/parse: descriptor with route, generate and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				generate: () => undefined,
				render: () => "",
			},
		});
	});
});

test("unit/parse: descriptor with non function generate", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				generate: 3,
				render: () => "",
			}),
		});
	});
});

test("unit/parse: descriptor with route, getBuildPaths and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				getBuildPaths: () => [],
				render: () => "",
			},
		});
	});
});

test("unit/parse: descriptor with non function getBuildPaths", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				getBuildPaths: 3,
				render: () => "",
			}),
		});
	});
});

test("unit/parse: descriptor with route, strictPaths and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				strictPaths: true,
				render: () => "",
			},
		});
	});
});

test("unit/parse: descriptor with non boolean strictPaths", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				strictPaths: 3,
				render: () => "",
			}),
		});
	});
});

test("unit/parse: valid descriptor with extra properties", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				render: () => "",
				extra: "extra",
			}),
		});
	});
});

test("unit/parse: descriptor with route, build and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				render: () => "",
				build: () => undefined,
			},
		});
	});
});

test("unit/parse: descriptor with non function build", () => {
	assert.throws(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				render: () => "",
				build: 3,
			}),
		});
	});
});

test("unit/parse: dynamic descriptor without generate function", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				type: "dynamic",
				route: "/foo",
				render: () => "",
			},
		});
	});
});

test("unit/parse: dynamic descriptor with route, generate and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				type: "dynamic",
				route: "/foo",
				render: () => "",
				generate: () => undefined,
			},
		});
	});
});

test("unit/parse: hybrid static descriptor with route, build, generate and render", () => {
	assert.doesNotThrow(() => {
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				render: () => "",
				build: () => undefined,
				generate: () => undefined,
			},
		});
	});
});

test("unit/parse: implicit static page", () => {
	assert.ok(
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				route: "/foo",
				render: () => "foo",
			},
		}).type === "static",
		"descriptor should be compiled as StaticPage by default",
	);
});

test("unit/parse: explicit static page", () => {
	assert.equal(
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: {
				type: "static",
				route: "/foo",
				render: () => "foo",
			},
		}).type,
		"static",
	);
});

test("unit/parse: explicit dynamic page", () => {
	assert.equal(
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				type: "dynamic",
				route: "/foo",
				render: () => "foo",
				generate: () => undefined,
			}),
		}).type,
		"dynamic",
	);
});

test("unit/parse: hybrid static page", () => {
	assert.equal(
		parse({
			entrypoint: "foo",
			moduleHash: "bar",
			descriptor: /** @type {any} */ ({
				route: "/foo",
				render: () => "foo",
				build: () => undefined,
				generate: () => undefined,
			}),
		}).type,
		"static",
	);
});
