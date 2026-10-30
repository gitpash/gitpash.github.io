import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { ogCard } from '../../../lib/og';

export const getStaticPaths = (async () => {
	const posts = await getCollection('blog');
	return posts.map((post) => ({ params: { slug: post.id }, props: post.data }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
	const png = await ogCard({ eyebrow: 'Blog', title: props.title, subline: 'Pavel Luzanov', slug: params.slug!, family: props.cover });
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
