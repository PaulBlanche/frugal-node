export type GetComponent = () => Promise<preact.ComponentType<any>> | preact.ComponentType<any>;

export function hydrate(name: string, getComponent: GetComponent): void;
