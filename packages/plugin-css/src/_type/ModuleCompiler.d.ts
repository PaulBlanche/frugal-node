export type ClassName =
	| { type: "dependency"; import typeIdentifier: string; name: string }
	| { type: "local"; name: string; names: ClassName[] }
	| {
			type: "global";
			name: string;
	  };
