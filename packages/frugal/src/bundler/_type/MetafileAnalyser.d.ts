export type Analysis =
	| {
			type: "page";
			entrypoint: string;
			output: string;
			moduleHash: string;
	  }
	| {
			type: "config";
			moduleHash: string;
	  }
	| {
			type: "css";
			moduleHash: string;
	  };
