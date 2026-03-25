const postData = window.BLOG_POSTS || {};
const params = new URLSearchParams(window.location.search);
const postId = params.get("post");
const post = postData[postId];
const langButtons = document.querySelectorAll(".lang-switch__button");

const titleElement = document.querySelector("#article-title");
const categoryElement = document.querySelector("#article-category");
const metaElement = document.querySelector("#article-meta");
const introElement = document.querySelector("#article-intro");
const bodyElement = document.querySelector("#article-body");
const coverElement = document.querySelector("#article-cover");

const ARTICLE_UI = {
  zh: {
    brand: "Matt的博客",
    backToList: "返回文章列表",
    backHome: "回到首页继续阅读",
    notFound: "没有找到这篇文章",
    notFoundIntro: "你访问的文章可能还没创建，先返回首页看看其他内容吧。",
    notFoundBody: "可用做法：检查链接参数，或者回到首页重新点击文章卡片。",
    readPrefix: "阅读 "
  },
  en: {
    brand: "Matt's Blog",
    backToList: "Back to posts",
    backHome: "Return to homepage",
    notFound: "This article could not be found",
    notFoundIntro: "The post may not exist yet. Head back to the homepage and explore other articles.",
    notFoundBody: "Try checking the URL parameter, or go back to the homepage and click a post card again.",
    readPrefix: "Read "
  }
};

function currentLanguage() {
  return localStorage.getItem("blog-language") || "zh";
}

function applyLanguageButtons(lang) {
  langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === lang);
  });
}

function translateStaticUi(lang) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (ARTICLE_UI[lang][key]) {
      element.textContent = ARTICLE_UI[lang][key];
    }
  });
}

function renderArticle(lang) {
  const ui = ARTICLE_UI[lang];
  document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  translateStaticUi(lang);
  applyLanguageButtons(lang);

  if (!post) {
    document.title = `${ui.notFound} | ${ui.brand}`;
    if (titleElement) {
      titleElement.textContent = ui.notFound;
    }
    if (introElement) {
      introElement.textContent = ui.notFoundIntro;
    }
    if (bodyElement) {
      bodyElement.innerHTML = `<p>${ui.notFoundBody}</p>`;
    }
    return;
  }

  document.title = `${post.title[lang]} | ${ui.brand}`;
  if (categoryElement) {
    categoryElement.textContent = post.category[lang];
  }
  if (titleElement) {
    titleElement.textContent = post.title[lang];
  }
  if (metaElement) {
    metaElement.textContent = `${post.date} · ${ui.readPrefix}${post.readingTime[lang]}`;
  }
  if (introElement) {
    introElement.textContent = post.intro[lang];
  }
  if (coverElement) {
    coverElement.style.backgroundImage = `linear-gradient(135deg, rgba(84, 57, 44, 0.14), rgba(184, 92, 56, 0.32)), url("${post.heroImage}")`;
  }
  if (bodyElement) {
    bodyElement.innerHTML = post.paragraphs[lang].map((paragraph) => `<p>${paragraph}</p>`).join("");
  }
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang || "zh";
    localStorage.setItem("blog-language", lang);
    renderArticle(lang);
  });
});

renderArticle(currentLanguage());
