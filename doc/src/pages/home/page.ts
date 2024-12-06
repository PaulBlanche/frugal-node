import { PageResponse } from "@frugal-node/core/page";
import { getRenderFrom } from "@frugal-node/preact";
import { Page } from "./Page.tsx";

export const route = "/";

export function build() {
	return PageResponse.data({ foo: "bar" }, { maxAge: 60 });
}

export const render = getRenderFrom(Page);
