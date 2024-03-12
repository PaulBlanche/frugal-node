import { NavigationConfig, PageResult } from "./Page.js";

export interface Navigator {
	navigate(event: MouseEvent | KeyboardEvent): Promise<PageResult>;
}

interface NavigatorMaker {
	create(anchor: HTMLAnchorElement, config: NavigationConfig): Navigator;
}

export const Navigator: NavigatorMaker;
