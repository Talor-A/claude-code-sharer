interface Env {
  DB: D1Database;
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { content } = await context.request.json() as { content: string };

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = generateId();
    const createdAt = Date.now();

    await context.env.DB.prepare(
      'INSERT INTO sessions (id, content, created_at) VALUES (?, ?, ?)'
    ).bind(id, content, createdAt).run();

    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
