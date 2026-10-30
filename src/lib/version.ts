import { createHash } from 'node:crypto';
import type { CollectionEntry } from 'astro:content';

// Short content fingerprint of a post, used by /version.json and the update notice.
export function postVersion(post: CollectionEntry<'blog'>): string {
	const { title, description, updatedDate } = post.data;
	return createHash('sha1')
		.update([title, description, updatedDate?.toISOString() ?? '', post.body ?? ''].join('\n'))
		.digest('hex')
		.slice(0, 8);
}
