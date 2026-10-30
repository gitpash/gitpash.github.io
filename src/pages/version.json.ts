import { getCollection } from 'astro:content';
import { postVersion } from '../lib/version';

export async function GET() {
	const posts = await getCollection('blog');
	return new Response(JSON.stringify(Object.fromEntries(posts.map((post) => [post.id, postVersion(post)]))), {
		headers: { 'Content-Type': 'application/json' },
	});
}
