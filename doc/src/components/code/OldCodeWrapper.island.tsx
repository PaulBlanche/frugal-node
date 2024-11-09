import { Island } from "@frugal-node/preact/client";
import { NAME } from "./CodeWrapper.script.ts";
import { type CodeWrapperProps, CodeWrapper as Component } from "./CodeWrapper.tsx";

export function CodeWrapper(props: CodeWrapperProps & { id?: string }) {
	return <Island name={NAME} Component={Component} props={props} id={props.id} />;
}
