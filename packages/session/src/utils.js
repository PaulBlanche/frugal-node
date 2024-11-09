/**
 * @param {URL|string} url
 * @returns {boolean}
 */
export function isInternalUrl(url) {
	const rootURL = new URL("/", document.baseURI);
	return new URL(url).href.startsWith(rootURL.href);
}

/**
 * @param {URL | string} a
 * @param {URL | string} b
 * @returns {boolean}
 */
export function isUrlForSameDocument(a, b) {
	const na = new URL(a);
	na.hash = "";
	const nb = new URL(b);
	nb.hash = "";
	return na.href === nb.href;
}

/**
 * @param {URL | string} a
 * @param {URL | string} b
 * @returns {boolean}
 */
export function isSameUrl(a, b) {
	const na = new URL(a);
	const nb = new URL(b);
	return na.href === nb.href;
}
/**
 *
 * @param {EventTarget} target
 * @returns {HTMLAnchorElement | undefined}
 */
export function getClosestParentNavigableAnchor(target) {
	if (target instanceof Element) {
		/** @type {HTMLAnchorElement|null} */
		const anchor = target.closest("a[href]:not([target^=_]:not([download])");
		if (anchor !== null) {
			return anchor;
		}
	}
}

/**
 * @param {string} path
 * @returns {URL}
 */
export function getUrl(path) {
	return new URL(path, document.baseURI);
}

/**
 *
 * @param {boolean} defaultNavigate
 * @param {string|undefined|null} directive
 * @returns {boolean}
 */
export function shouldVisit(defaultNavigate, directive) {
	return defaultNavigate ? directive !== "false" : directive === "true";
}
