import { Island } from "@frugal-node/preact/client";
import { NAME } from "./VersionSelector.script.ts";
import { VersionSelector as Component, type VersionSelectorProps } from "./VersionSelector.tsx";

export function VersionSelector(props: VersionSelectorProps) {
	return <Island name={NAME} Component={Component} props={props} />;
}
