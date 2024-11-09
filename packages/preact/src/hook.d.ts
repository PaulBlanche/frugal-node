export let HOOK: {
	HOOK: "__h";
	DIFF: "__b";
	DIFFED: "diffed";
	RENDER: "__r";
	VNODE: "vnode";
	UNMOUNT: "unmount";
	CATCH_ERROR: "__e";
};

interface Hooks {
	[HOOK.HOOK](component: preact.Component, index: number, type: number): void;
	[HOOK.DIFF](vnode: preact.VNode): void;
	[HOOK.DIFFED](vnode: preact.VNode): void;
	[HOOK.RENDER](vnode: preact.VNode): void;
	[HOOK.VNODE](vnode: preact.VNode): void;
	[HOOK.UNMOUNT](vnode: preact.VNode): void;
	[HOOK.CATCH_ERROR]: (error: unknown, vnode: preact.VNode, oldVNode: preact.VNode) => void;
}

type Hook<Hook extends Hooks[keyof Hooks]> = (
	old: Hook,
	...params: Parameters<Hook>
) => ReturnType<Hook>;

export function hook<T extends keyof Hooks>(name: T, hook: Hook<Hooks[T]>): void;
