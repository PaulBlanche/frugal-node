import * as frugal from "../../../../packages/frugal/exports/index.js";

/** @type {frugal.Config} */
export const config = {
	self: import.meta.url,
	pages: ["./dynamicPage.ts", "./staticPage.ts", "./staticPageJIT.ts"],
	log: { level: "silent" },
	server: {
		cryptoKey: await frugal.importKey(
			"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
		),
		session: {
			storage: new frugal.MemorySessionStorage(),
		},
	},
};
