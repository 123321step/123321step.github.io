# Matt Blog Studio Deployment

## Local run

```powershell
cd C:\Users\Administrator\Documents\blog-site
npm install
$env:BLOG_ADMIN_USERNAME="admin"
$env:BLOG_ADMIN_PASSWORD="replace-with-a-strong-password"
npm start
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/admin.html`

Default admin account in development:

- username: `admin`
- password: `admin123`

## Recommended free deployment path

This project now supports a Cloudflare deployment path using:

1. Cloudflare Workers
2. Cloudflare D1
3. Static assets from the `public/` directory

This path is recommended when you want:

- a free-first deployment
- no traditional server to manage
- a browser admin panel plus a hosted API

## Storage

There are now two storage modes:

1. Local Node mode:
   - SQLite file at `./data/blog.sqlite`
2. Cloudflare mode:
   - D1 database bound as `DB`

In both modes, the frontend still reads `/posts.js`.

## Cloudflare deployment checklist

1. Install Wrangler locally:
   - `npm install`
2. Log in to Cloudflare:
   - `npx wrangler login`
3. Create a D1 database:
   - `npx wrangler d1 create matt-blog-db`
4. Copy the returned `database_id` into `wrangler.toml`
5. Apply schema:
   - `npx wrangler d1 execute matt-blog-db --file=schema.sql`
6. Add your secret password:
   - `npx wrangler secret put BLOG_ADMIN_PASSWORD`
7. Optionally change username in `wrangler.toml`
8. Deploy:
   - `npx wrangler deploy`
9. Open `/admin.html`, log in, then click `导入现有文章`

## Before public production

Recommended next hardening steps:

1. If you want multiple editors, add a real users table with hashed passwords
2. Add CSRF protection for admin write actions
3. Add password hashing instead of plain env-var comparison
4. Add richer field validation and audit logging
