/** @import * as self from "./PageDescriptor.js" */
/** @import { ServerData } from "../utils/serverData.js" */
import * as zod from "zod";

// Lots of @__PURE__ annotations are needed because zod function are not
// declared as side-effect free, so esbuild bundle all of them without
// tree-shaking. Each time a builder from zod is called, the annotation must be
// added.

const baseDescriptorSchema = /* @__PURE__ */ zod.object(
	{
		route: /* @__PURE__ */ zod
			.string({
				required_error: 'A page descriptor must habe a string "route"',
				invalid_type_error: 'A page descriptor "route" must be a string',
			})
			.startsWith("/", 'A "route" must start with a "/"'),
		render: /* @__PURE__ */ zod.function(
			/* @__PURE__ */ zod.tuple([/* @__PURE__ */ zod.any()]),
			/* @__PURE__ */ zod.any(),
			{
				required_error: 'A page descriptor must have a "render" function',
				invalid_type_error: 'A page descriptor "render" must be a function',
			},
		),
		generate: /* @__PURE__ */ zod.optional(
			/* @__PURE__ */ zod.function(
				/* @__PURE__ */ zod.tuple([/* @__PURE__ */ zod.any()]),
				/* @__PURE__ */ zod.any(),
				{
					invalid_type_error: 'A dynamic page descriptor "generate" must be a function',
				},
			),
		),
	},
	{
		invalid_type_error: "A page descriptor must be an object",
	},
);

/** @type {zod.Schema<self.DynamicPageDescriptor>} */
const dynamicDescriptorSchema = /* @__PURE__ */ baseDescriptorSchema.extend({
	type: /* @__PURE__ */ zod.literal("dynamic", {
		required_error: 'A dynamic page descriptor must have a "type"',
		invalid_type_error: 'A dynamic page descriptor "type" must be "dynamic"',
	}),
});

/** @type {zod.Schema<self.StaticPageDescriptor>} */
const staticDescriptorSchema = /* @__PURE__ */ baseDescriptorSchema.extend({
	type: /* @__PURE__ */ zod.optional(
		/* @__PURE__ */ zod.literal("static", {
			invalid_type_error: 'A dynamic page descriptor "type" must be "dynamic"',
		}),
	),
	strictPaths: /* @__PURE__ */ zod.optional(
		/* @__PURE__ */ zod.boolean({
			invalid_type_error: 'A static page "strictPaths" must be a boolean',
		}),
	),
	getBuildPaths: /* @__PURE__ */ zod.optional(
		/* @__PURE__ */ zod.function(/* @__PURE__ */ zod.tuple([]), /* @__PURE__ */ zod.any(), {
			invalid_type_error: 'A static page descriptor "getBuildPaths" must be a function',
		}),
	),
	build: /* @__PURE__ */ zod.optional(
		/* @__PURE__ */ zod.function(
			/* @__PURE__ */ zod.tuple([/* @__PURE__ */ zod.any()]),
			/* @__PURE__ */ zod.any(),
			{
				invalid_type_error: 'A static page descriptor "build" must be a function',
			},
		),
	),
});

/** @type {zod.Schema<self.PathParamsList<string>>} */
const pathParamListSchema = /* @__PURE__ */ zod.array(
	/* @__PURE__ */ zod.record(
		/* @__PURE__ */ zod.string(),
		/* @__PURE__ */ zod.union([
			/* @__PURE__ */ zod.string(),
			/* @__PURE__ */ zod.array(/* @__PURE__ */ zod.string()),
		]),
	),
);

/** @type {self.assertPathParamList} */
export function assertPathParamList(paths) {
	try {
		pathParamListSchema.parse(paths);
	} catch (error) {
		if (error instanceof zod.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

/** @type {self.assertStaticDescriptor} */
export function assertStaticDescriptor(descriptor) {
	try {
		staticDescriptorSchema.parse(descriptor);
	} catch (error) {
		if (error instanceof zod.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

/** @type {self.assertDynamicDescriptor} */
export function assertDynamicDescriptor(descriptor) {
	try {
		dynamicDescriptorSchema.parse(descriptor);
	} catch (error) {
		if (error instanceof zod.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}
