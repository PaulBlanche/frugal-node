/**
 *
 * @param {string} document
 * @param {string} appended
 * @returns {string}
 */
export function appendToBody(document, appended) {
	// try to put script at the end of `<body>`
	if (document.indexOf("</body>") !== -1) {
		return document.replace("</body>", `${appended}</body>`);
	}

	// try to put script at the end of `<html>` if body is absent
	if (document.indexOf("</html>") !== -1) {
		return document.replace("</html>", `${appended}</html>`);
	}

	// put script at the end of document if no `<body>` or `<html>
	return `${document}${appended}`;
}
