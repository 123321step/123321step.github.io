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

## Recommended deployment path

This project is now a Node.js + Express app with a browser admin panel and SQLite storage.

Recommended hosting:

1. Railway
2. Render

Why Railway is the easier fit:

- It deploys Node.js apps directly from GitHub
- It supports environment variables in the dashboard
- It gives you a public domain quickly

## Storage

The backend now stores posts in a SQLite database file.

- Local default database path: `./data/blog.sqlite`
- You can override it with `BLOG_DATA_DIR`
- The server dynamically serves `/posts.js` from the database so the frontend still works with the same shape

## Railway deployment checklist

1. Push this project to GitHub
2. In Railway, choose `Deploy from GitHub repo`
3. Select this repository
4. Add environment variable:
   - `BLOG_ADMIN_USERNAME=admin`
   - `BLOG_ADMIN_PASSWORD=your-strong-password`
   - `BLOG_DATA_DIR=/opt/render/project/data`
5. Railway should detect Node.js automatically
6. Start command:
   - `npm start`
7. Generate a public domain in Railway settings

## Render deployment checklist

1. Create a new Web Service from your GitHub repo
2. Build command:
   - `npm install`
3. Start command:
   - `npm start`
4. Add environment variable:
   - `BLOG_ADMIN_USERNAME=admin`
   - `BLOG_ADMIN_PASSWORD=your-strong-password`
   - `BLOG_DATA_DIR=/opt/render/project/data`
5. Ensure the service uses the provided `PORT`

## Before public production

Recommended next hardening steps:

1. If you want multiple editors, add a real users table with hashed passwords
2. Add CSRF protection for admin write actions
3. Add HTTPS-only secure cookies behind a real deployment
4. If you outgrow SQLite, migrate posts to PostgreSQL
