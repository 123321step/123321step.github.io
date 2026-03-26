const editorForm = document.querySelector("#editor-form");
const selector = document.querySelector("#post-selector");
const resetButton = document.querySelector("#reset-form");
const clearDraftButton = document.querySelector("#clear-draft");
const bindPostsFileButton = document.querySelector("#bind-posts-file");
const publishButton = document.querySelector("#publish-post");
const deleteButton = document.querySelector("#delete-post");
const copyButton = document.querySelector("#copy-output");
const exportButton = document.querySelector("#export-output");
const copyCardButton = document.querySelector("#copy-card-output");
const newPostButton = document.querySelector("#new-post");
const searchInput = document.querySelector("#post-search");
const postList = document.querySelector("#post-list");
const fileStatus = document.querySelector("#file-status");
const copyNote = document.querySelector("#copy-note");
const cardNote = document.querySelector("#card-note");
const draftStatus = document.querySelector("#draft-status");
const authStatus = document.querySelector("#auth-status");
const usernameInput = document.querySelector("#admin-username");
const passwordInput = document.querySelector("#admin-password");
const loginButton = document.querySelector("#login-button");
const bootstrapButton = document.querySelector("#bootstrap-button");
const logoutButton = document.querySelector("#logout-button");
const output = document.querySelector("#generated-output");
const cardOutput = document.querySelector("#card-output");
const previewButtons = document.querySelectorAll("[data-preview-lang]");
const heroUploadInput = document.querySelector("#hero-upload");
const imageNote = document.querySelector("#image-note");
const sidebarTotal = document.querySelector("#sidebar-total");
const sidebarPublished = document.querySelector("#sidebar-published");
const sidebarDraft = document.querySelector("#sidebar-draft");

const previewTitle = document.querySelector("#preview-title");
const previewCategory = document.querySelector("#preview-category");
const previewMeta = document.querySelector("#preview-meta");
const previewIntro = document.querySelector("#preview-intro");
const previewBody = document.querySelector("#preview-body");
const previewCover = document.querySelector("#preview-cover");

const DRAFT_STORAGE_KEY = "matt-blog-admin-draft";
const initialPosts = window.BLOG_POSTS || {};
let postsCache = structuredClone(initialPosts);
let postsFileHandle = null;
let previewLanguage = "zh";
let saveTimer = null;
let activeSlug = "";
let backendAvailable = false;
let backendAuthenticated = false;

const DEFAULT_DRAFT = {
  slug: "new-post-demo",
  date: "2026.03.26",
  status: "draft",
  heroImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=80",
  titleZh: "新文章标题示例",
  titleEn: "Sample Title for a New Article",
  categoryZh: "创作记录",
  categoryEn: "Creative Notes",
  readingZh: "5 分钟",
  readingEn: "5 min",
  homeSummaryZh: "这里填写首页文章卡片要显示的短摘要。",
  homeSummaryEn: "Write the short homepage summary used in the article card.",
  introZh: "这里填写文章导语，预览区会立刻更新。",
  introEn: "Write the English intro here and the preview will update instantly.",
  paragraphsZh: "第一段内容。\n\n第二段内容。\n\n第三段内容。",
  paragraphsEn: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
};

function paragraphTextToArray(text) {
  return text
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeForTemplate(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getFormState() {
  const formData = new FormData(editorForm);
  return {
    slug: String(formData.get("slug") || "").trim(),
    date: String(formData.get("date") || "").trim(),
    status: String(formData.get("status") || "draft").trim(),
    heroImage: String(formData.get("heroImage") || "").trim(),
    titleZh: String(formData.get("titleZh") || "").trim(),
    titleEn: String(formData.get("titleEn") || "").trim(),
    categoryZh: String(formData.get("categoryZh") || "").trim(),
    categoryEn: String(formData.get("categoryEn") || "").trim(),
    readingZh: String(formData.get("readingZh") || "").trim(),
    readingEn: String(formData.get("readingEn") || "").trim(),
    homeSummaryZh: String(formData.get("homeSummaryZh") || "").trim(),
    homeSummaryEn: String(formData.get("homeSummaryEn") || "").trim(),
    introZh: String(formData.get("introZh") || "").trim(),
    introEn: String(formData.get("introEn") || "").trim(),
    paragraphsZh: String(formData.get("paragraphsZh") || "").trim(),
    paragraphsEn: String(formData.get("paragraphsEn") || "").trim()
  };
}

function stateToPost(state) {
  return {
    title: { zh: state.titleZh, en: state.titleEn },
    category: { zh: state.categoryZh, en: state.categoryEn },
    date: state.date,
    status: state.status,
    readingTime: { zh: state.readingZh, en: state.readingEn },
    homeSummary: { zh: state.homeSummaryZh, en: state.homeSummaryEn },
    heroImage: state.heroImage,
    intro: { zh: state.introZh, en: state.introEn },
    paragraphs: {
      zh: paragraphTextToArray(state.paragraphsZh),
      en: paragraphTextToArray(state.paragraphsEn)
    }
  };
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

function serializePostsFile(posts) {
  const entries = Object.entries(posts).sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")));
  return `window.BLOG_POSTS = {\n${entries.map(([slug, post]) => `  "${slug}": ${serializeValue(post, 1)}`).join(",\n")}\n};\n`;
}

function buildGeneratedObject(state) {
  return `  "${escapeForTemplate(state.slug)}": ${serializeValue(stateToPost(state), 2)},`;
}

function buildHomepageCardSnippet(state) {
  return `<article class="post-card">
  <a class="post-card-link" href="article.html?post=${escapeForTemplate(state.slug)}">
    <span class="post-category">${escapeForTemplate(state.categoryZh)}</span>
    <h3>${escapeForTemplate(state.titleZh)}</h3>
    <p>${escapeForTemplate(state.homeSummaryZh)}</p>
    <div class="post-meta">${escapeForTemplate(state.date)} · ${escapeForTemplate(state.readingZh)}</div>
  </a>
</article>`;
}

function renderPreview(state) {
  const isZh = previewLanguage === "zh";
  const title = isZh ? state.titleZh : state.titleEn;
  const category = isZh ? state.categoryZh : state.categoryEn;
  const reading = isZh ? state.readingZh : state.readingEn;
  const intro = isZh ? state.introZh : state.introEn;
  const paragraphs = paragraphTextToArray(isZh ? state.paragraphsZh : state.paragraphsEn);

  previewTitle.textContent = title || (isZh ? "未填写标题" : "Untitled draft");
  previewCategory.textContent = category || (isZh ? "未分类" : "Uncategorized");
  previewMeta.textContent = `${state.date || "----.--.--"} · ${isZh ? "阅读 " : "Read "}${reading || "--"}`;
  previewIntro.textContent = intro || (isZh ? "这里会显示文章导语。" : "The article intro will appear here.");
  previewBody.innerHTML = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
  previewCover.style.backgroundImage = state.heroImage
    ? `linear-gradient(135deg, rgba(84, 57, 44, 0.14), rgba(184, 92, 56, 0.32)), url("${state.heroImage}")`
    : "linear-gradient(135deg, rgba(84, 57, 44, 0.14), rgba(184, 92, 56, 0.32))";
}

function renderOutput(state) {
  output.textContent = buildGeneratedObject(state);
  cardOutput.textContent = buildHomepageCardSnippet(state);
}

function renderSelectorOptions() {
  selector.innerHTML = '<option value="">新建文章草稿</option>';
  Object.entries(postsCache)
    .sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")))
    .forEach(([slug, post]) => {
      const option = document.createElement("option");
      option.value = slug;
      option.textContent = `${slug} · ${post.title?.zh || slug}`;
      selector.appendChild(option);
    });
  selector.value = activeSlug;
}

function renderSidebarList() {
  const keyword = (searchInput.value || "").trim().toLowerCase();
  const entries = Object.entries(postsCache)
    .sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")))
    .filter(([slug, post]) => {
      if (!keyword) {
        return true;
      }
      const source = `${slug} ${post.title?.zh || ""} ${post.title?.en || ""}`.toLowerCase();
      return source.includes(keyword);
    });

  sidebarTotal.textContent = String(Object.keys(postsCache).length);
  sidebarPublished.textContent = String(Object.values(postsCache).filter((post) => post.status !== "draft").length);
  sidebarDraft.textContent = String(Object.values(postsCache).filter((post) => post.status === "draft").length);

  if (!entries.length) {
    postList.innerHTML = '<div class="admin-list__empty">没有匹配的文章。</div>';
    return;
  }

  postList.innerHTML = entries.map(([slug, post]) => {
    const isActive = slug === activeSlug ? " is-active" : "";
    const badge = post.status === "draft" ? "草稿" : "已发布";
    return `<button class="admin-list__item${isActive}" type="button" data-slug="${slug}">
      <strong>${post.title?.zh || slug}</strong>
      <span>${slug}</span>
      <em>${post.date || "--"} · ${badge}</em>
    </button>`;
  }).join("");

  postList.querySelectorAll("[data-slug]").forEach((button) => {
    button.addEventListener("click", () => loadPostIntoForm(button.dataset.slug || ""));
  });
}

function updateFileStatus(message, success = true) {
  fileStatus.textContent = message;
  fileStatus.classList.toggle("success", success);
}

function updateAuthStatus(message, success = true) {
  authStatus.textContent = message;
  authStatus.classList.toggle("success", success);
}

function saveDraft(state) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
  draftStatus.textContent = `草稿已自动保存：${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  draftStatus.classList.add("success");
}

function scheduleDraftSave() {
  const state = getFormState();
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveDraft(state), 250);
}

function loadSavedDraft() {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function syncAll() {
  const state = getFormState();
  activeSlug = state.slug;
  renderPreview(state);
  renderOutput(state);
  renderSelectorOptions();
  renderSidebarList();
}

function fillForm(draft) {
  editorForm.elements.slug.value = draft.slug;
  editorForm.elements.date.value = draft.date;
  editorForm.elements.status.value = draft.status || "draft";
  editorForm.elements.heroImage.value = draft.heroImage;
  editorForm.elements.titleZh.value = draft.titleZh;
  editorForm.elements.titleEn.value = draft.titleEn;
  editorForm.elements.categoryZh.value = draft.categoryZh;
  editorForm.elements.categoryEn.value = draft.categoryEn;
  editorForm.elements.readingZh.value = draft.readingZh;
  editorForm.elements.readingEn.value = draft.readingEn;
  editorForm.elements.homeSummaryZh.value = draft.homeSummaryZh || "";
  editorForm.elements.homeSummaryEn.value = draft.homeSummaryEn || "";
  editorForm.elements.introZh.value = draft.introZh;
  editorForm.elements.introEn.value = draft.introEn;
  editorForm.elements.paragraphsZh.value = draft.paragraphsZh;
  editorForm.elements.paragraphsEn.value = draft.paragraphsEn;
  activeSlug = draft.slug;
  syncAll();
}

function postToDraft(slug, post) {
  return {
    slug,
    date: post.date || "",
    status: post.status || "published",
    heroImage: post.heroImage || "",
    titleZh: post.title?.zh || "",
    titleEn: post.title?.en || "",
    categoryZh: post.category?.zh || "",
    categoryEn: post.category?.en || "",
    readingZh: post.readingTime?.zh || "",
    readingEn: post.readingTime?.en || "",
    homeSummaryZh: post.homeSummary?.zh || "",
    homeSummaryEn: post.homeSummary?.en || "",
    introZh: post.intro?.zh || "",
    introEn: post.intro?.en || "",
    paragraphsZh: (post.paragraphs?.zh || []).join("\n\n"),
    paragraphsEn: (post.paragraphs?.en || []).join("\n\n")
  };
}

function loadPostIntoForm(slug) {
  const post = postsCache[slug];
  if (!post) {
    return;
  }
  fillForm(postToDraft(slug, post));
}

async function choosePostsFile() {
  if (!window.showOpenFilePicker) {
    throw new Error("File System Access API unavailable");
  }
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    suggestedName: "posts.js",
    types: [{ description: "JavaScript files", accept: { "text/javascript": [".js"] } }]
  });
  postsFileHandle = handle;
  updateFileStatus(`已绑定本地文件：${handle.name}`);
  return handle;
}

async function ensurePostsFileHandle() {
  if (postsFileHandle) {
    return postsFileHandle;
  }
  return choosePostsFile();
}

async function writePostsCacheToLocalFile() {
  const handle = await ensurePostsFileHandle();
  const writable = await handle.createWritable();
  await writable.write(serializePostsFile(postsCache));
  await writable.close();
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function refreshPostsFromApi() {
  const posts = await apiRequest("/api/posts");
  postsCache = structuredClone(posts);
  renderSelectorOptions();
  renderSidebarList();
}

async function detectBackend() {
  try {
    const status = await apiRequest("/api/auth/status", { method: "GET" });
    backendAvailable = true;
    backendAuthenticated = Boolean(status.authenticated);
    updateAuthStatus(
      backendAuthenticated
        ? "已连接到服务端后台，并且当前已登录。"
        : "已检测到服务端后台。输入密码后可以直接网页发文。"
    );
    await refreshPostsFromApi();
  } catch {
    backendAvailable = false;
    backendAuthenticated = false;
    updateAuthStatus("当前处于本地模式。启动 Node 服务后可以直接网页发文。", false);
  }
}

async function loginToBackend() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    updateAuthStatus("请输入用户名和密码后再登录。", false);
    return;
  }
  await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  backendAuthenticated = true;
  passwordInput.value = "";
  updateAuthStatus("登录成功，现在可以直接发布到服务端。");
  await refreshPostsFromApi();
}

async function logoutFromBackend() {
  if (!backendAvailable) {
    return;
  }
  await apiRequest("/api/auth/logout", { method: "POST" });
  backendAuthenticated = false;
  updateAuthStatus("已退出服务端后台，当前只能使用本地模式。", false);
}

async function publishCurrentPost() {
  const state = getFormState();
  if (!state.slug) {
    throw new Error("missing slug");
  }

  postsCache[state.slug] = stateToPost(state);

  if (backendAvailable && backendAuthenticated) {
    await apiRequest(`/api/posts/${state.slug}`, {
      method: "PUT",
      body: JSON.stringify(postsCache[state.slug])
    });
    await refreshPostsFromApi();
    return "server";
  }

  await writePostsCacheToLocalFile();
  return "local";
}

async function deleteCurrentPost() {
  const state = getFormState();
  if (!state.slug || !postsCache[state.slug]) {
    throw new Error("post not found");
  }

  if (backendAvailable && backendAuthenticated) {
    await apiRequest(`/api/posts/${state.slug}`, { method: "DELETE" });
    delete postsCache[state.slug];
    await refreshPostsFromApi();
  } else {
    delete postsCache[state.slug];
    await writePostsCacheToLocalFile();
  }

  fillForm(DEFAULT_DRAFT);
}

editorForm.addEventListener("input", syncAll);
editorForm.addEventListener("input", scheduleDraftSave);
selector.addEventListener("change", () => {
  const selected = selector.value;
  fillForm(selected ? postToDraft(selected, postsCache[selected]) : DEFAULT_DRAFT);
});
searchInput.addEventListener("input", renderSidebarList);
resetButton.addEventListener("click", () => {
  fillForm(DEFAULT_DRAFT);
  saveDraft(DEFAULT_DRAFT);
});
clearDraftButton.addEventListener("click", () => {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
  draftStatus.textContent = "本地草稿已清空。";
  draftStatus.classList.add("success");
});
bindPostsFileButton.addEventListener("click", () => {
  choosePostsFile().catch(() => updateFileStatus("绑定本地 posts.js 失败，请重试。", false));
});
newPostButton.addEventListener("click", () => fillForm(DEFAULT_DRAFT));
loginButton.addEventListener("click", () => {
  loginToBackend().catch(() => updateAuthStatus("登录失败，请确认密码是否正确。", false));
});
logoutButton.addEventListener("click", () => {
  logoutFromBackend().catch(() => updateAuthStatus("退出失败，请稍后重试。", false));
});
bootstrapButton.addEventListener("click", () => {
  apiRequest("/api/admin/bootstrap", { method: "POST" })
    .then((result) => {
      updateAuthStatus(
        result.skipped
          ? "数据库里已经有文章了，已跳过导入。"
          : `已导入 ${result.imported} 篇现有文章到数据库。`
      );
      return refreshPostsFromApi();
    })
    .catch(() => {
      updateAuthStatus("导入失败。请先登录后台，再重试导入。", false);
    });
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    copyNote.textContent = "已复制到剪贴板。";
    copyNote.classList.add("success");
  } catch {
    copyNote.textContent = "复制失败，请手动复制上方生成结果。";
    copyNote.classList.remove("success");
  }
});

exportButton.addEventListener("click", () => {
  const state = getFormState();
  const json = JSON.stringify({ [state.slug]: stateToPost(state) }, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.slug || "blog-post"}.json`;
  link.click();
  URL.revokeObjectURL(url);
  copyNote.textContent = "已导出 JSON 文件。";
  copyNote.classList.add("success");
});

publishButton.addEventListener("click", () => {
  publishCurrentPost()
    .then((mode) => {
      copyNote.textContent =
        mode === "server"
          ? "已通过服务端保存文章。刷新首页后就能看到最新内容。"
          : "已写入本地 posts.js。首页和文章页都会自动读取这篇文章。";
      copyNote.classList.add("success");
      saveDraft(getFormState());
    })
    .catch(() => {
      copyNote.textContent = "发布失败。请确认 slug 不为空，并检查服务端登录或本地文件绑定状态。";
      copyNote.classList.remove("success");
    });
});

deleteButton.addEventListener("click", () => {
  deleteCurrentPost()
    .then(() => {
      copyNote.textContent = "当前文章已删除。";
      copyNote.classList.add("success");
    })
    .catch(() => {
      copyNote.textContent = "删除失败。请先选择一篇已存在文章，并检查服务端登录或本地文件绑定状态。";
      copyNote.classList.remove("success");
    });
});

copyCardButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(cardOutput.textContent);
    cardNote.textContent = "首页卡片代码已复制。";
    cardNote.classList.add("success");
  } catch {
    cardNote.textContent = "复制失败，请手动复制上方首页卡片代码。";
    cardNote.classList.remove("success");
  }
});

heroUploadInput.addEventListener("change", () => {
  const [file] = heroUploadInput.files || [];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    editorForm.elements.heroImage.value = typeof reader.result === "string" ? reader.result : "";
    imageNote.textContent = `已载入本地图片：${file.name}。当前会以 data URL 形式保存到文章数据中。`;
    imageNote.classList.add("success");
    syncAll();
    scheduleDraftSave();
  };
  reader.readAsDataURL(file);
});

previewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    previewLanguage = button.dataset.previewLang || "zh";
    previewButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    syncAll();
  });
});

renderSelectorOptions();
renderSidebarList();
const savedDraft = loadSavedDraft();
fillForm(savedDraft || DEFAULT_DRAFT);
if (savedDraft) {
  draftStatus.textContent = "已恢复上次未完成的本地草稿。";
  draftStatus.classList.add("success");
}
detectBackend();
