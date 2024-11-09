import type { NavigationConfig, PageResult } from "../page/Page.js";

export interface Navigator {
	navigate(event: MouseEvent | KeyboardEvent): Promise<PageResult>;
}

interface NavigatorCreator {
	create(anchor: HTMLAnchorElement, config: NavigationConfig): Navigator;
}

export let Navigator: NavigatorCreator;
