export type NavigationConfig = {
	defaultNavigate: boolean;
	timeout: number;
};

export type NonSuccessPageResult =
	| { status: "aborted"; reason: string }
	| { status: "failure"; error: unknown };

export type PageResult = { status: "success" } | NonSuccessPageResult;

export interface Page {
	readonly url: string;
	render(init?: RequestInit): Promise<PageResult>;
}

interface PageCreator {
	create(url: string | URL, config: NavigationConfig): Page;
}

export let Page: PageCreator;

export let LOADING_CLASSNAME: string;
