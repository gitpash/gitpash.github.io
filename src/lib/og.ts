// Social cards (1200x630 PNG) drawn at build time: title and a short subline on an ink panel,
// with the generative pixel cover on the right. Text is laid out by satori (woff fonts from
// @fontsource), then rasterised by sharp. Colours come from the palette source in palette.ts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderCover, W, H, type Family } from './cover';
import { SOURCE } from './palette';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const font = (pkg: string, file: string) => readFileSync(resolve('node_modules/@fontsource', pkg, 'files', file));

let fonts: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | undefined;
const loadFonts = () =>
	(fonts ??= [
		{ name: 'Inter', data: font('inter', 'inter-latin-700-normal.woff'), weight: 700, style: 'normal' },
		{ name: 'Silkscreen', data: font('silkscreen', 'silkscreen-latin-400-normal.woff'), weight: 400, style: 'normal' },
	]);

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
	type,
	props: { style: { display: 'flex', ...style }, children },
});

async function artPng(slug: string, family?: Family): Promise<string> {
	const { default: sharp } = await import('sharp');
	const { pixels, colors } = renderCover(slug, family);
	const rgb = Buffer.alloc(W * H * 3);
	pixels.forEach((c, n) => {
		const hex = colors[c].slice(1);
		for (let k = 0; k < 3; k++) rgb[n * 3 + k] = parseInt(hex.slice(k * 2, k * 2 + 2), 16);
	});
	const png = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
		.resize(OG_HEIGHT * 2, OG_HEIGHT, { kernel: 'nearest', fit: 'cover' })
		.png({ palette: true })
		.toBuffer();
	return `data:image/png;base64,${png.toString('base64')}`;
}

export interface Card {
	/** Small pixel-font line above the title. */
	eyebrow: string;
	title: string;
	/** Short line under the title. */
	subline: string;
	/** Seeds the pixel art. */
	slug: string;
	family?: Family;
}

export async function ogCard({ eyebrow, title, subline, slug, family }: Card): Promise<Buffer> {
	const { default: satori } = await import('satori');
	const { default: sharp } = await import('sharp');
	const size = title.length > 60 ? 52 : title.length > 36 ? 62 : 74;
	const tree = el(
		'div',
		{ width: OG_WIDTH, height: OG_HEIGHT, background: SOURCE.ink },
		[
			el('div', { flexDirection: 'column', justifyContent: 'space-between', width: 760, height: OG_HEIGHT, padding: '64px 56px 96px 64px' }, [
				el('div', { fontFamily: 'Silkscreen', fontSize: 28, color: SOURCE.pink, letterSpacing: 3 }, eyebrow.toUpperCase()),
				el('div', { flexDirection: 'column' }, [
					el('div', { fontFamily: 'Inter', fontWeight: 700, fontSize: size, lineHeight: 1.12, color: SOURCE.paper }, title),
					el('div', { fontFamily: 'Inter', fontWeight: 700, fontSize: 32, color: SOURCE.mist, marginTop: 28 }, subline),
				]),
			]),
			{
				type: 'img',
				props: { src: await artPng(slug, family), width: 440, height: OG_HEIGHT, style: { width: 440, height: OG_HEIGHT, objectFit: 'cover', objectPosition: 'right' } },
			},
		],
	);
	const svg = await satori(tree as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts: loadFonts() });
	return sharp(Buffer.from(svg)).png({ palette: true, compressionLevel: 9 }).toBuffer();
}
