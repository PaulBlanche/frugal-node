import type { App } from "./Hydratable.js";

export type GetApp<PROPS> = () => Promise<App<PROPS>> | App<PROPS>;

export function hydrate<PROPS>(name: string, getApp: GetApp<PROPS>): void;
