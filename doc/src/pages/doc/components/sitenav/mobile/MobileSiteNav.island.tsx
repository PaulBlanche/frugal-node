import { Island } from "@frugal-node/preact/client";
import { NAME } from "./MobileSiteNav.script.ts";
import { MobileSiteNav as Component, type MobileSiteNavProps } from "./MobileSiteNav.tsx";

export function MobileSiteNav(props: MobileSiteNavProps) {
	return <Island name={NAME} Component={Component} props={props} />;
}
