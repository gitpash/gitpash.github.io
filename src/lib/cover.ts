// Generative pixel covers. Every post gets a tiny "pixel shader": a function that
// returns a brightness for each pixel of a 200x105 image. The brightness is turned
// into one of four palette tones with a Bayer 4x4 dither plus a little noise, and the
// image is scaled up with nearest-neighbour. Everything is seeded from the slug, so
// a cover never changes and nothing is generated at runtime.

export const FAMILIES = ['terrain', 'stack', 'rings', 'blocks', 'beams'] as const;
export type Family = (typeof FAMILIES)[number];

export const W = 200;
export const H = 105;

// Four tones from dark to light, plus one accent.
const PALETTES = [
	{ name: 'slate', tones: ['#101316', '#3a464d', '#8b979d', '#f7f8f8'], accent: '#c8944a' },
	{ name: 'sepia', tones: ['#1a1006', '#5a4527', '#b79a68', '#efe3c6'], accent: '#8a3b2a' },
	{ name: 'sea', tones: ['#0f1e24', '#2f5360', '#7fa8b5', '#e4eef1'], accent: '#c8944a' },
] as const;

const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];

function hash(str: string): number {
	let h = 2166136261;
	for (let n = 0; n < str.length; n++) {
		h ^= str.charCodeAt(n);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** Deterministic pseudo-random float in [0, 1) for an integer lattice point. */
function rand2(x: number, y: number, seed: number): number {
	let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2147483647);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise. */
function noise(x: number, y: number, seed: number): number {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const a = rand2(xi, yi, seed);
	const b = rand2(xi + 1, yi, seed);
	const c = rand2(xi, yi + 1, seed);
	const d = rand2(xi + 1, yi + 1, seed);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function pickFamily(slug: string): Family {
	return FAMILIES[hash(slug) % FAMILIES.length];
}

/** What a shader returns: brightness 0..1 and whether the pixel gets the accent colour. */
type Shade = { v: number; accent?: boolean };
type Shader = (x: number, y: number, seed: number) => Shade;

// --- shader families -------------------------------------------------------

/** Layered ridgelines over a map grid, with a few lit nodes. */
const terrain: Shader = (x, y, seed) => {
	const layers = 6 + (seed % 3);
	for (let n = layers - 1; n >= 0; n--) {
		const base = 34 + n * (62 / layers);
		const ridge = base - 20 * noise(x / (24 + n * 3), n * 5.3, seed);
		if (y >= ridge) {
			const edge = y - ridge < 1.2;
			return { v: edge ? 0 : 0.18 + 0.75 * (1 - n / layers) * 0.9 + 0.08 * ((y - ridge) / 30) };
		}
	}
	// sky: faint grid, a few lit nodes
	const gx = x % 20 === 0 || y % 20 === 0;
	for (let n = 0; n < 5; n++) {
		const nx = 20 * (1 + Math.floor(rand2(n, 1, seed) * 8));
		const ny = 20 * (1 + Math.floor(rand2(n, 2, seed) * 1.5));
		if (Math.abs(x - nx) + Math.abs(y - ny) < 3) return { v: 0.5, accent: true };
	}
	return { v: gx ? 0.55 : 0.92 };
};

/** Rows of modules of different widths, like stacked components. */
const stack: Shader = (x, y, seed) => {
	const rh = 11;
	const row = Math.floor(y / rh);
	let cx = -Math.floor(rand2(row, 3, seed) * 30);
	for (let n = 0; n < 40; n++) {
		const w = 14 + Math.floor(rand2(row, n, seed) * 46);
		if (x < cx + w) {
			const gap = rand2(row, n + 100, seed) < 0.18;
			if (gap) return { v: 0.95 };
			const border = x === cx || x === cx + w - 1 || y % rh === 0;
			if (border) return { v: 0 };
			const tone = rand2(row, n + 200, seed);
			if (tone > 0.9) return { v: 0.6, accent: true };
			return { v: 0.2 + 0.7 * tone + 0.15 * ((y % rh) / rh) };
		}
		cx += w;
	}
	return { v: 0.9 };
};

/** Concentric rings around two centres, bent by the angle. */
const rings: Shader = (x, y, seed) => {
	const c1 = { x: 60 + rand2(1, 1, seed) * 80, y: 30 + rand2(1, 2, seed) * 45 };
	const c2 = { x: 60 + rand2(2, 1, seed) * 80, y: 30 + rand2(2, 2, seed) * 45 };
	const period = 10 + rand2(3, 3, seed) * 6;
	const bend = (cx: number, cy: number) => {
		const dx = x - cx;
		const dy = (y - cy) * 1.5;
		return Math.hypot(dx, dy) + 2.5 * Math.sin(Math.atan2(dy, dx) * 5 + seed);
	};
	const d1 = bend(c1.x, c1.y);
	const d2 = bend(c2.x, c2.y);
	const d = Math.min(d1, d2 * 1.15);
	const t = (d / period) % 1;
	if (d < 3) return { v: 0.5, accent: true };
	return { v: Math.abs(t - 0.5) * 2 };
};

/** A floating cluster of isometric blocks and stairs, lit from the left. */
const blocks: Shader = (x, y, seed) => {
	const s = 12;
	// -1 means "no block here", otherwise the column height in blocks
	const height = (i: number, j: number) => {
		if (noise(i / 3 + 4, j / 3, seed) < 0.5) return -1;
		return Math.floor(noise(i / 2, j / 2, seed + 1) * 4);
	};
	for (let z = 5; z >= 0; z--) {
		const gy = y + z * (s * 0.55) - 40;
		const fi = (x - 100) / (2 * s) + gy / s;
		const fj = gy / s - (x - 100) / (2 * s);
		const i = Math.floor(fi);
		const j = Math.floor(fj);
		const h = height(i, j);
		if (h < z) continue;
		const ui = fi - i;
		const uj = fj - j;
		const edge = ui < 0.06 || uj < 0.06;
		if (h === z) {
			const lit = rand2(i, j, seed) > 0.92;
			return { v: edge ? 0.05 : 0.95, accent: lit && !edge };
		}
		return { v: edge ? 0.05 : ui > uj ? 0.45 : 0.22 };
	}
	return { v: 0.22 + 0.4 * (y / H) };
};

/** Diagonal beams of different widths and brightness. */
const beams: Shader = (x, y, seed) => {
	const ang = 0.35 + rand2(4, 4, seed) * 0.9;
	const u = x * Math.cos(ang) + y * Math.sin(ang);
	const w = -x * Math.sin(ang) + y * Math.cos(ang);
	const scale = 9 + rand2(5, 5, seed) * 14;
	const cell = Math.floor(u / scale);
	const level = rand2(cell, 7, seed);
	const edge = u - cell * scale < 1;
	if (edge) return { v: 0 };
	if (level > 0.93) return { v: 0.55, accent: true };
	return { v: level * 0.8 + 0.15 * Math.sin(w / 14 + cell) };
};

const SHADERS: Record<Family, Shader> = { terrain, stack, rings, blocks, beams };

// --- rendering ---------------------------------------------------------------

export type Cover = { pixels: Uint8Array; colors: string[] };

/** Palette indices 0..3 are the tones, 4 is the accent. */
export function renderCover(slug: string, family: Family = pickFamily(slug)): Cover {
	const seed = hash(slug);
	const palette = PALETTES[seed % PALETTES.length];
	const invert = ((seed >>> 8) & 1) === 1;
	const shader = SHADERS[family];
	const pixels = new Uint8Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const { v, accent } = shader(x, y, seed);
			if (accent) {
				pixels[y * W + x] = 4;
				continue;
			}
			const base = invert ? 1 - v : v;
			const jitter = (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.34 + (rand2(x, y, seed) - 0.5) * 0.12;
			const level = Math.min(0.999, Math.max(0, base + jitter));
			pixels[y * W + x] = Math.floor(level * 4);
		}
	}
	return { pixels, colors: [...palette.tones, palette.accent] };
}

export function coverSvg(slug: string, family?: Family): string {
	const { pixels, colors } = renderCover(slug, family);
	const paths: string[][] = colors.map(() => []);
	for (let y = 0; y < H; y++) {
		let x = 0;
		while (x < W) {
			const c = pixels[y * W + x];
			let end = x + 1;
			while (end < W && pixels[y * W + end] === c) end++;
			if (c !== 0) paths[c].push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
			x = end;
		}
	}
	const body = paths.map((d, c) => (d.length ? `<path fill="${colors[c]}" d="${d.join('')}"/>` : '')).join('');
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid slice">` +
		`<rect width="${W}" height="${H}" fill="${colors[0]}"/>${body}</svg>`
	);
}

export async function coverPng(slug: string, family?: Family): Promise<Buffer> {
	const { default: sharp } = await import('sharp');
	const { pixels, colors } = renderCover(slug, family);
	const rgb = Buffer.alloc(W * H * 3);
	pixels.forEach((c, n) => {
		const hex = colors[c].slice(1);
		rgb[n * 3] = parseInt(hex.slice(0, 2), 16);
		rgb[n * 3 + 1] = parseInt(hex.slice(2, 4), 16);
		rgb[n * 3 + 2] = parseInt(hex.slice(4, 6), 16);
	});
	return sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
		.resize(1200, 630, { kernel: 'nearest', fit: 'cover' })
		.png({ palette: true })
		.toBuffer();
}
