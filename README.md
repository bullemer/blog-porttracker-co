# blog.porttracker.co

The official blog for [PortTracker.co](https://porttracker.co) — maritime visual analytics and AIS intelligence by [Navisense GmbH](https://navisense.de).

Built with [Astro](https://astro.build) 6 + MDX. Deployed via GitHub Actions to Hetzner (FTP).

## Commands

| Command         | Action                                      |
| :-------------- | :------------------------------------------ |
| `npm install`   | Install dependencies                        |
| `npm run dev`   | Start local dev server at `localhost:4321`   |
| `npm run build` | Build production site to `./dist/`           |

## Adding a Blog Post

Create a new `.md` or `.mdx` file in `src/content/blog/` with this frontmatter:

```yaml
---
title: "Your Title"
description: "Brief excerpt"
pubDate: 'Jul 19, 2026'
heroImage: '../../assets/your-image.png'
---
```

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that builds the site and deploys via FTPS to Hetzner.

Required GitHub Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.

## Migration

The `migrate.mjs` script can pull posts from the legacy WordPress installation. Requires `WP_USER` and `WP_PASS` environment variables.
