import * as assert from "node:assert/strict";
import { mock, test } from "node:test";

import * as page from "../../../src/page/Page.js";
import * as pageDescriptor from "../../../src/page/PageDescriptor.js";
import * as response from "../../../src/page/Response.js";
import * as jsonValue from "../../../src/utils/jsonValue.js";

test("page/Page.js: compile errors", () => {
	assert.throws(
		() =>
			page.compile({
				entrypoint: "foo",
				moduleHash: "bar",
				pageDescriptor: /** @type {any} */ ({}),
			}),
		"empty descriptor should not compile",
	);

	assert.throws(
		() =>
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
			page.compile({
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
});

test("page/Page.js: compile type", () => {
	assert.ok(
		page.compile({
			entrypoint: "foo",
			moduleHash: "bar",
			pageDescriptor: {
				route: "/foo",
				render: () => "foo",
			},
		}) instanceof page.StaticPage,
		"descriptor should be compiled as StaticPage by default",
	);
	assert.ok(
		page.compile({
			entrypoint: "foo",
			moduleHash: "bar",
			pageDescriptor: /** @type {any} */ ({
				route: "/foo",
				render: () => "foo",
				generate: () => {},
			}),
		}) instanceof page.DynamicPage,
		"descriptor with a generate function should be compiled as DynamicPage",
	);
});

test("page/Page.js: complete StaticPage", () => {
	const spyRender = mock.fn(() => "foo");
	const spyBuild = mock.fn(() => new response.EmptyResponse({}));
	const spyGetBuildPaths = mock.fn(() => [{ id: "1" }]);
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			route: "/foo/:id",
			render: spyRender,
			strictPaths: false,
			getBuildPaths: spyGetBuildPaths,
			build: spyBuild,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");
	assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its own moduleHash");
	assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its own entrypoint");
	assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its own route");
	assert.deepEqual(
		compiledPage.strictPaths,
		descriptor.strictPaths,
		"Page should hold its own route",
	);

	const getBuildPathsContext = /** @type {pageDescriptor.GetBuildPathsContext} */ ({});
	compiledPage.getBuildPaths(getBuildPathsContext);
	assert.strictEqual(spyGetBuildPaths.mock.calls.length, 1);
	assert.deepEqual(spyGetBuildPaths.mock.calls[0].arguments, [getBuildPathsContext]);

	const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({});
	compiledPage.build(buildContext);
	assert.strictEqual(spyBuild.mock.calls.length, 1);
	assert.deepEqual(spyBuild.mock.calls[0].arguments, [buildContext]);

	const renderContext =
		/** @type {pageDescriptor.RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({});
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
		(error) => {
			assert.ok(error instanceof page.PageError);
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

test("page/Page.js: StaticPage with descriptor that throws", async () => {
	const renderError = new Error("render");
	const getBuildPathsError = new Error("getBuildPaths");
	const buildError = new Error("build");
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ (
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
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");

	const getBuildPathsContext = /** @type {pageDescriptor.GetBuildPathsContext} */ ({});
	assert.throws(
		() => compiledPage.getBuildPaths(getBuildPathsContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
			assert.strictEqual(
				error.message,
				'Error while building path list for route "/foo/:id"',
			);
			assert.strictEqual(error.cause, getBuildPathsError);
			return true;
		},
		"getBuildPaths should throw an error wrapping the underlying error",
	);

	const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({
		params: { id: "3" },
	});
	await assert.rejects(
		() => compiledPage.build(buildContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
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
		/** @type {pageDescriptor.RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({
			params: { id: "3" },
		});
	assert.throws(
		() => compiledPage.render(renderContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
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

test("page/Page.js: StaticPage with build that returns nothing", async () => {
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ (
			/** @type {unknown} */ ({
				route: "/foo/:id",
				render: () => "foo",
				build: () => {
					return undefined;
				},
			})
		);
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");

	const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({
		params: { id: "3" },
	});
	await assert.rejects(
		() => compiledPage.build(buildContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
			assert.strictEqual(
				error.message,
				'No response returned while building route "/foo/:id" for params "{"id":"3"}"',
			);
			return true;
		},
		"build should throw an error wrapping the underlying error",
	);
});

test("page/Page.js: minimal StaticPage", async () => {
	const spyRender = mock.fn(() => "foo");
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			route: "/foo/:id",
			render: spyRender,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "static", "Page should be a static page");
	assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its own moduleHash");
	assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its own entrypoint");
	assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its own route");
	assert.deepEqual(compiledPage.strictPaths, true, "Page should default to true");

	const getBuildPathsContext = /** @type {pageDescriptor.GetBuildPathsContext} */ ({});
	assert.deepEqual(
		compiledPage.getBuildPaths(getBuildPathsContext),
		[{}],
		"defaul getBuildPaths should default to returning an array of one empty object",
	);

	const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({});
	const response = await compiledPage.build(buildContext);
	assert.deepEqual(
		response.data,
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
		/** @type {pageDescriptor.RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({});
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

test("page/Page.js: complete DynamicPage", () => {
	const spyRender = mock.fn(() => "foo");
	const spyGenerate = mock.fn(() => new response.EmptyResponse({}));
	const descriptor =
		/** @type {pageDescriptor.DynamicPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ ({
			route: "/foo/:id",
			render: spyRender,
			generate: spyGenerate,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "dynamic", "Page should be a dynamic page");
	assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its own moduleHash");
	assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its own entrypoint");
	assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its own route");

	const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({});
	compiledPage.generate(generateContext);
	assert.strictEqual(spyGenerate.mock.calls.length, 1);
	assert.deepEqual(spyGenerate.mock.calls[0].arguments, [generateContext]);

	const renderContext =
		/** @type {pageDescriptor.RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({});
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
		(error) => {
			assert.ok(error instanceof page.PageError);
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

test("page/Page.js: DynamicPage with descriptor that throws", async () => {
	const renderError = new Error("render");
	const generateError = new Error("generate");
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ (
			/** @type {unknown} */ ({
				route: "/foo/:id",
				render: () => {
					throw renderError;
				},
				generate: () => {
					throw generateError;
				},
			})
		);
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "dynamic", "Page should be a dynamic page");

	const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({
		params: { id: "3" },
	});
	await assert.rejects(
		() => compiledPage.generate(generateContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
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
		/** @type {pageDescriptor.RenderContext<"/foo/:id", jsonValue.JsonValue>} */ ({
			params: { id: "3" },
		});
	assert.throws(
		() => compiledPage.render(renderContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
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

test("page/Page.js: DynamicPage with generate that returns nothing", async () => {
	const descriptor =
		/** @type {pageDescriptor.DynamicPageDescriptor<"/foo/:id", jsonValue.JsonValue>} */ (
			/** @type {unknown} */ ({
				route: "/foo/:id",
				render: () => "foo",
				generate: () => {
					return undefined;
				},
			})
		);
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor });

	assert.deepEqual(compiledPage.type, "dynamic", "Page should be a dynamic page");

	const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({
		params: { id: "3" },
	});
	await assert.rejects(
		() => compiledPage.generate(generateContext),
		(error) => {
			assert.ok(error instanceof page.PageError);
			assert.strictEqual(
				error.message,
				'No response returned while generating route "/foo/:id" for params "{"id":"3"}"',
			);
			return true;
		},
		"build should throw an error wrapping the underlying error",
	);
});
