// Generative pixel covers. Every post gets a tiny "pixel shader": a function that
// returns a brightness for each pixel of a 200x105 image. The brightness is turned
// into one of four palette tones with a Bayer 4x4 dither plus a little noise, and the
// image is scaled up with nearest-neighbour. Everything is seeded from the slug, so
// a cover never changes and nothing is generated at runtime.

import { COVER_PALETTES } from './palette';

// Families picked from the slug when a post does not name one.
export const FAMILIES = ['terrain', 'stack', 'rings', 'blocks', 'beams', 'grid'] as const;
// 'hooks' is the one hand-designed scene and only used when a post asks for it.
export type Family = (typeof FAMILIES)[number] | 'hooks';

export const W = 200;
export const H = 105;

// Four tones from dark to light, plus one accent (see palette.ts).
const PALETTES = COVER_PALETTES;

// Each family has its own palette and light direction, so two families never look alike
// even when the seed is similar. `invert` flips dark and light.
const STYLE: Record<Family, { palette: number; invert: boolean }> = {
	grid: { palette: 0, invert: false }, // slate, dark board
	blocks: { palette: 1, invert: false }, // sepia, lit from the left
	stack: { palette: 0, invert: true }, // slate, pale sheet
	beams: { palette: 2, invert: false }, // sea, dark with bright beams
	rings: { palette: 1, invert: true }, // sepia, pale
	terrain: { palette: 2, invert: true }, // sea, pale
	hooks: { palette: 2, invert: false },
};

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

/** A map as a board: faint graph paper, a few rooms, orthogonal links between nodes, lit nodes. */
const grid: Shader = (x, y, seed) => {
	const cell = 15;
	const ox = 7;
	const oy = 6;
	const i = Math.round((x - ox) / cell);
	const j = Math.round((y - oy) / cell);
	const dx = x - (ox + i * cell);
	const dy = y - (oy + j * cell);
	const node = (a: number, b: number) => rand2(a, b, seed) > 0.42;
	const lit = (a: number, b: number) => node(a, b) && rand2(a, b, seed + 9) > 0.7;
	if (node(i, j)) {
		if (lit(i, j) && Math.abs(dx) + Math.abs(dy) < 4) return { v: 0.5, accent: true };
		if (lit(i, j) && Math.abs(dx) + Math.abs(dy) < 6) return { v: 0.05 };
		if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return { v: 0.95 };
		if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return { v: 0.05 };
	}
	// links: a node connects right and/or down when both ends are nodes
	const right = node(i, j) && node(i + 1, j) && rand2(i, j, seed + 3) > 0.35;
	const down = node(i, j) && node(i, j + 1) && rand2(i, j, seed + 5) > 0.35;
	if (right && dx > 3 && Math.abs(dy) < 1) return { v: 0.9 };
	if (down && dy > 3 && Math.abs(dx) < 1) return { v: 0.9 };
	// rooms: a few filled cells
	const ci = Math.floor((x - ox + cell / 2) / cell);
	const cj = Math.floor((y - oy + cell / 2) / cell);
	const room = rand2(ci, cj, seed + 11) > 0.8 && x % cell !== (ox + 7) % cell;
	// graph paper
	const line = (x - ox) % 5 === 0 || (y - oy) % 5 === 0;
	return { v: room ? 0.3 : line ? 0.2 : 0.1 };
};

/** Hand-designed scene: two carabiner hooks clipped to a ring on a wooden post, rope loops
 *  on both sides, calm water behind. Everything is built from a few shapes. */
const hooks: Shader = (x, y) => {
	const ring = (px: number, py: number, cx: number, cy: number, r: number) => Math.abs(Math.hypot(px - cx, py - cy) - r);
	const STEEL = 0.97;
	const DARK = 0.03;
	const stroke = (d: number, w: number): Shade | null => (d < w / 2 ? { v: STEEL } : d < w / 2 + 1.1 ? { v: DARK } : null);

	// carabiners: tilted capsules hanging from the ring, brass nut on the gate
	for (const side of [-1, 1]) {
		const c = { x: 98 + side * 15, y: 51 };
		const a = side * 0.42;
		const dx = x - c.x;
		const dy = y - c.y;
		const lx = dx * Math.cos(a) + dy * Math.sin(a);
		const ly = -dx * Math.sin(a) + dy * Math.cos(a);
		const d = Math.abs(Math.hypot(lx, Math.max(Math.abs(ly) - 8, 0)) - 5.5);
		if (Math.abs(lx - side * 5.5) < 1 && ly > -2 && ly < 9) return { v: 0.55 };
		if (Math.abs(lx - side * 5.5) < 2.3 && Math.abs(ly - 9) < 1.8) return { v: 0.5, accent: true };
		const hit = stroke(d, 3);
		if (hit) return hit;
	}
	// ring on the post
	const rg = stroke(ring(x, y, 99, 33, 9), 3.5);
	if (rg) return rg;
	// rope with a loop at each side
	for (const m of [false, true]) {
		const X = m ? 196 - x : x;
		const e = ring(X, y, 38, 84, 9.5);
		if (e < 2) return { v: Math.floor((Math.atan2(y - 84, X - 38) * 9) / 1) % 2 === 0 ? 0.58 : 0.34 };
		if (e < 3.1) return { v: DARK };
		let best = 99;
		let along = 0;
		for (let n = 0; n <= 30; n++) {
			const t = n / 30;
			const bx = (1 - t) * (1 - t) * 80 + 2 * (1 - t) * t * 62 + t * t * 47;
			const by = (1 - t) * (1 - t) * 68 + 2 * (1 - t) * t * 94 + t * t * 89;
			const dd = Math.hypot(X - bx, y - by);
			if (dd < best) {
				best = dd;
				along = n;
			}
		}
		if (best < 2) return { v: Math.floor(along / 2) % 2 === 0 ? 0.58 : 0.34 };
		if (best < 3.1) return { v: DARK };
	}
	// wooden post: lit front, shaded side, light top, dark outline
	const t = (16 - y) / 6;
	if (y >= 10 && y < 16 && x >= 84 + 10 * t && x < 114 + 10 * t) return { v: x < 85 + 10 * t || y < 11 ? DARK : 0.82 };
	if (x >= 114 && x < 124 && y >= 16 - (x - 114) * 0.6) return { v: x > 122 ? DARK : 0.2 };
	if (x >= 84 && x < 114 && y >= 16) {
		if (x === 84 || x === 113 || y === 16) return { v: DARK };
		return { v: 0.5 + ((x - 84) % 8 === 3 ? -0.14 : 0) + 0.05 * Math.sin(y * 0.4 + x * 2) };
	}
	// calm water behind: pale haze above the horizon, ripples below
	if (y < 58) return { v: 0.86 + 0.1 * (y / 58) };
	const ripple = (y - 58) % 5 === 2 && Math.sin(x * 0.25 + y * 1.3) > 0.3;
	return { v: ripple ? 0.92 : 0.58 - 0.12 * ((y - 58) / 47) };
};

const SHADERS: Record<Family, Shader> = { terrain, stack, rings, blocks, beams, grid, hooks };

// --- rendering ---------------------------------------------------------------

export type Cover = { pixels: Uint8Array; colors: string[]; name: string };

/** Palette indices 0..3 are the tones, 4 is the accent. */
export function renderCover(slug: string, family: Family = pickFamily(slug)): Cover {
	const seed = hash(slug);
	const handmade = family === 'hooks';
	const { palette: paletteIndex, invert } = STYLE[family];
	const palette = PALETTES[paletteIndex];
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
			const jitter = handmade
				? (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.2
				: (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.34 + (rand2(x, y, seed) - 0.5) * 0.12;
			const level = Math.min(0.999, Math.max(0, base + jitter));
			pixels[y * W + x] = Math.floor(level * 4);
		}
	}
	return { pixels, colors: [...palette.tones, palette.accent], name: palette.name };
}

async function coverRaw(slug: string, family?: Family) {
	const { default: sharp } = await import('sharp');
	const { pixels, colors } = renderCover(slug, family);
	const rgb = Buffer.alloc(W * H * 3);
	pixels.forEach((c, n) => {
		const hex = colors[c].slice(1);
		rgb[n * 3] = parseInt(hex.slice(0, 2), 16);
		rgb[n * 3 + 1] = parseInt(hex.slice(2, 4), 16);
		rgb[n * 3 + 2] = parseInt(hex.slice(4, 6), 16);
	});
	return sharp(rgb, { raw: { width: W, height: H, channels: 3 } });
}

/** Legacy 1200x630 PNG (kept so old shared links keep working). */
export async function coverPng(slug: string, family?: Family): Promise<Buffer> {
	return (await coverRaw(slug, family)).resize(1200, 630, { kernel: 'nearest', fit: 'cover' }).png({ palette: true }).toBuffer();
}

/**
 * Cover as an image file for <picture>: the 200x105 pixel grid scaled by a whole factor with
 * nearest-neighbour, so pixels stay crisp. Lossless WebP is the smallest option for this
 * five-tone dithered art (AVIF measured 2-6x larger); palette PNG is the fallback.
 */
export async function coverImage(slug: string, family: Family | undefined, width: number, format: 'webp' | 'png'): Promise<Buffer> {
	const img = (await coverRaw(slug, family)).resize(width, Math.round((width * H) / W), { kernel: 'nearest' });
	return format === 'webp' ? img.webp({ lossless: true, effort: 6 }).toBuffer() : img.png({ palette: true, compressionLevel: 9 }).toBuffer();
}

export const COVER_WIDTHS = [600, 1200] as const;
export const COVER_RATIO = { width: 1200, height: 630 } as const;
