import { diff } from "./diff.js";
import { patch } from "./patch.js";

/**
 * @param {Document} nextDocument
 */
export async function render(nextDocument) {
	/** @type {Promise<void>[]} */
	const assetPromises = [];

	// biome-ignore lint/complexity/noForEach: is ok
	nextDocument.querySelectorAll('link[rel="stylesheet"]').forEach((styleLink) => {
		if (!(styleLink instanceof HTMLLinkElement)) {
			return;
		}

		const styleRawHref = styleLink.getAttribute("href");
		const matchingStyleLink = document.querySelector(
			`link[rel="stylesheet"][href="${styleRawHref}"]`,
		);
		if (!matchingStyleLink) {
			const match = window.matchMedia(styleLink.media);
			if (match.matches) {
				const cloneLink = styleLink.cloneNode();
				document.head.appendChild(cloneLink);
				assetPromises.push(
					new Promise((res) => {
						cloneLink.addEventListener("load", () => {
							res();
						});
					}),
				);
			}
		}
	});

	const bodyPatch = diff(document.body, nextDocument.body);
	const headPatch = diff(document.head, nextDocument.head);

	console.dir(bodyPatch, { depth: null });

	await Promise.all(assetPromises);

	const clone = document.body.cloneNode(true);
	const bodyFragment = document.createDocumentFragment();
	bodyFragment.append(...clone.childNodes);
	patch(bodyPatch, bodyFragment);
	patch(headPatch, document.head);

	const updated = new Set();
	for (const attribute of nextDocument.body.attributes) {
		document.body.setAttribute(attribute.name, attribute.value);
		updated.add(attribute.name);
	}
	for (const attribute of document.body.attributes) {
		if (!updated.has(attribute.name)) {
			document.body.removeAttribute(attribute.name);
		}
	}
	document.body.replaceChildren(bodyFragment);

	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}
