export type PathParams<PATH extends string> = Collapse<
	Consume<{
		rest: PATH;
		object: Partial<Record<string, string | string[]>>;
		baseObject: true;
	}>["object"]
>;

type A = PathParams<`/:foo/:bar-:baz`>;

type ContextBase = {
	rest: string;
	object: PathParamsBase;
	baseObject?: true;
	escape?: true;
	optionnal?: true;
};

type Consume<CONTEXT extends ContextBase> = CONTEXT["rest"] extends `${infer CHAR}${infer REST}`
	? CONTEXT["escape"] extends true
		? Consume<{
				rest: REST;
				object: CONTEXT["object"];
				baseObject: CONTEXT["baseObject"];
			}>
		: CHAR extends ":"
			? ConsumeName<REST> extends {
					name: infer NAME extends string;
					rest: infer REST extends string;
				}
				? Consume<{
						rest: REST;
						// biome-ignore lint/complexity/noBannedTypes: ok
						object: (CONTEXT["baseObject"] extends true ? {} : CONTEXT["object"]) &
							(CONTEXT["optionnal"] extends true
								? { [key in NAME]?: string }
								: { [key in NAME]: string });
						optionnal: CONTEXT["optionnal"];
						escape: CONTEXT["escape"];
					}>
				: never
			: CHAR extends "*"
				? ConsumeName<REST> extends {
						name: infer NAME extends string;
						rest: infer REST extends string;
					}
					? Consume<{
							rest: REST;
							// biome-ignore lint/complexity/noBannedTypes: ok
							object: (CONTEXT["baseObject"] extends true ? {} : CONTEXT["object"]) &
								(CONTEXT["optionnal"] extends true
									? { [key in NAME]?: string[] }
									: { [key in NAME]: string[] });
							optionnal: CONTEXT["optionnal"];
							escape: CONTEXT["escape"];
						}>
					: never
				: CHAR extends "{"
					? Consume<{
							rest: REST;
							baseObject: CONTEXT["baseObject"];
							object: CONTEXT["object"];
							optionnal: true;
							escape: CONTEXT["escape"];
						}>
					: CHAR extends "}"
						? Consume<{
								rest: REST;
								baseObject: CONTEXT["baseObject"];
								object: CONTEXT["object"];
								escape: CONTEXT["escape"];
							}>
						: CHAR extends "\\"
							? Consume<{
									rest: REST;
									baseObject: CONTEXT["baseObject"];
									object: CONTEXT["object"];
									escape: true;
									optionnal: CONTEXT["optionnal"];
								}>
							: Consume<{
									rest: REST;
									baseObject: CONTEXT["baseObject"];
									object: CONTEXT["object"];
									optionnal: CONTEXT["optionnal"];
									escape: CONTEXT["escape"];
								}>
	: {
			rest: "";
			baseObject: CONTEXT["baseObject"];
			object: CONTEXT["object"];
		};

type ConsumeName<INPUT extends string> = INPUT extends `"${infer REST}`
	? ConsumeQuoted<REST>
	: ConsumeWord<INPUT>;

type ConsumeQuoted<
	INPUT extends string,
	WORD extends string = "",
> = Lowercase<INPUT> extends `${infer QUOTED}"${infer REST}`
	? { name: QUOTED; rest: REST }
	: { name: WORD; rest: INPUT };

type ConsumeWord<
	INPUT extends string,
	WORD extends string = "",
> = Lowercase<INPUT> extends `${infer CHAR}${infer REST}`
	? CHAR extends "a"
		? ConsumeWord<REST, `${WORD}${CHAR}`>
		: CHAR extends "b"
			? ConsumeWord<REST, `${WORD}${CHAR}`>
			: CHAR extends "c"
				? ConsumeWord<REST, `${WORD}${CHAR}`>
				: CHAR extends "d"
					? ConsumeWord<REST, `${WORD}${CHAR}`>
					: CHAR extends "e"
						? ConsumeWord<REST, `${WORD}${CHAR}`>
						: CHAR extends "f"
							? ConsumeWord<REST, `${WORD}${CHAR}`>
							: CHAR extends "g"
								? ConsumeWord<REST, `${WORD}${CHAR}`>
								: CHAR extends "h"
									? ConsumeWord<REST, `${WORD}${CHAR}`>
									: CHAR extends "i"
										? ConsumeWord<REST, `${WORD}${CHAR}`>
										: CHAR extends "j"
											? ConsumeWord<REST, `${WORD}${CHAR}`>
											: CHAR extends "k"
												? ConsumeWord<REST, `${WORD}${CHAR}`>
												: CHAR extends "l"
													? ConsumeWord<REST, `${WORD}${CHAR}`>
													: CHAR extends "m"
														? ConsumeWord<REST, `${WORD}${CHAR}`>
														: CHAR extends "n"
															? ConsumeWord<REST, `${WORD}${CHAR}`>
															: CHAR extends "o"
																? ConsumeWord<
																		REST,
																		`${WORD}${CHAR}`
																	>
																: CHAR extends "p"
																	? ConsumeWord<
																			REST,
																			`${WORD}${CHAR}`
																		>
																	: CHAR extends "q"
																		? ConsumeWord<
																				REST,
																				`${WORD}${CHAR}`
																			>
																		: CHAR extends "r"
																			? ConsumeWord<
																					REST,
																					`${WORD}${CHAR}`
																				>
																			: CHAR extends "s"
																				? ConsumeWord<
																						REST,
																						`${WORD}${CHAR}`
																					>
																				: CHAR extends "t"
																					? ConsumeWord<
																							REST,
																							`${WORD}${CHAR}`
																						>
																					: CHAR extends "u"
																						? ConsumeWord<
																								REST,
																								`${WORD}${CHAR}`
																							>
																						: CHAR extends "v"
																							? ConsumeWord<
																									REST,
																									`${WORD}${CHAR}`
																								>
																							: CHAR extends "w"
																								? ConsumeWord<
																										REST,
																										`${WORD}${CHAR}`
																									>
																								: CHAR extends "x"
																									? ConsumeWord<
																											REST,
																											`${WORD}${CHAR}`
																										>
																									: CHAR extends "y"
																										? ConsumeWord<
																												REST,
																												`${WORD}${CHAR}`
																											>
																										: CHAR extends "z"
																											? ConsumeWord<
																													REST,
																													`${WORD}${CHAR}`
																												>
																											: CHAR extends "0"
																												? ConsumeWord<
																														REST,
																														`${WORD}${CHAR}`
																													>
																												: CHAR extends "1"
																													? ConsumeWord<
																															REST,
																															`${WORD}${CHAR}`
																														>
																													: CHAR extends "2"
																														? ConsumeWord<
																																REST,
																																`${WORD}${CHAR}`
																															>
																														: CHAR extends "3"
																															? ConsumeWord<
																																	REST,
																																	`${WORD}${CHAR}`
																																>
																															: CHAR extends "4"
																																? ConsumeWord<
																																		REST,
																																		`${WORD}${CHAR}`
																																	>
																																: CHAR extends "5"
																																	? ConsumeWord<
																																			REST,
																																			`${WORD}${CHAR}`
																																		>
																																	: CHAR extends "6"
																																		? ConsumeWord<
																																				REST,
																																				`${WORD}${CHAR}`
																																			>
																																		: CHAR extends "7"
																																			? ConsumeWord<
																																					REST,
																																					`${WORD}${CHAR}`
																																				>
																																			: CHAR extends "8"
																																				? ConsumeWord<
																																						REST,
																																						`${WORD}${CHAR}`
																																					>
																																				: CHAR extends "9"
																																					? ConsumeWord<
																																							REST,
																																							`${WORD}${CHAR}`
																																						>
																																					: CHAR extends "_"
																																						? ConsumeWord<
																																								REST,
																																								`${WORD}${CHAR}`
																																							>
																																						: {
																																								name: WORD;
																																								rest: INPUT;
																																							}
	: { name: WORD; rest: INPUT };

type PathParamsBase = Partial<Record<string, string | string[]>>;

export type Collapse<OBJECT extends PathParamsBase> = {
	[K in keyof OBJECT]: OBJECT[K];
};
