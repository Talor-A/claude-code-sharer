import { Hono } from "hono";
import { renderer } from "./renderer";
import { validator } from "hono/validator";
import { D1Database, RateLimit } from "@cloudflare/workers-types";
import { logger } from "hono/logger";

type Env = {
  DB: D1Database;
  RATE_LIMITER: RateLimit;
};

const app = new Hono<{ Bindings: Env }>();

const SAMPLE_SESSION_ID = "i961tlt1";

app.use(logger());
app.use(renderer);

app.get("/", (c) => {
  return c.render(
    <div class="container">
      <h1>claudecode.link</h1>

      <h2>What is this?</h2>
      <p>
        This site allows you to share Claude Code sessions with others. Claude
        Code is Anthropic's official CLI tool for Claude, and this service makes
        it easy to share conversation traces for collaboration, debugging, or
        documentation purposes.
      </p>

      <p>
        <a class={"link-underline"} href={`/s/${SAMPLE_SESSION_ID}`}>
          See a sample upload
        </a>
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          In Claude Code, type{" "}
          <code
            style={{
              backgroundColor:
                "color-mix(in hsl, var(--border), var(--bg) 75%)",
            }}
          >
            /export
          </code>{" "}
          and choose "copy to clipboard"
        </li>
        <li>Paste your Claude Code session output below</li>
        <li>Click "Create Share Link" to upload it</li>
        <li>Get a unique shareable link</li>
        <li>Share the link with anyone - no login required</li>
      </ul>

      <h2>Privacy</h2>
      <p>
        Sessions are stored anonymously. Anyone with the link can view the
        session. Do not share sensitive information like API keys, passwords, or
        private data.
      </p>
      <p>Uploads expire after 30 days.</p>

      <h2>Paste your session</h2>
      <form method="post" action="/api/sessions">
        <textarea
          name="content"
          placeholder="type /export in claude code, then paste here"
          required
        ></textarea>
        <button type="submit">Create Share Link (expires in 30d)</button>
      </form>

      <footer style="margin-top: 40px; padding-top: 20px; text-align: center; font-size: 12px;">
        built by{" "}
        <a class={"link-underline"} href="https://taloranderson.com">
          talor
        </a>
      </footer>
    </div>,
  );
});

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.post(
  "/api/sessions",
  validator("form", (value, c) => {
    const MAX_CONTENT_LENGTH = 100_000;
    const content = value["content"];
    if (!content || typeof content !== "string") {
      return c.text("Invalid!", 400);
    }
    return {
      content: content.slice(0, MAX_CONTENT_LENGTH),
    };
  }),
  async (c) => {
    // Rate limit by IP address
    const clientIP = c.req.header("CF-Connecting-IP") || "unknown";
    const { success } = await c.env.RATE_LIMITER.limit({ key: clientIP });

    if (!success) {
      return c.text("Rate limit exceeded. Please try again later.", 429);
    }

    const { content } = c.req.valid("form");

    // Trim leading newlines but NOT leading whitespace
    const trimmedContent = content.replace(/^\n+/, "");

    const id = generateId();
    const createdAt = Date.now();

    await c.env.DB.prepare(
      "INSERT INTO sessions (id, content, created_at) VALUES (?, ?, ?)",
    )
      .bind(id, trimmedContent, createdAt)
      .run();

    return c.redirect(`/s/${id}`, 303);
  },
);

app.get("/s/:id", async (c) => {
  const { id } = c.req.param();

  const row = await c.env.DB.prepare(
    "SELECT content, created_at FROM sessions WHERE id = ?",
  )
    .bind(id)
    .first<{ content: string; created_at: number }>();

  if (!row) {
    return c.text("Session not found", 404);
  }

  // Check if session is older than 30 days (except for the sample session)
  if (id !== SAMPLE_SESSION_ID) {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - row.created_at > THIRTY_DAYS_MS) {
      return c.text("Session not found", 404);
    }
  }

  type MessageType = "text" | "user" | "assistant";
  interface Block {
    type: MessageType;
    content: string;
  }

  const { content: text, created_at } = row;

  const lines = text.split("\n");
  const blocks: Block[] = [];
  // type: 'text' | 'user' | 'assistant'
  function appendLastBlock(content: string) {
    if (blocks.length === 0) {
      blocks.push({ type: "text", content: content });
    } else {
      blocks[blocks.length - 1].content += "\n" + content;
    }
  }
  function startNewBlock(type: MessageType, content: string) {
    blocks.push({ type: type, content: content });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith(">")) {
      // User message
      startNewBlock("user", line);
    } else if (line.startsWith("⏺")) {
      // Assistant message
      startNewBlock("assistant", line);
    } else {
      // Continuation of previous block or new text block
      appendLastBlock(line);
    }
  }

  const classifyLine = (line: string) => {
    // Detect diff lines: "  23 +    code" or "  23 -    code"
    if (/^\s*\d+\s+\+/.test(line)) return "diff-add";
    if (/^\s*\d+\s+-/.test(line)) return "diff-remove";
    return "diff-context";
  };

  return c.render(
    <div class="container">
      <h1>
        claudecode.link<span class={"text-dim"}>/s/{id}</span>
      </h1>

      <p>
        <a href="/">← Create a new session</a>
      </p>

      <div id="message"></div>
      <div id="session" class="session-content">
        {blocks.map((block) => (
          <pre class={`event event-${block.type}`}>
            {block.content.split("\n").map((line) => {
              const lineClass = classifyLine(line);
              return <div class={lineClass}>{line}</div>;
            })}
          </pre>
        ))}
      </div>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 2px solid var(--border); text-align: center; font-size: 12px;">
        built by <a href="https://taloranderson.com">talor</a>
      </footer>
    </div>,
  );
});

export default app;
