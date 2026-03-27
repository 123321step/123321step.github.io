# Matt 博客源码与部署文档

## 1. 项目概述

本项目支持两种运行模式：

1. 本地模式
   - Node.js
   - Express
   - SQLite

2. 云端模式
   - Cloudflare Workers
   - Cloudflare D1
   - `public/` 目录作为静态资源

## 2. 项目目录结构

根目录：

`C:\Users\Administrator\Documents\blog-site`

主要文件：

```text
blog-site/
├─ public/
│  ├─ index.html
│  ├─ article.html
│  ├─ admin.html
│  ├─ script.js
│  ├─ article.js
│  ├─ admin.js
│  ├─ styles.css
│  └─ posts.seed.json
├─ src/
│  └─ worker.js
├─ server.js
├─ schema.sql
├─ wrangler.toml
├─ package.json
├─ posts.js
├─ index.html
├─ article.html
├─ admin.html
├─ script.js
├─ article.js
├─ admin.js
└─ styles.css
```

## 3. 关键文件说明

### 前台文件

- `public/index.html`
  - 首页模板
- `public/article.html`
  - 文章详情页模板
- `public/script.js`
  - 首页逻辑
- `public/article.js`
  - 文章详情逻辑
- `public/styles.css`
  - 全站样式

### 后台文件

- `public/admin.html`
  - 后台页面结构
- `public/admin.js`
  - 后台逻辑、登录、发布、删除、预览

### 云端后端

- `src/worker.js`
  - Cloudflare Worker 接口入口

### 本地后端

- `server.js`
  - 本地 Node/Express/SQLite 服务

### 配置文件

- `wrangler.toml`
  - Cloudflare 配置
- `schema.sql`
  - D1 数据库建表脚本
- `package.json`
  - npm 脚本和依赖

## 4. 数据是怎么工作的

### 前台

前台通过：

`/posts.js`

获取文章数据。

### 后台

后台发布文章时，会调用：

`PUT /api/posts/:slug`

写入数据库。

### 数据库存储

数据库中主要有 3 张表：

- `posts`
- `sessions`
- `login_attempts`

## 5. 文章数据结构

每篇文章结构大致如下：

```js
{
  title: { zh: "...", en: "..." },
  category: { zh: "...", en: "..." },
  date: "2026.03.27",
  status: "published",
  readingTime: { zh: "5 分钟", en: "5 min" },
  homeSummary: { zh: "...", en: "..." },
  heroImage: "https://...",
  intro: { zh: "...", en: "..." },
  paragraphs: {
    zh: ["第一段", "第二段"],
    en: ["First paragraph", "Second paragraph"]
  }
}
```

## 6. 后端校验规则

发布时会校验：

1. slug 只能是字母、数字、连字符
2. 中英文标题都必须有
3. 日期必须有
4. 中英文正文都必须有

## 7. 本地运行方法

### 第一步

```powershell
cd "C:\Users\Administrator\Documents\blog-site"
```

### 第二步

```powershell
npm install
```

### 第三步

```powershell
$env:BLOG_ADMIN_USERNAME="admin"
$env:BLOG_ADMIN_PASSWORD="你自己的强密码"
```

### 第四步

```powershell
npm start
```

### 第五步

打开：

- `http://localhost:3000/`
- `http://localhost:3000/admin.html`

## 8. Cloudflare 部署方法

### 8.1 安装依赖

```powershell
cd "C:\Users\Administrator\Documents\blog-site"
npm install
```

### 8.2 登录 Cloudflare

```powershell
npx wrangler login
```

### 8.3 创建 D1 数据库

```powershell
npx wrangler d1 create matt-blog-db
```

### 8.4 配置 `wrangler.toml`

把返回的 `database_id` 写到：

`wrangler.toml`

### 8.5 初始化数据库

```powershell
npx wrangler d1 execute matt-blog-db --remote --file=schema.sql
```

### 8.6 设置后台密码

```powershell
npx wrangler secret put BLOG_ADMIN_PASSWORD
```

### 8.7 部署

```powershell
npx wrangler deploy
```

## 9. 更新线上版本的方法

如果你改了下面这些文件：

- `public/*`
- `src/worker.js`
- `schema.sql`
- `wrangler.toml`

就要重新部署：

```powershell
npx wrangler deploy
```

## 10. GitHub 更新流程

```powershell
cd "C:\Users\Administrator\Documents\blog-site"
git add .
git commit -m "Update blog"
git push origin main
```

## 11. 当前线上地址

- 前台首页：`https://matt-blog-studio.mattblogstudio.workers.dev`
- 后台入口：`https://matt-blog-studio.mattblogstudio.workers.dev/admin.html`

## 12. 常见问题排查

### 后台打不开

1. 先确认访问的是 `/admin.html`
2. 按 `Ctrl + F5`
3. 如果本地已经改了文件但线上没变，重新执行：

```powershell
npx wrangler deploy
```

### 发布失败

优先检查：

1. 是否已登录
2. slug 是否合法
3. 中英文标题是否都填写
4. 中英文正文是否都填写

### 中国大陆打不开

因为当前使用的是 `workers.dev` 域名。

它在中国大陆访问不稳定，建议后续接入自定义域名。
