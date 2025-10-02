import { WorkerEntrypoint } from 'cloudflare:workers';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default class extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // API routes
    if (url.pathname === '/api/sessions' && request.method === 'POST') {
      return this.createSession(request);
    }

    if (url.pathname.startsWith('/api/sessions/') && request.method === 'GET') {
      const id = url.pathname.split('/').pop();
      return this.getSession(id!);
    }

    // Rewrite /s/:id to /session.html
    if (url.pathname.startsWith('/s/')) {
      url.pathname = '/session.html';
      return this.env.ASSETS.fetch(new Request(url, request));
    }

    // Serve static assets
    return this.env.ASSETS.fetch(request);
  }

  private async createSession(request: Request): Promise<Response> {
    try {
      const formData = await request.formData();
      const content = formData.get('content');

      if (!content || typeof content !== 'string' || !content.trim()) {
        return new Response('Invalid content', { status: 400 });
      }

      // Trim leading newlines but NOT leading whitespace
      const trimmedContent = content.replace(/^\n+/, '');

      const id = generateId();
      const createdAt = Date.now();

      await this.env.DB.prepare(
        'INSERT INTO sessions (id, content, created_at) VALUES (?, ?, ?)'
      ).bind(id, trimmedContent, createdAt).run();

      return Response.redirect(`/s/${id}`, 302);
    } catch (error) {
      return new Response('Failed to create session', { status: 500 });
    }
  }

  private async getSession(id: string): Promise<Response> {
    try {
      if (!id || typeof id !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await this.env.DB.prepare(
        'SELECT content, created_at FROM sessions WHERE id = ?'
      ).bind(id).first();

      if (!result) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        content: result.content,
        createdAt: result.created_at
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch session' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
