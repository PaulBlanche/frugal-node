/** @import * as pageDescriptor from "../../../src/page/PageDescriptor.js" */
/** @import * as pageData from "../../../src/utils/serverData.js" */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { Page, PageError } from "../../../src/page/Page.js";
import { PageResponse } from "../../../src/page/PageResponse.js";

{
	const spyRender = mock.fn(() => "foo");
	const spyBuild = mock.fn(() => PageResponse.empty({}));
	const spyGenerate = mock.fn(() => PageResponse.empty({}));
	const spyGetBuildPaths = mock.fn(() => [{ id: "1" }]);

	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", pageData.ServerData>} */ ({
			route: "/foo/:id",
			render: spyRender,
			strictPaths: false,
			getBuildPaths: spyGetBuildPaths,
			build: spyBuild,
			generate: spyGenerate,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";

	const compiledPage = Page.static({
		entrypoint,
		moduleHash,
		descriptor: descriptor,
	});

	test("unit/Page: StaticPage properties", () => {
		assert.equal(compiledPage.moduleHash, moduleHash);
		assert.equal(compiledPage.entrypoint, entrypoint);
		assert.equal(compiledPage.route, descriptor.route);
		assert.equal(compiledPage.strictPaths, descriptor.strictPaths);
	});

	test("unit/Page: calling StaticPage.getBuildPaths calls the method of the descriptor", () => {
		compiledPage.getBuildPaths();
		assert.strictEqual(spyGetBuildPaths.mock.calls.length, 1);
	});

	test("unit/Page: calling StaticPage.build calls the method of the descriptor", () => {
		const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({});
		compiledPage.build(buildContext);
		assert.strictEqual(spyBuild.mock.calls.length, 1);
		assert.deepEqual(spyBuild.mock.calls[0].arguments, [buildContext]);
	});

	test("unit/Page: calling StaticPage.generate calls the method of the descriptor", () => {
		const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({});
		compiledPage.generate(generateContext);
		assert.strictEqual(spyGenerate.mock.calls.length, 1);
		assert.deepEqual(spyGenerate.mock.calls[0].arguments, [generateContext]);
	});

	test("unit/Page: calling StaticPage.render calls the method of the descriptor", () => {
		const renderContext =
			/** @type {pageDescriptor.RenderContext<"/foo/:id", pageData.ServerData>} */ ({});
		compiledPage.render(renderContext);
		assert.strictEqual(spyRender.mock.calls.length, 1);
		assert.deepEqual(spyRender.mock.calls[0].arguments, [renderContext]);
	});

	test("unit/Page: StaticPage can compile path params", () => {
		assert.deepEqual(compiledPage.compile({ id: "1" }), "/foo/1");
		assert.throws(
			() => {
				compiledPage.compile(/** @type {any} */ ({ foo: "1" }));
			},
			(error) => {
				assert.ok(error instanceof PageError);
				assert.strictEqual(
					error.message,
					'Error while compiling route "/foo/:id" for params "{"foo":"1"}"',
				);
				return true;
			},
		);
	});

	test("unit/Page: StaticPage can match against paths", () => {
		assert.deepEqual(compiledPage.match("/bar"), false);

		assert.deepEqual(
			JSON.stringify(/** @type {any} */ (compiledPage.match("/foo/3")).params),
			JSON.stringify({ id: "3" }),
		);
	});
}

{
	const renderError = new Error("render");
	const getBuildPathsError = new Error("getBuildPaths");
	const buildError = new Error("build");
	const generateError = new Error("generate");
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", pageData.ServerData>} */ ({
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
			generate: () => {
				throw generateError;
			},
		});
	const entrypoint = "foo";
	const moduleHash = "bar";

	const compiledPage = Page.static({
		entrypoint,
		moduleHash,
		descriptor: descriptor,
	});

	test("unit/Page: StaticPage.getBuildPaths errors are wrapped in PageError", () => {
		assert.rejects(
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
		);
	});

	test("unit/Page: StaticPage.build errors are wrapped in PageError", async () => {
		const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({
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
		);
	});

	test("unit/Page: StaticPage.generate errors are wrapped in PageError", async () => {
		const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({
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
		);
	});

	test("unit/Page: StaticPage.render errors are wrapped in PageError", async () => {
		const renderContext =
			/** @type {pageDescriptor.RenderContext<"/foo/:id", pageData.ServerData>} */ ({
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
		);
	});
}

{
	const descriptor =
		/** @type {pageDescriptor.StaticPageDescriptor<"/foo/:id", pageData.ServerData>} */ ({
			route: "/foo/:id",
			render: () => "foo",
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.static({
		entrypoint,
		moduleHash,
		descriptor: descriptor,
	});

	test("unit/Page: StaticPage default properties", () => {
		assert.equal(compiledPage.moduleHash, moduleHash);
		assert.equal(compiledPage.entrypoint, entrypoint);
		assert.equal(compiledPage.route, descriptor.route);
		assert.equal(compiledPage.strictPaths, true);
	});

	test("unit/Page: StaticPage default getBuildPaths", async () => {
		assert.deepEqual(await compiledPage.getBuildPaths(), [{}]);
	});

	test("unit/Page: StaticPage default build", async () => {
		const buildContext = /** @type {pageDescriptor.BuildContext<"/foo/:id">} */ ({});
		const response = await compiledPage.build(buildContext);

		assert.deepEqual(response?.type, "data");
		assert.deepEqual(response.data, {});
		assert.deepEqual(response.dataHash, PageResponse.data({}).dataHash);
		assert.deepEqual(response.headers, new Headers());
		assert.deepEqual(response.status, 200);
	});

	test("unit/Page: StaticPage default generate", async () => {
		const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({});
		const response = await compiledPage.generate(generateContext);

		assert.deepEqual(response?.type, "data");
		assert.deepEqual(response.data, {});
		assert.deepEqual(response.dataHash, PageResponse.data({}).dataHash);
		assert.deepEqual(response.headers, new Headers());
		assert.deepEqual(response.status, 200);
	});
}

{
	const spyRender = mock.fn(() => "foo");
	const spyGenerate = mock.fn(() => PageResponse.empty({}));

	const descriptor =
		/** @type {pageDescriptor.DynamicPageDescriptor<"/foo/:id", pageData.ServerData>} */ ({
			type: "dynamic",
			route: "/foo/:id",
			render: spyRender,
			generate: spyGenerate,
		});
	const entrypoint = "foo";
	const moduleHash = "bar";

	const compiledPage = Page.dynamic({ entrypoint, moduleHash, descriptor });

	test("unit/Page: DynamicPage properties", () => {
		assert.equal(compiledPage.moduleHash, moduleHash);
		assert.equal(compiledPage.entrypoint, entrypoint);
		assert.equal(compiledPage.route, descriptor.route);
	});

	test("unit/Page: calling DynamicPage.generate calls the method of the descriptor", () => {
		const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({});
		compiledPage.generate(generateContext);
		assert.strictEqual(spyGenerate.mock.calls.length, 1);
		assert.deepEqual(spyGenerate.mock.calls[0].arguments, [generateContext]);
	});

	test("unit/Page: calling DynamicPage.render calls the method of the descriptor", () => {
		const renderContext =
			/** @type {pageDescriptor.RenderContext<"/foo/:id", pageData.ServerData>} */ ({});
		compiledPage.render(renderContext);
		assert.strictEqual(spyRender.mock.calls.length, 1);
		assert.deepEqual(spyRender.mock.calls[0].arguments, [renderContext]);
	});

	test("unit/Page: DynamicPage can compile path params", () => {
		assert.deepEqual(compiledPage.compile({ id: "1" }), "/foo/1");
		assert.throws(
			() => {
				compiledPage.compile(/** @type {any} */ ({ foo: "1" }));
			},
			(error) => {
				assert.ok(error instanceof PageError);
				assert.strictEqual(
					error.message,
					'Error while compiling route "/foo/:id" for params "{"foo":"1"}"',
				);
				return true;
			},
		);
	});

	test("unit/Page: DynamicPage can match against paths", () => {
		assert.deepEqual(compiledPage.match("/bar"), false);

		assert.deepEqual(
			JSON.stringify(/** @type {any} */ (compiledPage.match("/foo/3")).params),
			JSON.stringify({ id: "3" }),
		);
	});
}

{
	const renderError = new Error("render");
	const generateError = new Error("generate");
	const descriptor =
		/** @type {pageDescriptor.DynamicPageDescriptor<"/foo/:id", pageData.ServerData>} */ ({
			route: "/foo/:id",
			type: "dynamic",
			render: () => {
				throw renderError;
			},
			generate: () => {
				throw generateError;
			},
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.dynamic({ entrypoint, moduleHash, descriptor });

	test("unit/Page: DynamicPage.generate errors are wrapped in PageError", async () => {
		const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({
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
		);
	});

	test("unit/Page: DynamicPage.render errors are wrapped in PageError", async () => {
		const renderContext =
			/** @type {pageDescriptor.RenderContext<"/foo/:id", pageData.ServerData>} */ ({
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
}

{
	const descriptor =
		/** @type {pageDescriptor.DynamicPageDescriptor<"/foo/:id", pageData.ServerData>} */ ({
			route: "/foo/:id",
			type: "dynamic",
			render: () => "foo",
		});
	const entrypoint = "foo";
	const moduleHash = "bar";
	const compiledPage = Page.dynamic({ entrypoint, moduleHash, descriptor });

	test("unit/Page: DynamicPage default properties", () => {
		assert.equal(compiledPage.moduleHash, moduleHash);
		assert.equal(compiledPage.entrypoint, entrypoint);
		assert.equal(compiledPage.route, descriptor.route);
	});

	test("unit/Page: DynamicPage default generate", async () => {
		const generateContext = /** @type {pageDescriptor.GenerateContext<"/foo/:id">} */ ({});
		const response = await compiledPage.generate(generateContext);

		assert.deepEqual(response?.type, "data");
		assert.deepEqual(response.data, {});
		assert.deepEqual(response.dataHash, PageResponse.data({}).dataHash);
		assert.deepEqual(response.headers, new Headers());
		assert.deepEqual(response.status, 200);
	});
}
