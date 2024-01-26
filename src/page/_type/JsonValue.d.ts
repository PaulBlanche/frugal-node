export type JsonValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| { [x: string]: JsonValue }
	| JsonValue[];

export type HashableJsonValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| [0, JsonValue[]]
	| [1, [string, JsonValue][]];
