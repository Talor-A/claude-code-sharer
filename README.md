# claudecode.link

A simple site for sharing Claude Code session traces anonymously. Built with TypeScript and deployed on Cloudflare Pages.

## Features

- Anonymous uploads with randomly generated shareable links
- Monospace terminal-like appearance inspired by [The Monospace Web](https://owickstrom.github.io/the-monospace-web/)
- Cloudflare Pages + D1 database for storage
- No login required

## Setup

```bash
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
