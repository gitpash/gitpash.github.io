// Source colours of the site palette. CSS gets the same values from the `--c-*` tokens in
// src/styles/global.css; `npm run check:palette` fails if the two drift apart.
// Raw hex is allowed only here and in global.css.

export const SOURCE = {
	blue: '#95bccc',
	pink: '#fcdcdc',
	teal: '#2b4c59',
	taupe: '#988080',
	mist: '#beceda',
} as const;

// Cover tones: four steps from dark to light plus one accent, each a shade or tint of a
// source colour (the third tone of every set is the source colour itself).
export const COVER_PALETTES = [
	{ name: 'teal', tones: ['#0e1a1f', SOURCE.teal, SOURCE.blue, '#f3f8fa'], accent: SOURCE.pink },
	{ name: 'rose', tones: ['#241b1d', '#5f4f50', SOURCE.taupe, '#fcefef'], accent: SOURCE.blue },
	{ name: 'mist', tones: ['#1a2a32', '#586f7d', SOURCE.mist, '#f4f7f9'], accent: SOURCE.pink },
] as const;
