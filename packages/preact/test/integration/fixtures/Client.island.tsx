import { Island, type IslandProps } from "@frugal-node/preact/client";
import * as preact from "preact";
import { NAME } from "./Client.script.ts";
import { Client as Component, type ClientProps as ComponentProps } from "./Client.tsx";

export function Client(props: ComponentProps) {
	return <Island name={NAME} Component={Component} props={props} />;
}
