import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <ViteClient />
        <title>claudecode.link</title>
        <meta name="description" content="Share Claude Code sessions with others. Easy collaboration, debugging, and documentation for Claude Code CLI conversations."/>
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
