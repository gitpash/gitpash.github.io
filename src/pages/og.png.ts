import type { APIRoute } from 'astro';
import { ogCard } from '../lib/og';
import { PAGES } from '../consts';

// Site-wide fallback card (same as the Home card); kept at this path for existing links.
export const GET: APIRoute = async () => {
	const png = await ogCard({ eyebrow: 'Pavel Luzanov', title: PAGES.home.cardTitle, subline: PAGES.home.cardSubline, slug: 'page-home', family: PAGES.home.family });
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
