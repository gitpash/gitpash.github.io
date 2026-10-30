// Source colours of the site palette. CSS gets the same values from the `--c-*` tokens in
// src/styles/global.css; `npm run check:palette` fails if the two drift apart.
// Raw hex is allowed only here and in global.css.

export const SOURCE = {
	blue: '#95bccc',
	pink: '#e3c6c6',
	deep: '#3f5468',
	taupe: '#988080',
	mist: '#beceda',
	ink: '#26323f',
} as const;

// Cover tones: four steps from dark to light plus one accent, each a shade or tint of a
// source colour (the third tone of every set is the source colour itself).
export const COVER_PALETTES = [
	{ name: 'slate', tones: [SOURCE.ink, SOURCE.deep, SOURCE.blue, '#f0f6f8'], accent: SOURCE.pink },
	{ name: 'rose', tones: ['#211c1c', '#5e4f4f', SOURCE.taupe, '#f5ebeb'], accent: SOURCE.mist },
	{ name: 'mist', tones: [SOURCE.ink, '#606d7a', SOURCE.mist, '#f5f7f9'], accent: SOURCE.pink },
] as const;
