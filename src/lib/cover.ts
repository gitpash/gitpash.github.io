// Deterministic isometric 1-bit covers. A small voxel scene is drawn back to front
// into a pixel buffer, dithered with a Bayer 4x4 matrix and exported as SVG or PNG.
// No canvas, no network, no randomness except a seed taken from the post slug.

export const SCENES = ['lighthouse', 'island', 'stairs'] as const;
export type Scene = (typeof SCENES)[number];

export const W = 240;
export const H = 126;

const INK = 0;
const PAPER = 1;
const SEPIA = 2;

// Pixels per voxel unit: one cell is 8s by 8s with the top diamond 8s wide.
const S = 2;

const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];

type Voxel = { i: number; j: number; k: number; dark?: boolean };

function hash(str: string): number {
	let h = 2166136261;
	for (let n = 0; n < str.length; n++) {
		h ^= str.charCodeAt(n);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function rng(seed: number) {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function pickScene(slug: string): Scene {
	return SCENES[hash(slug) % SCENES.length];
}

function column(vs: Voxel[], i: number, j: number, from: number, to: number, dark = false) {
	for (let k = from; k < to; k++) vs.push({ i, j, k, dark });
}

function plate(vs: Voxel[], size: number, rand: () => number) {
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			const dx = i - (size - 1) / 2;
			const dy = j - (size - 1) / 2;
			if (dx * dx + dy * dy > (size / 2) * (size / 2) + 0.5) continue;
			const edge = dx * dx + dy * dy > (size / 2 - 1) * (size / 2 - 1);
			column(vs, i, j, 0, edge ? 1 + (rand() < 0.5 ? 1 : 0) : 2);
		}
	}
}

function buildScene(scene: Scene, rand: () => number): { voxels: Voxel[]; beam?: { i: number; j: number; k: number } } {
	const vs: Voxel[] = [];
	if (scene === 'lighthouse') {
		plate(vs, 5, rand);
		const c = 2;
		for (let k = 2; k < 8; k++) {
			const stripe = Math.floor((k - 2) / 2) % 2 === 1;
			for (let di = 0; di < 2; di++) for (let dj = 0; dj < 2; dj++) vs.push({ i: c + di - 1, j: c + dj - 1, k, dark: stripe });
		}
		for (let di = 0; di < 2; di++) for (let dj = 0; dj < 2; dj++) vs.push({ i: c + di - 1, j: c + dj - 1, k: 8, dark: true });
		for (let di = 0; di < 2; di++) for (let dj = 0; dj < 2; dj++) vs.push({ i: c + di - 1, j: c + dj - 1, k: 9 });
		vs.push({ i: c, j: c, k: 10, dark: true });
		return { voxels: vs, beam: { i: c, j: c, k: 9 } };
	}
	if (scene === 'island') {
		plate(vs, 6, rand);
		// loose "modules": small stacks of blocks that can be moved around
		const spots: [number, number, number][] = [
			[1, 2, 3],
			[3, 1, 2],
			[2, 3, 4],
			[4, 4, 2],
		];
		for (const [i, j, h] of spots) column(vs, i, j, 2, 2 + h, (i + j) % 2 === 0);
		vs.push({ i: 2, j: 3, k: 6, dark: true });
		return { voxels: vs };
	}
	// stairs: the same block repeated, one step at a time
	for (let n = 0; n < 5; n++) {
		for (let j = 0; j < 2; j++) column(vs, n, j + 1, 0, 1 + n, n % 2 === 1);
	}
	return { voxels: vs };
}

type Buf = { px: Uint8Array; id: Int32Array };

function put(buf: Buf, x: number, y: number, c: number, id: number) {
	if (x < 0 || y < 0 || x >= W || y >= H) return;
	buf.px[y * W + x] = c;
	buf.id[y * W + x] = id;
}

function level(buf: Buf, x: number, y: number, v: number, id: number) {
	put(buf, x, y, v > BAYER[y & 3][x & 3] / 16 ? PAPER : INK, id);
}

export function renderCover(slug: string, scene: Scene = pickScene(slug)): Uint8Array {
	const rand = rng(hash(slug));
	const buf: Buf = { px: new Uint8Array(W * H), id: new Int32Array(W * H).fill(-1) };
	const horizon = 70 + Math.floor(rand() * 6);

	// sky: black at the top, fading to paper at the horizon
	for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) level(buf, x, y, 0.1 + 0.8 * (y / horizon) ** 1.2, -1);
	// sea: horizontal ripples
	for (let y = horizon; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const wave = (y - horizon) % 4 === 2 && Math.sin(x * 0.3 + y * 2.1) > 0.35;
			level(buf, x, y, wave ? 0.45 : 0.97, -1);
		}
	}
	// stars
	for (let n = 0; n < 14; n++) {
		const x = Math.floor(rand() * W);
		const y = Math.floor(rand() * horizon * 0.45);
		put(buf, x, y, PAPER, -1);
	}
	// moon
	const mx = 28 + Math.floor(rand() * 60);
	const my = 18 + Math.floor(rand() * 14);
	const mr = 8 + Math.floor(rand() * 3);
	for (let y = -mr - 1; y <= mr + 1; y++) {
		for (let x = -mr - 1; x <= mr + 1; x++) {
			const d = Math.hypot(x, y);
			if (d <= mr) put(buf, mx + x, my + y, PAPER, -2);
			else if (d <= mr + 1.2) put(buf, mx + x, my + y, INK, -2);
		}
	}

	const { voxels, beam } = buildScene(scene, rand);
	const ox = Math.round(W * 0.66);
	const oy = { lighthouse: 76, island: 62, stairs: 58 }[scene];
	const proj = (i: number, j: number, k: number) => ({
		x: ox + (i - j) * 4 * S,
		y: oy + (i + j) * 2 * S - k * 4 * S,
	});

	const sorted = voxels
		.map((v, idx) => ({ v, idx }))
		.sort((a, b) => a.v.i + a.v.j - (b.v.i + b.v.j) || a.v.k - b.v.k);

	const bright = {
		light: { top: 1.1, left: 0.62, right: 0.84 },
		dark: { top: 0.4, left: 0.06, right: 0.2 },
	};

	for (const { v, idx } of sorted) {
		const { x: cx, y: cy } = proj(v.i, v.j, v.k);
		const bx = cx - 4 * S;
		const by = cy - 4 * S; // top of the 8x8 cell (diamond on top, side faces below)
		const b = v.dark ? bright.dark : bright.light;
		for (let y = 0; y < 8 * S; y++) {
			for (let x = 0; x < 8 * S; x++) {
				const xc = (x + 0.5) / S;
				const yc = (y + 0.5) / S;
				let face: 'top' | 'left' | 'right' | null = null;
				if (Math.abs(xc - 4) / 4 + Math.abs(yc - 2) / 2 <= 1) face = 'top';
				else if (xc < 4 && yc >= 2 + xc / 2 && yc <= 6 + xc / 2) face = 'left';
				else if (xc >= 4 && yc >= 4 - (xc - 4) / 2 && yc <= 8 - (xc - 4) / 2) face = 'right';
				if (face) level(buf, bx + x, by + y, b[face], idx * 3 + ['top', 'left', 'right'].indexOf(face));
			}
		}
	}

	// outlines: ink wherever two different shapes meet
	const outline: number[] = [];
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const id = buf.id[y * W + x];
			if (id < 0) continue;
			const edge =
				(x > 0 && buf.id[y * W + x - 1] !== id) ||
				(y > 0 && buf.id[(y - 1) * W + x] !== id) ||
				(x < W - 1 && buf.id[y * W + x + 1] !== id) ||
				(y < H - 1 && buf.id[(y + 1) * W + x] !== id);
			if (edge && buf.px[y * W + x] === PAPER) outline.push(y * W + x);
		}
	}
	for (const p of outline) buf.px[p] = INK;

	// lighthouse beam: a warm cone with a dithered fade
	if (beam) {
		const { x: lx, y: ly } = proj(beam.i, beam.j, beam.k);
		const dir = rand() < 0.5 ? -1 : 1;
		for (let x = 0; x < 120; x++) {
			const spread = 2 + x * 0.16;
			const fade = 1 - x / 120;
			for (let y = -spread; y <= spread; y += 1) {
				const px = lx + dir * (6 + x);
				const py = Math.round(ly - 2 + y - x * 0.04);
				if (px < 0 || px >= W || py < 0 || py >= H) continue;
				if (buf.id[py * W + px] >= 0) continue;
				if (fade * (1 - Math.abs(y) / (spread + 1)) > BAYER[py & 3][px & 3] / 16) buf.px[py * W + px] = SEPIA;
			}
		}
		for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) put(buf, lx + x, ly + y, SEPIA, -3);
	}
	return buf.px;
}

const COLORS = { [INK]: '#000000', [PAPER]: '#ffffff', [SEPIA]: '#c8944a' } as const;

export function coverSvg(slug: string, scene?: Scene): string {
	const px = renderCover(slug, scene);
	const paths: Record<number, string[]> = { [INK]: [], [SEPIA]: [] };
	for (let y = 0; y < H; y++) {
		let x = 0;
		while (x < W) {
			const c = px[y * W + x];
			let end = x + 1;
			while (end < W && px[y * W + end] === c) end++;
			if (c !== PAPER) paths[c].push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
			x = end;
		}
	}
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid slice">` +
		`<rect width="${W}" height="${H}" fill="#fff"/>` +
		`<path fill="${COLORS[INK]}" d="${paths[INK].join('')}"/>` +
		`<path fill="${COLORS[SEPIA]}" d="${paths[SEPIA].join('')}"/>` +
		`</svg>`
	);
}

export async function coverPng(slug: string, scene?: Scene): Promise<Buffer> {
	const { default: sharp } = await import('sharp');
	const px = renderCover(slug, scene);
	const rgb = Buffer.alloc(W * H * 3);
	px.forEach((c, n) => {
		const hex = COLORS[c as 0 | 1 | 2].slice(1);
		rgb[n * 3] = parseInt(hex.slice(0, 2), 16);
		rgb[n * 3 + 1] = parseInt(hex.slice(2, 4), 16);
		rgb[n * 3 + 2] = parseInt(hex.slice(4, 6), 16);
	});
	return sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
		.resize(1200, 630, { kernel: 'nearest', fit: 'cover' })
		.png({ palette: true })
		.toBuffer();
}
