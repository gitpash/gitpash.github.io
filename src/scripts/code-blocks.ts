// Wraps each Shiki block in a frame with a language label and a copy button.
document.querySelectorAll<HTMLPreElement>('pre.astro-code').forEach((pre) => {
	const wrap = document.createElement('div');
	wrap.className = 'code-block';

	const bar = document.createElement('div');
	bar.className = 'code-block-bar';
	const lang = document.createElement('span');
	const language = pre.dataset.language;
	lang.textContent = language && language !== 'plaintext' ? language : 'text';

	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'code-copy';
	button.textContent = 'Copy';
	button.setAttribute('aria-label', 'Copy code to clipboard');
	let timer: number | undefined;
	button.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ''));
			button.textContent = 'Copied';
		} catch {
			button.textContent = 'Press Ctrl+C';
		}
		clearTimeout(timer);
		timer = window.setTimeout(() => (button.textContent = 'Copy'), 1800);
	});

	bar.append(lang, button);
	pre.replaceWith(wrap);
	wrap.append(bar, pre);
});
