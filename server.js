const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const LEGACY_POSTS_FILE = path.join(ROOT_DIR, "posts.js");
const STORAGE_DIR = process.env.BLOG_DATA_DIR || path.join(ROOT_DIR, "data");
const DB_FILE = path.join(STORAGE_DIR, "blog.sqlite");
const ADMIN_USERNAME = process.env.BLOG_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD || "admin123";
const SESSION_TTL_MS = Number(process.env.BLOG_SESSION_TTL_HOURS || 24) * 60 * 60 * 1000;
const COOKIE_SECURE = process.env.BLOG_COOKIE_SECURE === "true";
const LOGIN_WINDOW_MS = Number(process.env.BLOG_LOGIN_WINDOW_MINUTES || 15) * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = Number(process.env.BLOG_LOGIN_MAX_ATTEMPTS || 8);

let db;
const loginAttempts = new Map();

app.use(express.json({ limit: "10mb" }));

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...rest] = part.split("=");
      acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

function sessionCookie(token) {
  const securePart = COOKIE_SECURE ? "; Secure" : "";
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `blog_admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${securePart}`;
}

function clearSessionCookie() {
  const securePart = COOKIE_SECURE ? "; Secure" : "";
  return `blog_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`;
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

async function readLegacyPosts() {
  const text = await fs.readFile(LEGACY_POSTS_FILE, "utf8");
  const sandboxWindow = {};
  const loader = new Function("window", `${text}; return window.BLOG_POSTS;`);
  return loader(sandboxWindow) || {};
}

function serializeValue(value, indentLevel) {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (!value.length) {
      return "[]";
    }
    return `[\n${value.map((item) => `${nextIndent}${serializeValue(item, indentLevel + 1)}`).join(",\n")}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) {
      return "{}";
    }
    return `{\n${entries.map(([key, item]) => `${nextIndent}${key}: ${serializeValue(item, indentLevel + 1)}`).join(",\n")}\n${indent}}`;
  }

  return JSON.stringify(value);
}

function serializePosts(posts) {
  const entries = Object.entries(posts).sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")));
  return `window.BLOG_POSTS = {\n${entries.map(([slug, post]) => `  "${slug}": ${serializeValue(post, 1)}`).join(",\n")}\n};\n`;
}

function normalizePost(post) {
  return {
    title: {
      zh: String(post.title?.zh || "").trim(),
      en: String(post.title?.en || "").trim()
    },
    category: {
      zh: String(post.category?.zh || "").trim(),
      en: String(post.category?.en || "").trim()
    },
    date: String(post.date || "").trim(),
    status: post.status === "published" ? "published" : "draft",
    readingTime: {
      zh: String(post.readingTime?.zh || "").trim(),
      en: String(post.readingTime?.en || "").trim()
    },
    homeSummary: {
      zh: String(post.homeSummary?.zh || "").trim(),
      en: String(post.homeSummary?.en || "").trim()
    },
    heroImage: String(post.heroImage || "").trim(),
    intro: {
      zh: String(post.intro?.zh || "").trim(),
      en: String(post.intro?.en || "").trim()
    },
    paragraphs: {
      zh: Array.isArray(post.paragraphs?.zh) ? post.paragraphs.zh.map((item) => String(item).trim()).filter(Boolean) : [],
      en: Array.isArray(post.paragraphs?.en) ? post.paragraphs.en.map((item) => String(item).trim()).filter(Boolean) : []
    }
  };
}

function validatePostPayload(slug, payload) {
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return "Slug must use letters, numbers, or hyphens only.";
  }
  if (!payload || typeof payload !== "object") {
    return "Post payload is missing.";
  }
  const post = normalizePost(payload);
  if (!post.title.zh || !post.title.en) {
    return "Both Chinese and English titles are required.";
  }
  if (!post.date) {
    return "Date is required.";
  }
  if (!post.paragraphs.zh.length || !post.paragraphs.en.length) {
    return "Both Chinese and English paragraphs are required.";
  }
  return null;
}

async function getPostsMap() {
  const rows = await dbAll("SELECT slug, data FROM posts ORDER BY date DESC, updated_at DESC");
  return rows.reduce((acc, row) => {
    acc[row.slug] = JSON.parse(row.data);
    return acc;
  }, {});
}

async function getPostBySlug(slug) {
  const row = await dbGet("SELECT data FROM posts WHERE slug = ?", [slug]);
  return row ? JSON.parse(row.data) : null;
}

async function upsertPost(slug, post) {
  const normalized = normalizePost(post);
  await dbRun(
    `INSERT INTO posts (slug, date, status, data, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET
       date = excluded.date,
       status = excluded.status,
       data = excluded.data,
       updated_at = CURRENT_TIMESTAMP`,
    [slug, normalized.date, normalized.status, JSON.stringify(normalized)]
  );
}

async function deletePost(slug) {
  await dbRun("DELETE FROM posts WHERE slug = ?", [slug]);
}

async function pruneExpiredSessions() {
  await dbRun("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP");
}

async function createSession() {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await dbRun(
    "INSERT INTO sessions (token, username, expires_at, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
    [token, ADMIN_USERNAME, expiresAt]
  );
  return token;
}

async function deleteSession(token) {
  await dbRun("DELETE FROM sessions WHERE token = ?", [token]);
}

async function sessionExists(token) {
  await pruneExpiredSessions();
  const row = await dbGet("SELECT token FROM sessions WHERE token = ?", [token]);
  return Boolean(row);
}

function getClientIdentifier(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const key = getClientIdentifier(req);
  const now = Date.now();
  const attempts = loginAttempts.get(key) || [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < LOGIN_WINDOW_MS);
  loginAttempts.set(key, recentAttempts);
  return recentAttempts.length >= LOGIN_MAX_ATTEMPTS;
}

function recordFailedLogin(req) {
  const key = getClientIdentifier(req);
  const now = Date.now();
  const attempts = loginAttempts.get(key) || [];
  attempts.push(now);
  loginAttempts.set(key, attempts);
}

function clearFailedLogins(req) {
  loginAttempts.delete(getClientIdentifier(req));
}

async function initializeDatabase() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  db = new sqlite3.Database(DB_FILE);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      date TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const row = await dbGet("SELECT COUNT(*) AS count FROM posts");
  if (row && row.count > 0) {
    return;
  }

  const legacyPosts = await readLegacyPosts();
  for (const [slug, post] of Object.entries(legacyPosts)) {
    await upsertPost(slug, post);
  }
}

async function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["blog_admin_session"];
  if (!token || !(await sessionExists(token))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/api/health", async (req, res) => {
  const row = await dbGet("SELECT COUNT(*) AS count FROM posts");
  res.json({ ok: true, service: "matt-blog-studio", storage: "sqlite", posts: row?.count || 0 });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (isRateLimited(req)) {
    res.status(429).json({ error: "Too many login attempts. Please try again later." });
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    recordFailedLogin(req);
    res.status(401).json({ error: "Username or password incorrect" });
    return;
  }

  clearFailedLogins(req);
  const token = await createSession();
  res.setHeader("Set-Cookie", sessionCookie(token));
  res.json({ ok: true });
});

app.post("/api/auth/logout", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["blog_admin_session"];
  if (token) {
    await deleteSession(token);
  }
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.json({ ok: true });
});

app.get("/api/auth/status", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["blog_admin_session"];
  res.json({ authenticated: Boolean(token && (await sessionExists(token))) });
});

app.get("/api/posts", async (req, res) => {
  try {
    res.json(await getPostsMap());
  } catch {
    res.status(500).json({ error: "Failed to read posts" });
  }
});

app.get("/api/posts/:slug", async (req, res) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(post);
  } catch {
    res.status(500).json({ error: "Failed to read post" });
  }
});

app.put("/api/posts/:slug", requireAuth, async (req, res) => {
  try {
    const slug = req.params.slug;
    const validationError = validatePostPayload(slug, req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    await upsertPost(slug, req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to save post" });
  }
});

app.delete("/api/posts/:slug", requireAuth, async (req, res) => {
  try {
    await deletePost(req.params.slug);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.get("/posts.js", async (req, res) => {
  try {
    res.type("application/javascript").send(serializePosts(await getPostsMap()));
  } catch {
    res.status(500).type("application/javascript").send("window.BLOG_POSTS = {};\n");
  }
});

app.use(express.static(ROOT_DIR));

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Matt blog studio running at http://localhost:${PORT}`);
      console.log(`SQLite database: ${DB_FILE}`);
      console.log(`Admin username: ${ADMIN_USERNAME}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
