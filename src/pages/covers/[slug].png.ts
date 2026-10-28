import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { coverPng, pickFamily } from '../../lib/cover';

export const getStaticPaths = (async () => {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { family: post.data.cover ?? pickFamily(post.id) },
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
	const png = await coverPng(params.slug!, props.family);
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
