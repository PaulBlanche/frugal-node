import { Island } from "@frugal-node/preact/client";
import { NAME } from "./DisplayCount.script.ts";
import { DisplayCount as Component } from "./DisplayCount.tsx";

export function DisplayCount() {
	return <Island name={NAME} Component={Component} />;
}
