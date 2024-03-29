import * as assert from "node:assert/strict";
import { mock, test } from "node:test";

import { Page, PageError } from "../../../packages/frugal/src/page/Page.js";
import { PageResponse } from "../../../packages/frugal/src/page/PageResponse.js";
import * as jsonValue from "../../../packages/frugal/src/utils/jsonValue.js";

test("unit/frugal/page/Page.js: compile errors", () => {
	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({}),
			}),
		"empty descriptor should not compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
				}),
			}),
		"descriptor with just route should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: () => {},
				}),
			}),
		"descriptor with route and render should not compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "foo",
					render: () => {},
				}),
			}),
		'descriptor with route not starting with "/" should not compile',
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: true,
					render: () => {},
				}),
			}),
		"descriptor with non string route should not compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: 3,
				}),
			}),
		"descriptor with non function render should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					generate: () => {},
					render: () => {},
				}),
			}),
		"descriptor with route, generate and render should compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					generate: 3,
					render: () => {},
				}),
			}),
		"descriptor with non function generate should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					getBuildPaths: () => {},
					render: () => {},
				}),
			}),
		"descriptor with route, getBuildPaths and render should compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					getBuildPaths: 3,
					render: () => {},
				}),
			}),
		"descriptor with non function getBuildPaths should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					strictPaths: true,
					render: () => {},
				}),
			}),
		"descriptor with route, strictPaths and render should compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					strictPaths: 3,
					render: () => {},
				}),
			}),
		"descriptor with non boolean strictPaths should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: () => {},
					extra: "extra",
				}),
			}),
		"valid descriptor with extra properties should compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: () => {},
					build: () => {},
				}),
			}),
		"valid descriptor with route, build and render should compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: () => {},
					build: 3,
				}),
			}),
		"valid descriptor with non function build should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: () => {},
					generate: () => {},
				}),
			}),
		"valid descriptor with route, generate and render should compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					route: "/foo",
					render: () => {},
					generate: 3,
				}),
			}),
		"valid descriptor with non function generate should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					type: "dynamic",
					route: "/foo",
					render: () => {},
				}),
			}),
		"dynamic descriptor without generate function should compile",
	);

	assert.throws(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					type: "dynamic",
					route: "/foo",
					render: () => {},
					generate: 3,
				}),
			}),
		"dynamic descriptor with non function generate should not compile",
	);

	assert.doesNotThrow(
		() =>
			Page.create({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({
					type: "dynamic",
					route: "/foo",
					render: () => {},
					generate: () => {},
				}),
			}),
		"valid dynamic descriptor with route, generate and render should compile",
	);
});

test("unit/frugal/page/Page.js: compile type", () => {
	assert.ok(
		Page.create({
			entrypoint: "foo",
			moduleHash: "bar",
			pageDescriptor: {
				route: "/foo",
				render: () => "foo",
			},
		}).type === "static",
		"descriptor should be compiled as StaticPage by default",
	);
	assert.ok(
		Page.create({
			entrypoint: "foo",
			moduleHash: "bar",
			pageDescriptor: /** @type {any} */ ({
				type: "dynamic",
				route: "/foo",
				render: () => "foo",
				generate: () => {},
			}),
		}).type === "dynamic",
		"descriptor with type 'dynamic' and generate function should be compiled as DynamicPage",
	);
});

test("unit/frugal/page/Page.js: complete StaticPage", () => {
	const spyRender = mock.fn(() => "foo");
	const spyBuild = mock.fn((context) => context.empty({}));
	const spyGetBuildPaths = mock.fn(() => [{ id: "1" }]);
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			route: "/foo/:id",
			render: spyRender,
			strictPaths: false,
			getBuildPaths: spyGetBuildPaths,
			build: spyBuild,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");
	assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its own moduleHash");
	assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its own entrypoint");
	assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its own route");
	assert.deepEqual(
		compiledPage.strictPaths,
		descriptor.strictPaths,
		"Page should hold its own route",
	);

	compiledPage.getBuildPaths();
	assert.strictEqual(spyGetBuildPaths.mock.calls.length, 1);

	const buildContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").BuildContext<"/foo/:id">} */ ({
			empty: (init) => PageResponse.empty(init),
		});
	compiledPage.build(buildContext);
	assert.strictEqual(spyBuild.mock.calls.length, 1);
	assert.deepEqual(spyBuild.mock.calls[0].arguments, [buildContext]);

	const renderContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({});
	compiledPage.render(renderContext);
	assert.strictEqual(spyRender.mock.calls.length, 1);
	assert.deepEqual(spyRender.mock.calls[0].arguments, [renderContext]);

	assert.deepEqual(
		compiledPage.compile({ id: "1" }),
		"/foo/1",
		"Page should compile route with given parameters",
	);
	assert.throws(
		() => {
			compiledPage.compile(/** @type {any} */ ({ foo: "1" }));
		},
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while compiling route "/foo/:id" for params "{"foo":"1"}"',
			);
			return true;
		},
		"Page should throw when compiling with invalid parameters",
	);

	assert.deepEqual(
		compiledPage.match("/bar"),
		false,
		"Page should match a path against its own route",
	);

	assert.deepEqual(
		JSON.stringify(/** @type {any} */ (compiledPage.match("/foo/3")).params),
		JSON.stringify({ id: "3" }),
		"Page should match a path against its own route",
	);
});

test("unit/frugal/page/Page.js: StaticPage with descriptor that throws", async () => {
	const renderError = new Error("render");
	const getBuildPathsError = new Error("getBuildPaths");
	const buildError = new Error("build");
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ (
			/** @type {unknown} */ ({
				route: "/foo/:id",
				render: () => {
					throw renderError;
				},
				getBuildPaths: () => {
					throw getBuildPathsError;
				},
				build: () => {
					throw buildError;
				},
			})
		);
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");

	assert.throws(
		() => compiledPage.getBuildPaths(),
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while building path list for route "/foo/:id"',
			);
			assert.strictEqual(error.cause, getBuildPathsError);
			return true;
		},
		"getBuildPaths should throw an error wrapping the underlying error",
	);

	const buildContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").BuildContext<"/foo/:id">} */ ({
			params: { id: "3" },
		});
	await assert.rejects(
		() => compiledPage.build(buildContext),
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while building route "/foo/:id" for params "{"id":"3"}"',
			);
			assert.strictEqual(error.cause, buildError);
			return true;
		},
		"build should throw an error wrapping the underlying error",
	);

	const renderContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({
			params: { id: "3" },
		});
	assert.throws(
		() => compiledPage.render(renderContext),
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while rendering route "/foo/:id" for params "{"id":"3"}"',
			);
			assert.strictEqual(error.cause, renderError);
			return true;
		},
		"render should throw an error wrapping the underlying error",
	);
});

test("unit/frugal/page/Page.js: StaticPage with build that returns nothing", async () => {
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			route: "/foo/:id",
			render: () => "foo",
			build: () => {
				return undefined;
			},
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");

	const buildContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").BuildContext<"/foo/:id">} */ ({
			params: { id: "3" },
		});
	assert.deepStrictEqual(
		await compiledPage.build(buildContext),
		undefined,
		"should return undefined",
	);
});

test("unit/frugal/page/Page.js: minimal StaticPage", async () => {
	const spyRender = mock.fn(() => "foo");
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			route: "/foo/:id",
			render: spyRender,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");
	assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its own moduleHash");
	assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its own entrypoint");
	assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its own route");
	assert.deepEqual(compiledPage.strictPaths, true, "Page should default to true");

	assert.deepEqual(
		compiledPage.getBuildPaths(),
		[{}],
		"defaul getBuildPaths should default to returning an array of one empty object",
	);

	const buildContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").BuildContext<"/foo/:id">} */ ({
			data: (data, init) => PageResponse.data(data, init),
		});
	const response = await compiledPage.build(buildContext);
	assert.deepEqual(
		response?.data,
		{},
		"default build should return a data response with an empty object",
	);
	assert.deepEqual(
		response.dataHash,
		JSON.stringify(jsonValue.hashableJsonValue({})),
		"default build should return a data response with an empty object",
	);
	assert.deepEqual(
		response.headers,
		new Headers(),
		"default build should return a response without headers",
	);
	assert.deepEqual(response.status, 200, "default build should return a 200 response");
	assert.deepEqual(response.type, "data", "default build should return a data response");

	const renderContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({});
	compiledPage.render(renderContext);
	assert.strictEqual(spyRender.mock.calls.length, 1);
	assert.deepEqual(spyRender.mock.calls[0].arguments, [renderContext]);

	assert.deepEqual(
		compiledPage.compile({ id: "1" }),
		"/foo/1",
		"Page should compile route with given parameters",
	);
	assert.throws(() => {
		compiledPage.compile(/** @type {any} */ ({ foo: "1" }));
	}, "Page should throw when compiling with invalid parameters");

	assert.deepEqual(
		compiledPage.match("/bar"),
		false,
		"Page should match a path against its own route",
	);

	assert.deepEqual(
		JSON.stringify(/** @type {any} */ (compiledPage.match("/foo/3")).params),
		JSON.stringify({ id: "3" }),
		"Page should match a path against its own route",
	);
});

test("unit/frugal/page/Page.js: complete DynamicPage", () => {
	const spyRender = mock.fn(() => "foo");
	const spyGenerate = mock.fn((context) => context.empty({}));
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").DynamicPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			type: "dynamic",
			route: "/foo/:id",
			render: spyRender,
			generate: spyGenerate,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "dynamic", "Page should be a dynamic page");
	assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its own moduleHash");
	assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its own entrypoint");
	assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its own route");

	const generateContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").GenerateContext<"/foo/:id">} */ ({
			empty: (init) => PageResponse.empty(init),
		});
	compiledPage.generate(generateContext);
	assert.strictEqual(spyGenerate.mock.calls.length, 1);
	assert.deepEqual(spyGenerate.mock.calls[0].arguments, [generateContext]);

	const renderContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({});
	compiledPage.render(renderContext);
	assert.strictEqual(spyRender.mock.calls.length, 1);
	assert.deepEqual(spyRender.mock.calls[0].arguments, [renderContext]);

	assert.deepEqual(
		compiledPage.compile({ id: "1" }),
		"/foo/1",
		"Page should compile route with given parameters",
	);
	assert.throws(
		() => {
			compiledPage.compile(/** @type {any} */ ({ foo: "1" }));
		},
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while compiling route "/foo/:id" for params "{"foo":"1"}"',
			);
			return true;
		},
		"Page should throw when compiling with invalid parameters",
	);

	assert.deepEqual(
		compiledPage.match("/bar"),
		false,
		"Page should match a path against its own route",
	);

	assert.deepEqual(
		JSON.stringify(/** @type {any} */ (compiledPage.match("/foo/3")).params),
		JSON.stringify({ id: "3" }),
		"Page should match a path against its own route",
	);
});

test("unit/frugal/page/Page.js: DynamicPage with descriptor that throws", async () => {
	const renderError = new Error("render");
	const generateError = new Error("generate");
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").DynamicPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			type: "dynamic",
			route: "/foo/:id",
			render: () => {
				throw renderError;
			},
			generate: () => {
				throw generateError;
			},
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "dynamic", "Page should be a dynamic page");

	const generateContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").GenerateContext<"/foo/:id">} */ ({
			params: { id: "3" },
		});
	await assert.rejects(
		() => compiledPage.generate(generateContext),
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while generating route "/foo/:id" for params "{"id":"3"}"',
			);
			assert.strictEqual(error.cause, generateError);
			return true;
		},
		"toto",
	);

	const renderContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({
			params: { id: "3" },
		});
	assert.throws(
		() => compiledPage.render(renderContext),
		/**
		 * @param {any} error
		 */
		(error) => {
			assert.ok(error instanceof PageError);
			assert.strictEqual(
				error.message,
				'Error while rendering route "/foo/:id" for params "{"id":"3"}"',
			);
			assert.strictEqual(error.cause, renderError);
			return true;
		},
		"toto",
	);
});

test("unit/frugal/page/Page.js: DynamicPage with generate that returns nothing", async () => {
	const descriptor =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").DynamicPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			type: "dynamic",
			route: "/foo/:id",
			render: () => "foo",
			generate: () => {
				return undefined;
			},
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.create({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "dynamic", "Page should be a dynamic page");

	const generateContext =
		/** @type {import("../../../packages/frugal/src/page/PageDescriptor.js").GenerateContext<"/foo/:id">} */ ({
			params: { id: "3" },
		});

	assert.deepStrictEqual(
		await compiledPage.generate(generateContext),
		undefined,
		"should return undefined",
	);
});
