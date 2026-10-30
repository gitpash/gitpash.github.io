import type { APIRoute, GetStaticPaths } from 'astro';
import { ogCard } from '../../lib/og';
import { PAGES } from '../../consts';

export const getStaticPaths = (async () =>
	Object.entries(PAGES).map(([page, meta]) => ({ params: { page }, props: meta }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
	const png = await ogCard({ eyebrow: 'Pavel Luzanov', title: props.cardTitle, subline: props.cardSubline, slug: `page-${params.page}`, family: props.family });
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
