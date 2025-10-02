# Claude Code Session Sharer

A simple site for sharing Claude Code session traces anonymously. Built with TypeScript and deployed on Cloudflare Pages.

## Features

- Anonymous uploads with randomly generated shareable links
- Monospace terminal-like appearance inspired by [The Monospace Web](https://owickstrom.github.io/the-monospace-web/)
- Cloudflare Pages + D1 database for storage
- No login required

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create D1 database:
```bash
npx wrangler d1 create claude-sessions
```

3. Update `wrangler.toml` with your database ID from the output above.

4. Apply migrations locally:
```bash
npx wrangler d1 migrations apply claude-sessions --local
```

5. Run development server:
```bash
npm run dev
```

## Deployment

1. Apply migrations to production:
```bash
npx wrangler d1 migrations apply claude-sessions --remote
```

2. Deploy to Cloudflare Pages:
```bash
npm run deploy
```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

## Usage

1. Visit the homepage
2. Paste your Claude Code session output
3. Click "Create Share Link"
4. Share the generated link with anyone

## Privacy

Sessions are stored anonymously. Anyone with the link can view the session. Do not share sensitive information like API keys, passwords, or private data.
