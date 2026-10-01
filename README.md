# Pavel Luzanov - Personal Website

A modern personal website and blog built with [Astro](https://astro.build/).

## Features

- 🚀 Built with Astro for optimal performance
- 📝 Blog with Markdown/MDX support
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive design
- 🔗 GitHub integration (projects, stats)
- ⚡ Fast static site generation
- 🎨 Modern UI with animations

## Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BaseHead.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── ProjectCard.astro
│   │   └── ThemeToggle.astro
│   ├── content/
│   │   └── blog/               # Blog posts
│   ├── layouts/
│   │   └── BlogPost.astro
│   ├── pages/
│   │   ├── index.astro         # Home page
│   │   ├── about.astro         # About page
│   │   ├── cv.astro            # CV page
│   │   └── blog/
│   │       ├── index.astro     # Blog listing
│   │       └── [...slug].astro # Individual posts
│   ├── styles/
│   │   └── global.css
│   └── utils/
│       └── github.ts           # GitHub API integration
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions. Every push to the `main` branch triggers a new deployment.

## License

MIT
