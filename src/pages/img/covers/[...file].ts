import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { COVER_WIDTHS, coverImage } from '../../../lib/cover';

// /img/covers/<slug>-<width>.<webp|png>, built once per post and size.
export const getStaticPaths = (async () => {
	const posts = await getCollection('blog');
	return posts.flatMap((post) =>
		COVER_WIDTHS.flatMap((width) =>
			(['webp', 'png'] as const).map((format) => ({
				params: { file: `${post.id}-${width}.${format}` },
				props: { slug: post.id, family: post.data.cover, width, format },
			})),
		),
	);
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const body = await coverImage(props.slug, props.family, props.width, props.format);
	return new Response(new Uint8Array(body), { headers: { 'Content-Type': `image/${props.format}` } });
};
