const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const subscribeForm = document.querySelector("#subscribe-form");
const formNote = document.querySelector("#form-note");
const weatherTemp = document.querySelector("#weather-temp");
const weatherSummary = document.querySelector("#weather-summary");
const weatherDate = document.querySelector("#weather-date");
const weatherIcon = document.querySelector("#weather-icon");
const postGrid = document.querySelector("#post-grid");
const publishedCount = document.querySelector("#published-count");
const langButtons = document.querySelectorAll(".lang-switch__button");

const preferredLanguage = localStorage.getItem("blog-language") || "zh";
const postData = window.BLOG_POSTS || {};

const UI_TEXT = {
  zh: {
    title: "Matt的博客 | 记录灵感与生活",
    brand: "Matt的博客",
    navFeatured: "精选文章",
    navLatest: "最新文章",
    navTopics: "专题",
    navAbout: "关于我",
    navAdmin: "后台",
    heroEyebrow: "PERSONAL BLOG",
    heroTitle: "把日常思考，写成值得回看的文字。",
    heroText: "这里记录技术、设计、生活观察和创作灵感。希望每一篇文章，都像留给未来自己的明信片。",
    heroPrimary: "开始阅读",
    heroSecondary: "认识作者",
    statPosts: "原创文章",
    statReads: "月度阅读",
    statTopics: "核心专题",
    weatherLabel: "今日天气",
    weekPick: "本周推荐",
    heroCardTitle: "如何建立一个让人想读下去的个人博客？",
    heroCardText: "从内容定位、视觉氛围到更新节奏，聊聊一个博客真正吸引人的地方，不只是“能看”，而是“想回来”。",
    readFull: "阅读全文",
    featuredEyebrow: "FEATURED STORY",
    featuredTitle: "编辑精选",
    featuredMeta: "2026.03.25 · 阅读 8 分钟",
    featuredArticleTitle: "从“搭个页面”到“拥有作品感”：我的博客设计笔记",
    featuredArticleText1: "很多个人博客在技术上是完整的，但在气质上仍然像模板。真正有记忆点的页面，往往不是元素更多，而是有明确的节奏、留白和情绪。",
    featuredArticleText2: "这篇文章分享我如何用排版、色彩和内容组织，把一个普通博客首页打磨成更有温度的个人站点。",
    featuredButton: "进入文章详情",
    latestEyebrow: "LATEST POSTS",
    latestTitle: "最新文章",
    topicsEyebrow: "TOPICS",
    topicsTitle: "核心专题",
    topic1Title: "网页设计",
    topic1Text: "界面审美、结构布局、色彩体系和页面氛围的持续记录。",
    topic2Title: "前端实践",
    topic2Text: "关于 HTML、CSS、JavaScript 与实际项目体验的整理和复盘。",
    topic3Title: "个人成长",
    topic3Text: "写作习惯、学习方法、时间管理，以及创作过程中的思考。",
    topic4Title: "灵感收藏",
    topic4Text: "电影、书籍、摄影和日常片段里，那些值得保存的瞬间。",
    aboutEyebrow: "ABOUT THE AUTHOR",
    aboutTitle: "你好，我是这个博客的写作者。",
    aboutText: "我喜欢把抽象的想法写成清晰的文字，也喜欢把普通网页做得更耐看一些。这个博客既是内容主页，也是我持续创作的数字空间。",
    subscribeLabel: "订阅更新",
    subscribePlaceholder: "输入你的邮箱地址",
    subscribeButton: "订阅",
    subscribeNote: "每月推送 1-2 次精选文章，不会打扰你。",
    invalidEmail: "请输入有效邮箱后再订阅。",
    subscribed: (email) => `已收到 ${email}，这里先做前端演示，后续可以接入真实订阅服务。`,
    weatherLoading: "正在获取天气...",
    weatherUnavailable: "天气暂时不可用",
    currentLocation: "当前位置",
    fallbackLocation: "杭州",
    weatherLabels: {
      sunny: "晴朗",
      partly: "局部多云",
      cloudy: "阴天",
      rainy: "有雨",
      snowy: "有雪",
      stormy: "雷暴"
    },
    noPosts: "暂时还没有已发布文章。",
    dateOptions: { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Shanghai" }
  },
  en: {
    title: "Matt's Blog | Notes on Ideas and Everyday Life",
    brand: "Matt's Blog",
    navFeatured: "Featured",
    navLatest: "Latest",
    navTopics: "Topics",
    navAbout: "About",
    navAdmin: "Admin",
    heroEyebrow: "PERSONAL BLOG",
    heroTitle: "Turning everyday thoughts into words worth revisiting.",
    heroText: "This is where I write about technology, design, daily observations, and creative sparks. I want every post to feel like a postcard to my future self.",
    heroPrimary: "Start reading",
    heroSecondary: "Meet the author",
    statPosts: "Original posts",
    statReads: "Monthly reads",
    statTopics: "Core topics",
    weatherLabel: "TODAY'S WEATHER",
    weekPick: "Weekly Pick",
    heroCardTitle: "How do you build a personal blog people want to keep reading?",
    heroCardText: "From content positioning to visual atmosphere and publishing rhythm, this piece explores what makes a blog feel worth returning to.",
    readFull: "Read the full post",
    featuredEyebrow: "FEATURED STORY",
    featuredTitle: "Editor's Pick",
    featuredMeta: "2026.03.25 · Read 8 min",
    featuredArticleTitle: "From a Page to a Presence: Notes on Designing My Blog",
    featuredArticleText1: "Many personal blogs are technically complete, yet still feel like templates. Memorable pages are shaped less by more elements and more by rhythm, whitespace, and mood.",
    featuredArticleText2: "This article shares how I used typography, color, and content structure to turn an ordinary homepage into a warmer personal site.",
    featuredButton: "Open article",
    latestEyebrow: "LATEST POSTS",
    latestTitle: "Recent Posts",
    topicsEyebrow: "TOPICS",
    topicsTitle: "Core Topics",
    topic1Title: "Web Design",
    topic1Text: "Ongoing notes on visual taste, layout systems, color palettes, and page atmosphere.",
    topic2Title: "Frontend Practice",
    topic2Text: "Reflections on HTML, CSS, JavaScript, and what happens in real projects.",
    topic3Title: "Personal Growth",
    topic3Text: "Thoughts on writing habits, learning systems, time management, and creative work.",
    topic4Title: "Collected Inspiration",
    topic4Text: "Moments from films, books, photography, and daily life that are worth saving.",
    aboutEyebrow: "ABOUT THE AUTHOR",
    aboutTitle: "Hi, I'm the writer behind this blog.",
    aboutText: "I enjoy turning abstract ideas into clear writing, and I also love making everyday web pages feel more intentional. This blog is both a home for content and a space for ongoing creation.",
    subscribeLabel: "Subscribe",
    subscribePlaceholder: "Enter your email address",
    subscribeButton: "Subscribe",
    subscribeNote: "One or two curated emails per month, never spam.",
    invalidEmail: "Please enter a valid email address before subscribing.",
    subscribed: (email) => `Got ${email}. This is a front-end demo for now, and a real subscription service can be connected later.`,
    weatherLoading: "Fetching the weather...",
    weatherUnavailable: "Weather is unavailable right now",
    currentLocation: "Current location",
    fallbackLocation: "Hangzhou",
    weatherLabels: {
      sunny: "Sunny",
      partly: "Partly cloudy",
      cloudy: "Cloudy",
      rainy: "Rainy",
      snowy: "Snowy",
      stormy: "Stormy"
    },
    noPosts: "There are no published posts yet.",
    dateOptions: { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Shanghai" }
  }
};

const WEATHER_CODE_MAP = {
  0: "sunny",
  1: "partly",
  2: "partly",
  3: "cloudy",
  45: "cloudy",
  48: "cloudy",
  51: "rainy",
  53: "rainy",
  55: "rainy",
  56: "rainy",
  57: "rainy",
  61: "rainy",
  63: "rainy",
  65: "rainy",
  66: "rainy",
  67: "rainy",
  71: "snowy",
  73: "snowy",
  75: "snowy",
  77: "snowy",
  80: "rainy",
  81: "rainy",
  82: "rainy",
  85: "snowy",
  86: "snowy",
  95: "stormy",
  96: "stormy",
  99: "stormy"
};

function currentLanguage() {
  return localStorage.getItem("blog-language") || "zh";
}

function formatToday() {
  const lang = currentLanguage();
  const locale = lang === "en" ? "en-US" : "zh-CN";
  return new Intl.DateTimeFormat(locale, UI_TEXT[lang].dateOptions).format(new Date());
}

function getPublishedPosts() {
  return Object.entries(postData)
    .filter(([, post]) => post.status !== "draft")
    .sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")));
}

function renderPosts() {
  if (!postGrid) {
    return;
  }

  const lang = currentLanguage();
  const text = UI_TEXT[lang];
  const posts = getPublishedPosts();

  if (publishedCount) {
    publishedCount.textContent = String(posts.length);
  }

  if (!posts.length) {
    postGrid.innerHTML = `<article class="post-card"><div class="post-card-link"><h3>${text.noPosts}</h3></div></article>`;
    return;
  }

  postGrid.innerHTML = posts.map(([slug, post]) => {
    const category = post.category?.[lang] || "";
    const title = post.title?.[lang] || slug;
    const summary = post.homeSummary?.[lang] || post.intro?.[lang] || "";
    const reading = post.readingTime?.[lang] || "";
    const meta = `${post.date || ""} · ${reading}`;

    return `<article class="post-card">
      <a class="post-card-link" href="article.html?post=${slug}">
        <span class="post-category">${category}</span>
        <h3>${title}</h3>
        <p>${summary}</p>
        <div class="post-meta">${meta}</div>
      </a>
    </article>`;
  }).join("");
}

function renderWeather(state) {
  if (!weatherTemp || !weatherSummary || !weatherDate || !weatherIcon) {
    return;
  }

  weatherTemp.textContent = state.temp;
  weatherSummary.textContent = state.summary;
  weatherDate.textContent = state.date;
  weatherIcon.className = `weather-widget__icon weather-icon weather-icon--${state.icon}`;
}

async function fetchWeather(latitude, longitude, locationLabel) {
  const lang = currentLanguage();
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Asia%2FShanghai`
  );

  if (!response.ok) {
    throw new Error("weather request failed");
  }

  const data = await response.json();
  const current = data.current || {};
  const icon = WEATHER_CODE_MAP[current.weather_code] || "partly";
  const roundedTemp = typeof current.temperature_2m === "number" ? `${Math.round(current.temperature_2m)}°C` : "--°C";

  renderWeather({
    temp: roundedTemp,
    summary: `${locationLabel} · ${UI_TEXT[lang].weatherLabels[icon]}`,
    date: formatToday(),
    icon
  });
}

async function loadWeather() {
  if (!weatherTemp || !weatherSummary || !weatherDate || !weatherIcon) {
    return;
  }

  const lang = currentLanguage();
  const text = UI_TEXT[lang];

  renderWeather({
    temp: "--°C",
    summary: text.weatherLoading,
    date: formatToday(),
    icon: "sunny"
  });

  const fallback = () => fetchWeather(30.2741, 120.1551, text.fallbackLocation);

  if (!navigator.geolocation) {
    fallback().catch(() => {
      renderWeather({
        temp: "--°C",
        summary: text.weatherUnavailable,
        date: formatToday(),
        icon: "cloudy"
      });
    });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeather(position.coords.latitude, position.coords.longitude, text.currentLocation).catch(() => {
        fallback().catch(() => {
          renderWeather({
            temp: "--°C",
            summary: text.weatherUnavailable,
            date: formatToday(),
            icon: "cloudy"
          });
        });
      });
    },
    () => {
      fallback().catch(() => {
        renderWeather({
          temp: "--°C",
          summary: text.weatherUnavailable,
          date: formatToday(),
          icon: "cloudy"
        });
      });
    },
    { timeout: 5000 }
  );
}

function applyLanguage(lang) {
  const text = UI_TEXT[lang];
  document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  document.title = text.title;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (text[key]) {
      element.textContent = text[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (text[key]) {
      element.setAttribute("placeholder", text[key]);
    }
  });

  langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === lang);
  });

  renderPosts();
  loadWeather();
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

if (subscribeForm && formNote) {
  subscribeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = subscribeForm.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : "";
    const text = UI_TEXT[currentLanguage()];

    if (!email) {
      formNote.textContent = text.invalidEmail;
      formNote.classList.remove("success");
      return;
    }

    formNote.textContent = text.subscribed(email);
    formNote.classList.add("success");
    subscribeForm.reset();
  });
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang || "zh";
    localStorage.setItem("blog-language", lang);
    applyLanguage(lang);
  });
});

applyLanguage(preferredLanguage);
