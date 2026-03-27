# Matt Blog Studio

一个包含前台博客、后台工作台和云端发布能力的个人博客项目。

当前线上地址：

- 前台首页：`https://matt-blog-studio.mattblogstudio.workers.dev`
- 后台入口：`https://matt-blog-studio.mattblogstudio.workers.dev/admin.html`

## 功能概览

- 前台博客首页
- 文章详情页
- 中英文内容支持
- 后台登录
- 新建 / 编辑 / 删除文章
- 草稿 / 已发布状态
- 实时预览
- 发布到云端数据库
- Cloudflare Workers + D1 免费部署

## 文档入口

如果你想完整了解这个项目，按下面顺序看：

1. 使用手册：
   `USER_MANUAL.md`
2. 源码与部署文档：
   `SOURCE_AND_DEPLOYMENT_GUIDE.md`
3. 快速部署摘要：
   `DEPLOY.md`

## 项目结构

```text
blog-site/
├─ public/                     # Cloudflare 静态资源
│  ├─ index.html              # 首页
│  ├─ article.html            # 文章详情页
│  ├─ admin.html              # 后台页
│  ├─ script.js               # 首页脚本
│  ├─ article.js              # 文章页脚本
│  ├─ admin.js                # 后台脚本
│  ├─ styles.css              # 全站样式
│  └─ posts.seed.json         # 初始文章种子
├─ src/
│  └─ worker.js               # Cloudflare Worker 后端
├─ server.js                  # 本地 Node/Express 后端
├─ schema.sql                 # D1 建表脚本
├─ wrangler.toml              # Cloudflare 配置
├─ USER_MANUAL.md             # 日常使用手册
├─ SOURCE_AND_DEPLOYMENT_GUIDE.md
├─ DEPLOY.md                  # 快速部署摘要
└─ README.md                  # 项目首页说明
```

## 日常使用

### 登录后台

打开：

`/admin.html`

输入：

- 用户名：`admin`
- 密码：你设置的后台密码

### 发布文章

1. 填写文章内容
2. `slug` 使用英文、数字、`-`
3. 状态改成 `published`
4. 点击 `发布到云端`
5. 刷新首页查看效果

## 本地运行

```powershell
cd "C:\Users\Administrator\Documents\blog-site"
npm install
$env:BLOG_ADMIN_USERNAME="admin"
$env:BLOG_ADMIN_PASSWORD="你的密码"
npm start
```

打开：

- `http://localhost:3000/`
- `http://localhost:3000/admin.html`

## Cloudflare 部署

### 1. 登录

```powershell
npx wrangler login
```

### 2. 创建 D1 数据库

```powershell
npx wrangler d1 create matt-blog-db
```

### 3. 初始化表

```powershell
npx wrangler d1 execute matt-blog-db --remote --file=schema.sql
```

### 4. 设置后台密码

```powershell
npx wrangler secret put BLOG_ADMIN_PASSWORD
```

### 5. 部署

```powershell
npx wrangler deploy
```

## 重新部署场景

如果你修改了这些文件，需要重新部署：

- `public/*`
- `src/worker.js`
- `schema.sql`
- `wrangler.toml`

命令：

```powershell
npx wrangler deploy
```

## 注意事项

- 当前线上使用的是 `workers.dev` 域名
- 这个域名在中国大陆访问不稳定
- 如果你要长期服务中国大陆用户，建议后续接入自定义域名

## 常见问题

### 后台打不开

1. 确认打开的是 `/admin.html`
2. 按 `Ctrl + F5`
3. 如果本地改过代码但线上没更新，重新执行：

```powershell
npx wrangler deploy
```

### 发布失败

优先检查：

- 是否已登录
- slug 是否合法
- 中英文标题是否都填写
- 中英文正文是否都填写

### 首页没显示新文章

优先检查：

- 状态是否为 `published`
- 是否发布成功
- 是否刷新了首页
