export const LANGS = ["en"] as const;
export type Lang = (typeof LANGS)[number];

export const VERSIONS = ["1.0.0"] as const;
export type Version = (typeof VERSIONS)[number];

export function isValidLang(lang: string): lang is Lang {
	return LANGS.includes(lang as Lang);
}

export function isValidVersion(version: string): version is Version {
	return VERSIONS.includes(version as Version);
}
