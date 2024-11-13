import type * as preact from "preact";

// biome-ignore lint/suspicious/noExplicitAny: return type of a component
export type GetComponent = () => Promise<preact.ComponentType<any>> | preact.ComponentType<any>;

export function hydrate(name: string, getComponent: GetComponent): void;
