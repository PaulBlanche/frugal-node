const REGISTERED = new WeakSet();

if (import.meta.environment === "client") {
	if (document.readyState === "complete") {
		setup();
	} else {
		document.addEventListener("readystatechange", () => {
			if (document.readyState === "complete") {
				setup();
			}
		});
	}

	window.FRUGAL_SESSION_INSTANCE?.addEventListener("mount", () => {
		setup();
	});
}

function setup() {
	console.log("setup");
	const editors = document.querySelectorAll<HTMLElement>("[data-code]");

	for (const editor of editors) {
		console.log("coucou");
		if (!REGISTERED.has(editor)) {
			const togglees = editor.querySelectorAll<HTMLElement>("[data-id]");
			const toggles = editor.querySelectorAll<HTMLElement>("[data-toggle-id");

			for (const toggle of toggles) {
				const togglee = editor.querySelector<HTMLElement>(
					`[data-id="${toggle.dataset.toggleId}"]`,
				);
				if (togglee) {
					const toggleCode = () => {
						for (const toggle of toggles) {
							toggle.setAttribute("data-active", "false");
						}
						for (const togglee of togglees) {
							togglee.setAttribute("data-active", "false");
							togglee.setAttribute("aria-hidden", "true");
						}
						toggle.setAttribute("data-active", "true");
						togglee.setAttribute("data-active", "true");
						togglee.removeAttribute("aria-hidden");
					};

					toggle.addEventListener("click", toggleCode);
					toggle.addEventListener("touch", toggleCode);
				}
			}

			const copy = editor.querySelector("[data-copy]");
			if (copy) {
				copy.addEventListener("click", async () => {
					let code: string | undefined;
					for (const togglee of togglees) {
						if (togglee.matches("[data-active]")) {
							code = togglee.querySelector("pre")?.textContent ?? undefined;
						}
					}

					if (code === undefined) {
						return;
					}

					try {
						await navigator.clipboard.writeText(code);
						copy.toggleAttribute("data-success", true);
						setTimeout(() => {
							copy.toggleAttribute("data-success", false);
						}, 2 * 1000);
					} catch (error) {
						console.log(error);
					}
				});
			}

			REGISTERED.add(editor);
		}
	}
}
