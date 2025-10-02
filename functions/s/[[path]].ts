export const onRequest: PagesFunction = async (context) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code Session</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    <h1>Claude Code Session</h1>

    <p><a href="/">← Create a new session</a></p>

    <div id="message"></div>
    <div id="session" class="session-content"></div>
  </div>

  <script>
    const sessionEl = document.getElementById('session');
    const messageEl = document.getElementById('message');

    async function loadSession() {
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id) {
        messageEl.innerHTML = '<div class="error">Invalid session ID</div>';
        return;
      }

      try {
        const response = await fetch(\`/api/sessions/\${id}\`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load session');
        }

        sessionEl.textContent = data.content;

        const date = new Date(data.createdAt);
        const dateStr = date.toLocaleString();
        messageEl.innerHTML = \`<p>Created: \${dateStr}</p>\`;
      } catch (error) {
        messageEl.innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
        sessionEl.style.display = 'none';
      }
    }

    loadSession();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
};
