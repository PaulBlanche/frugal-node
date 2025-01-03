module.exports = {
	ci: {
		assert: {
			preset: "lighthouse:recommended",
			assertions: {
				"first-contentful-paint": [
					"error",
					{ maxNumericValue: 1500, aggregationMethod: "optimistic" },
				],
				"largest-contentful-paint": [
					"error",
					{ maxNumericValue: 2000, aggregationMethod: "optimistic" },
				],
				interactive: ["error", { maxNumericValue: 3000, aggregationMethod: "optimistic" }],
				"server-response-time": [
					"error",
					{ maxNumericValue: 500, aggregationMethod: "optimistic" },
				],
				"is-crawlable": ["off", {}],
			},
		},
		upload: {
			target: "temporary-public-storage",
		},
		collect: {
			url: [
				`${process.env["DEPLOYEMENT_URL"]}/`,
				`${process.env["DEPLOYEMENT_URL"]}/en/doc@1.0.0/getting-started/blog-posts`,
			],
		},
	},
};
