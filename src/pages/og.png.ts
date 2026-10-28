import type { APIRoute } from 'astro';
import { coverPng } from '../lib/cover';

export const GET: APIRoute = async () => {
	const png = await coverPng('gitpash', 'lighthouse');
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
