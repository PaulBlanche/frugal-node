import type { Hash } from "./Hash.js";

export type ServerData =
	| string
	| number
	| bigint
	| boolean
	| null
	| undefined
	| Date
	| Map<ServerData, ServerData>
	| Set<ServerData>
	| URL
	| { [x: string | number]: ServerData }
	| ServerData[];

export type _Type =
	| { type: "string"; value: string }
	| { type: "number"; value: number }
	| { type: "bigint"; value: bigint }
	| { type: "boolean"; value: boolean }
	| { type: "null"; value: null }
	| { type: "undefined"; value: undefined }
	| { type: "date"; value: Date }
	| { type: "map"; value: Map<ServerData, ServerData> }
	| { type: "set"; value: Set<ServerData> }
	| { type: "url"; value: URL }
	| { type: "record"; value: { [x: string | number]: ServerData } }
	| { type: "array"; value: ServerData[] }
	| { type: "reference"; value: number };

export type _Context = { visited: unknown[]; hasher: Hash };

export function _initGlobalState(uid: string): void;

export function hash(serverData: ServerData): string;

export function serialize(serverData: ServerData): string;
