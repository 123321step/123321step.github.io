const postData = window.BLOG_POSTS || {};
const params = new URLSearchParams(window.location.search);
const postId = params.get("post");
const post = postData[postId];

const titleElement = document.querySelector("#article-title");
const categoryElement = document.querySelector("#article-category");
const metaElement = document.querySelector("#article-meta");
const introElement = document.querySelector("#article-intro");
const bodyElement = document.querySelector("#article-body");
const coverElement = document.querySelector("#article-cover");

if (!post) {
  document.title = "文章不存在 | 木舟博客";
  if (titleElement) {
    titleElement.textContent = "没有找到这篇文章";
  }
  if (introElement) {
    introElement.textContent = "你访问的文章可能还没创建，先返回首页看看其他内容吧。";
  }
  if (bodyElement) {
    bodyElement.innerHTML = '<p>可用做法：检查链接参数，或者回到首页重新点击文章卡片。</p>';
  }
} else {
  document.title = `${post.title} | 木舟博客`;
  if (categoryElement) {
    categoryElement.textContent = post.category;
  }
  if (titleElement) {
    titleElement.textContent = post.title;
  }
  if (metaElement) {
    metaElement.textContent = `${post.date} · 阅读 ${post.readingTime}`;
  }
  if (introElement) {
    introElement.textContent = post.intro;
  }
  if (coverElement) {
    coverElement.style.backgroundImage = `linear-gradient(135deg, rgba(84, 57, 44, 0.14), rgba(184, 92, 56, 0.32)), url("${post.heroImage}")`;
  }
  if (bodyElement) {
    bodyElement.innerHTML = post.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
  }
}
