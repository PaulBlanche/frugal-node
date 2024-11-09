import { PageResponse } from "@frugal-node/core/page";
import { getRenderFrom } from "@frugal-node/preact";
import { App } from "./App.tsx";

export const route = "/page1";

export function build() {
	return PageResponse.data({ foo: "bar" });
}

export const render = getRenderFrom(App, { embedData: true });
