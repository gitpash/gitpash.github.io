import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { coverPng, pickScene } from '../../lib/cover';

export const getStaticPaths = (async () => {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { scene: post.data.scene ?? pickScene(post.id) },
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
	const png = await coverPng(params.slug!, props.scene);
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
