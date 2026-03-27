# Matt Blog Studio Deployment

详细文档请优先查看：

- `USER_MANUAL.md`
- `SOURCE_AND_DEPLOYMENT_GUIDE.md`

这份文件保留为快速部署摘要。

## 1. 本地运行

```powershell
cd "C:\Users\Administrator\Documents\blog-site"
npm install
$env:BLOG_ADMIN_USERNAME="admin"
$env:BLOG_ADMIN_PASSWORD="replace-with-a-strong-password"
npm start
```

打开：

- `http://localhost:3000/`
- `http://localhost:3000/admin.html`

## 2. Cloudflare 免费部署

### 安装依赖

```powershell
cd "C:\Users\Administrator\Documents\blog-site"
npm install
```

### 登录 Cloudflare

```powershell
npx wrangler login
```

### 创建 D1 数据库

```powershell
npx wrangler d1 create matt-blog-db
```

### 初始化数据库

```powershell
npx wrangler d1 execute matt-blog-db --remote --file=schema.sql
```

### 设置后台密码

```powershell
npx wrangler secret put BLOG_ADMIN_PASSWORD
```

### 部署

```powershell
npx wrangler deploy
```

## 3. 更新线上版本

只要你修改了下面这些内容，就需要重新部署：

- `public/*`
- `src/worker.js`
- `schema.sql`
- `wrangler.toml`

重新部署命令：

```powershell
npx wrangler deploy
```

## 4. 当前线上地址

- 前台首页：`https://matt-blog-studio.mattblogstudio.workers.dev`
- 后台入口：`https://matt-blog-studio.mattblogstudio.workers.dev/admin.html`

## 5. 注意

当前使用的是 `workers.dev` 域名。

这类域名在中国大陆访问不稳定。如果你要给中国大陆用户稳定访问，建议后续接入自定义域名并规划更适合大陆访问的部署方式。
