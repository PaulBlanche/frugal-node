import * as preact from "preact";
import * as hooks from "preact/hooks";
import { Effect } from "./Effect.js";

const headManagerContext = /** @type {preact.Context<import("./Effect.ts").Manager|undefined>} */ (
	preact.createContext(undefined)
);

/** @type {import('./Head.ts').HeadProvider} */
export function HeadProvider(props) {
	return preact.h(
		headManagerContext.Provider,
		{
			value: {
				update: (state) => {
					props.onHeadUpdate(state);
					if (typeof document !== "undefined") {
						updateClient(state);
					}
				},
				instanceStack: new Set(),
			},
		},
		props.children,
	);
}

/**
 * @param {preact.VNode[]} state
 */
function updateClient(state) {
	const htmls = state.filter((node) => node.type === "html");
	const bodys = state.filter((node) => node.type === "body");
	const head = state.filter((node) => node.type !== "html" && node.type !== "body");

	const htmlProps = {};
	for (const html of htmls) {
		Object.assign(htmlProps, html.props);
	}

	for (const [key, value] of Object.entries(htmlProps)) {
		document.querySelector("html")?.setAttribute(key, String(value));
	}

	const bodyProps = {};
	for (const body of bodys) {
		Object.assign(bodyProps, body.props);
	}

	for (const [key, value] of Object.entries(htmlProps)) {
		document.querySelector("body")?.setAttribute(key, String(value));
	}

	preact.render(head, document.head);
}

/** @type {import('./Head.ts').Head} */
export function Head({ children }) {
	const manager = hooks.useContext(headManagerContext);

	if (manager === undefined) {
		throw Error("no head manager found");
	}

	return preact.h(
		Effect,
		{
			reduceComponentsToState: reduceComponents,
			manager,
		},
		children,
	);
}

/**
 *
 * @param {Effect[]} effects
 * @returns {preact.VNode[]}
 */
function reduceComponents(effects) {
	return (
		effects
			.reduce(
				/** @param {preact.ComponentChild[]} allChilren */ (allChilren, effect) => {
					const effectChildren = Array.isArray(effect.props.children)
						? effect.props.children.flat(10)
						: effect.props.children;
					return allChilren.concat(effectChildren);
				},
				[],
			)
			.reduce(
				/** @param {preact.VNode[]} list */ (list, node) => {
					if (preact.isValidElement(node)) {
						return list.concat(node);
					}
					return list;
				},
				[],
			)
			.reverse()
			.filter(unique())
			.reverse()
			// keep charset at the top to have it in the first 1024 bytes of the document
			// (see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#charset)
			.sort((a, b) => {
				if (a.type === "meta" && "charSet" in a.props) {
					return -1;
				}
				if (b.type === "meta" && "charSet" in b.props) {
					return 1;
				}
				return 0;
			})
			.map((node, i) => {
				const key = node.key ?? i + 1;
				return preact.cloneElement(node, { key });
			})
	);
}

const METATYPES = ["name", "httpEquiv", "charSet", "itemProp"];

function unique() {
	const tags = new Set();
	const metaTypes = new Set();
	/** @type {{ [metatype: string]: Set<string> }} */
	const metaCategories = {};

	/** @param {preact.VNode<any>} node */
	return (node) => {
		switch (node.type) {
			case "title":
			case "base":
				if (tags.has(node.type)) {
					return false;
				}

				tags.add(node.type);
				break;
			case "meta":
				for (let i = 0, len = METATYPES.length; i < len; i++) {
					const metatype = METATYPES[i];
					if (!Object.prototype.hasOwnProperty.call(node.props, metatype)) {
						continue;
					}

					if (metatype === "charSet") {
						if (metaTypes.has(metatype)) {
							return false;
						}
						metaTypes.add(metatype);
					} else {
						const category = node.props[metatype];
						const categories = metaCategories[metatype] ?? new Set();

						if (metatype !== "name" && categories.has(category)) {
							return false;
						}

						categories.add(category);
						metaCategories[metatype] = categories;
					}
				}
				break;
		}

		return true;
	};
}
