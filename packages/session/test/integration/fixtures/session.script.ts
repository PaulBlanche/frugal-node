import { Session } from "../../../exports/index.js";

if (import.meta.environment === "client") {
	Session.init({
		navigation: {
			enableViewTransition: false,
		},
	});
	Session.observe();

	addEventListener("frugal:navigation", (event) => {
		console.log("frugal:navigation", JSON.stringify(event.detail));
	});

	Session.addEventListener("mount", () => {
		console.log("mount");
		dispatchEvent(new CustomEvent("mount"));
	});
	Session.addEventListener("unmount", () => {
		console.log("unmount");
		dispatchEvent(new CustomEvent("unmount"));
	});

	(window as any).exposed_session_navigate = Session.navigate;
}
