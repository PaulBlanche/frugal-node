/**
 * @param {string} entryId
 * @returns {void}
 */
export function saveScroll(entryId) {
	sessionStorage.setItem(`__frugal_history_${entryId}`, String(window.scrollY));
}

/**
 * @param {string} entryId
 * @returns {boolean}
 */
export function restoreScroll(entryId) {
	const scrollYString = sessionStorage.getItem(`__frugal_history_${entryId}`);
	if (scrollYString !== null) {
		const scrollY = Number(scrollYString);
		if (!Number.isNaN(scrollY)) {
			window.scroll(0, scrollY);
			return true;
		}
	}
	return false;
}
