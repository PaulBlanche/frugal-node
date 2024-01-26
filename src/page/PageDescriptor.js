import * as zod from "zod";
import * as jsonValue from "../utils/jsonValue.js";
import * as _type from "./_type/PageDescriptor.js";

/** @typedef {_type.Phase} Phase */
/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.RenderContext<PATH, DATA>} RenderContext
 */
/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.Render<PATH, DATA>} Render
 */
/** @typedef {_type.GetBuildPathsContext} GetBuildPathsContext */
/**
 * @template {string} PATH
 * @typedef {_type.PathList<PATH>} PathList
 */
/**
 * @template {string} PATH
 * @typedef {_type.GetBuildPaths<PATH>} GetBuildPaths
 */
/**
 * @template {string} PATH
 * @typedef {_type.GenerateContext<PATH>} GenerateContext
 */
/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.Generate<PATH, DATA>} Generate
 */
/**
 * @template {string} PATH
 * @typedef {_type.BuildContext<PATH>} BuildContext
 */
/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.Build<PATH, DATA>} Build
 */
/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.DynamicPageDescriptor<PATH, DATA>} DynamicPageDescriptor
 */
/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.StaticPageDescriptor<PATH, DATA>} StaticPageDescriptor
 */
/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue]
 * @typedef {_type.PageDescriptor<PATH, DATA>} PageDescriptor
 */

const baseDescriptorSchema = zod.object(
	{
		route: zod
			.string({
				required_error: 'A page descriptor must habe a string "route"',
				invalid_type_error: 'A page descriptor "route" must be a string',
			})
			.startsWith("/", 'A "route" must start with a "/"'),
		render: zod.function(zod.tuple([zod.any()]), zod.any(), {
			required_error: 'A page descriptor must have a "render" function',
			invalid_type_error: 'A page descriptor "render" must be a function',
		}),
	},
	{
		invalid_type_error: "A page descriptor must be an object",
	},
);

/** @type {zod.Schema<_type.DynamicPageDescriptor>} */
export const dynamicDescriptorSchema = baseDescriptorSchema.extend({
	generate: zod.function(zod.tuple([zod.any()]), zod.any(), {
		required_error: 'A dynamic page descriptor must have a "render" function',
		invalid_type_error: 'A dynamic page descriptor "generate" must be a function',
	}),
});

/** @type {zod.Schema<_type.StaticPageDescriptor>} */
export const staticDescriptorSchema = baseDescriptorSchema.extend({
	strictPaths: zod.optional(
		zod.boolean({
			invalid_type_error: 'A static page "strictPaths" must be a boolean',
		}),
	),
	getBuildPaths: zod.optional(
		zod.function(zod.tuple([zod.any()]), zod.any(), {
			invalid_type_error: 'A static page descriptor "getBuildPaths" must be a function',
		}),
	),
	build: zod.optional(
		zod.function(zod.tuple([zod.any()]), zod.any(), {
			invalid_type_error: 'A static page descriptor "build" must be a function',
		}),
	),
});

/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} DATA
 * @param {_type.PageDescriptor<PATH, DATA>} descriptor
 * @returns {descriptor is _type.StaticPageDescriptor<PATH, DATA>}
 */
export function parseStaticDescriptor(descriptor) {
	try {
		staticDescriptorSchema.parse(descriptor);
		return true;
	} catch (error) {
		if (error instanceof zod.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

/**
 * @template {string} PATH
 * @template {jsonValue.JsonValue} DATA
 * @param {_type.DynamicPageDescriptor<PATH, DATA>} descriptor
 * @returns {descriptor is _type.DynamicPageDescriptor<PATH, DATA>}
 */
export function parseDynamicDescriptor(descriptor) {
	try {
		dynamicDescriptorSchema.parse(descriptor);
		return true;
	} catch (error) {
		if (error instanceof zod.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}
