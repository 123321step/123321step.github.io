function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function text(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers
  });
}

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

function sessionCookie(token, ttlHours) {
  const maxAge = Number(ttlHours || 24) * 60 * 60;
  return `blog_admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return "blog_admin_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0";
}

async function getPostsMap(env) {
  const { results } = await env.DB.prepare("SELECT slug, data FROM posts ORDER BY date DESC, updated_at DESC").all();
  return results.reduce((acc, row) => {
    acc[row.slug] = JSON.parse(row.data);
    return acc;
  }, {});
}

async function getPostBySlug(env, slug) {
  const row = await env.DB.prepare("SELECT data FROM posts WHERE slug = ?").bind(slug).first();
  return row ? JSON.parse(row.data) : null;
}

async function upsertPost(env, slug, post) {
  const normalized = normalizePost(post);
  await env.DB.prepare(
    `INSERT INTO posts (slug, date, status, data, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET
       date = excluded.date,
       status = excluded.status,
       data = excluded.data,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(slug, normalized.date, normalized.status, JSON.stringify(normalized)).run();
}

async function deletePost(env, slug) {
  await env.DB.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
}

async function pruneExpiredSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(new Date().toISOString()).run();
}

async function createSession(env) {
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const ttlMs = Number(env.BLOG_SESSION_TTL_HOURS || 24) * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (token, username, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).bind(token, env.BLOG_ADMIN_USERNAME || "admin", expiresAt, new Date().toISOString()).run();
  return token;
}

async function sessionExists(env, token) {
  await pruneExpiredSessions(env);
  const row = await env.DB.prepare("SELECT token FROM sessions WHERE token = ?").bind(token).first();
  return Boolean(row);
}

async function deleteSession(env, token) {
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

function getClientIdentifier(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown";
}

async function isRateLimited(env, request) {
  const key = getClientIdentifier(request);
  const row = await env.DB.prepare("SELECT attempts, window_started_at FROM login_attempts WHERE client_key = ?").bind(key).first();
  if (!row) {
    return false;
  }
  const windowMs = Number(env.BLOG_LOGIN_WINDOW_MINUTES || 15) * 60 * 1000;
  const maxAttempts = Number(env.BLOG_LOGIN_MAX_ATTEMPTS || 8);
  const started = new Date(row.window_started_at).getTime();
  if (Date.now() - started >= windowMs) {
    await env.DB.prepare("DELETE FROM login_attempts WHERE client_key = ?").bind(key).run();
    return false;
  }
  return Number(row.attempts) >= maxAttempts;
}

async function recordFailedLogin(env, request) {
  const key = getClientIdentifier(request);
  const now = new Date().toISOString();
  const row = await env.DB.prepare("SELECT attempts, window_started_at FROM login_attempts WHERE client_key = ?").bind(key).first();
  const windowMs = Number(env.BLOG_LOGIN_WINDOW_MINUTES || 15) * 60 * 1000;

  if (!row) {
    await env.DB.prepare("INSERT INTO login_attempts (client_key, attempts, window_started_at) VALUES (?, 1, ?)").bind(key, now).run();
    return;
  }

  const started = new Date(row.window_started_at).getTime();
  if (Date.now() - started >= windowMs) {
    await env.DB.prepare("UPDATE login_attempts SET attempts = 1, window_started_at = ? WHERE client_key = ?").bind(now, key).run();
    return;
  }

  await env.DB.prepare("UPDATE login_attempts SET attempts = attempts + 1 WHERE client_key = ?").bind(key).run();
}

async function clearFailedLogin(env, request) {
  const key = getClientIdentifier(request);
  await env.DB.prepare("DELETE FROM login_attempts WHERE client_key = ?").bind(key).run();
}

async function requireAuth(env, request) {
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const token = cookies.blog_admin_session;
  return token ? sessionExists(env, token) : false;
}

async function bootstrapSeedData(env, request) {
  const postsRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first();
  if (Number(postsRow?.count || 0) > 0) {
    return json({ ok: true, imported: 0, skipped: true });
  }

  const seedResponse = await env.ASSETS.fetch(new Request(new URL("/posts.seed.json", request.url)));
  const seedPosts = await seedResponse.json();
  for (const [slug, post] of Object.entries(seedPosts)) {
    await upsertPost(env, slug, post);
  }
  return json({ ok: true, imported: Object.keys(seedPosts).length });
}

async function ensureSeedData(env, request) {
  const postsRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first();
  if (Number(postsRow?.count || 0) > 0) {
    return;
  }

  const seedResponse = await env.ASSETS.fetch(new Request(new URL("/posts.seed.json", request.url)));
  const seedPosts = await seedResponse.json();
  for (const [slug, post] of Object.entries(seedPosts)) {
    await upsertPost(env, slug, post);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first();
      return json({ ok: true, service: "matt-blog-studio", storage: "d1", posts: Number(row?.count || 0) });
    }

    if (url.pathname === "/api/auth/status" && request.method === "GET") {
      const cookies = parseCookies(request.headers.get("cookie") || "");
      const authenticated = cookies.blog_admin_session ? await sessionExists(env, cookies.blog_admin_session) : false;
      return json({ authenticated });
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      if (await isRateLimited(env, request)) {
        return json({ error: "Too many login attempts. Please try again later." }, 429);
      }
      const body = await request.json().catch(() => ({}));
      if (body.username !== (env.BLOG_ADMIN_USERNAME || "admin") || body.password !== env.BLOG_ADMIN_PASSWORD) {
        await recordFailedLogin(env, request);
        return json({ error: "Username or password incorrect" }, 401);
      }
      await clearFailedLogin(env, request);
      const token = await createSession(env);
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token, env.BLOG_SESSION_TTL_HOURS) });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookies = parseCookies(request.headers.get("cookie") || "");
      if (cookies.blog_admin_session) {
        await deleteSession(env, cookies.blog_admin_session);
      }
      return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
    }

    if (url.pathname === "/api/admin/bootstrap" && request.method === "POST") {
      if (!(await requireAuth(env, request))) {
        return json({ error: "Unauthorized" }, 401);
      }
      return bootstrapSeedData(env, request);
    }

    if (url.pathname === "/api/posts" && request.method === "GET") {
      await ensureSeedData(env, request);
      return json(await getPostsMap(env));
    }

    if (url.pathname.startsWith("/api/posts/")) {
      const slug = decodeURIComponent(url.pathname.slice("/api/posts/".length));

      if (request.method === "GET") {
        await ensureSeedData(env, request);
        const post = await getPostBySlug(env, slug);
        return post ? json(post) : json({ error: "Post not found" }, 404);
      }

      if (!(await requireAuth(env, request))) {
        return json({ error: "Unauthorized" }, 401);
      }

      if (request.method === "PUT") {
        const body = await request.json().catch(() => null);
        const error = validatePostPayload(slug, body);
        if (error) {
          return json({ error }, 400);
        }
        await upsertPost(env, slug, body);
        return json({ ok: true });
      }

      if (request.method === "DELETE") {
        await deletePost(env, slug);
        return json({ ok: true });
      }
    }

    if (url.pathname === "/posts.js" && request.method === "GET") {
      await ensureSeedData(env, request);
      return text(serializePosts(await getPostsMap(env)), 200, { "content-type": "application/javascript; charset=utf-8" });
    }

    return env.ASSETS.fetch(request);
  }
};
