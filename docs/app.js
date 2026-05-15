const DEFAULT_VIEWS = {
  latest: {
    kicker: "实时更新",
    title: "最新资讯",
    description: "当前内容来自已接入的官源、主流媒体与平台官方入口，按你的三栏规则筛选。",
  },
  policy: {
    kicker: "规则与治理",
    title: "政策新规",
    description: "优先展示国家政策、版权规则、平台治理和内容行业制度变化。",
  },
  industry: {
    kicker: "行业与平台",
    title: "行业动向",
    description: "优先展示音乐平台、创作者规则、科技工具和行业趋势变化。",
  },
};

const FALLBACK_CONTENT = {
  updatedAt: "",
  views: DEFAULT_VIEWS,
  sections: {
    latest: [],
    policy: [],
    industry: [],
  },
};

const CONTENT_PAYLOAD = window.DHKM_CONTENT || FALLBACK_CONTENT;
const VIEWS = CONTENT_PAYLOAD.views || DEFAULT_VIEWS;
const CONTENT = CONTENT_PAYLOAD.sections || FALLBACK_CONTENT.sections;

const splashScreen = document.getElementById("splash-screen");
const newsList = document.getElementById("news-list");
const itemTemplate = document.getElementById("item-template");
const detailSheet = document.getElementById("detail-sheet");
const closeDetailButton = document.getElementById("close-detail");
const sheetBackdrop = document.getElementById("sheet-backdrop");

const heroKicker = document.getElementById("hero-kicker");
const heroTitle = document.getElementById("hero-title");
const heroDescription = document.getElementById("hero-description");

const detailCategory = document.getElementById("detail-category");
const detailTime = document.getElementById("detail-time");
const detailTitle = document.getElementById("detail-title");
const detailLocation = document.getElementById("detail-location");
const detailSummary = document.getElementById("detail-summary");
const detailContent = document.getElementById("detail-content");
const detailSource = document.getElementById("detail-source");
const detailLink = document.getElementById("detail-link");

let currentView = "latest";

function shouldPreviewSplash() {
  const params = new URLSearchParams(window.location.search);
  return params.get("splash") === "1";
}

function showSplashIfNeeded() {
  splashScreen.classList.add("is-visible");
  splashScreen.setAttribute("aria-hidden", "false");

  if (shouldPreviewSplash()) {
    return;
  }

  window.setTimeout(() => {
    splashScreen.classList.remove("is-visible");
    splashScreen.setAttribute("aria-hidden", "true");
  }, 7000);
}

function updateHero() {
  const view = VIEWS[currentView];
  heroKicker.textContent = view.kicker;
  heroTitle.textContent = view.title;
  heroDescription.textContent = view.description;
}

function openDetail(item) {
  detailCategory.textContent = item.category || "";
  detailTime.textContent = item.time || "";
  detailTitle.textContent = item.title || "";
  detailLocation.textContent = item.location || "";
  detailLocation.style.display = item.location ? "block" : "none";
  detailSummary.textContent = item.summary || "";
  detailContent.textContent = item.content || "";
  detailSource.textContent = item.source || "";
  detailLink.href = item.url || "#";
  detailLink.style.display = item.url && item.url !== "#" ? "inline-flex" : "none";
  detailSheet.classList.add("is-open");
  detailSheet.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  detailSheet.classList.remove("is-open");
  detailSheet.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderList() {
  newsList.innerHTML = "";
  const items = CONTENT[currentView] || [];

  items.forEach((item) => {
    const fragment = itemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".news-card");
    fragment.querySelector(".card-tag").textContent = item.category || "";
    fragment.querySelector(".card-time").textContent = item.time || "";
    fragment.querySelector(".card-title").textContent = item.title || "";
    const locationNode = fragment.querySelector(".card-location");
    locationNode.textContent = item.location || "";
    locationNode.style.display = item.location ? "block" : "none";
    fragment.querySelector(".card-summary").textContent = item.summary || "";
    button.addEventListener("click", () => openDetail(item));
    newsList.appendChild(fragment);
  });
}

function setActiveTab(nextView) {
  currentView = nextView;
  document.querySelectorAll(".section-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === nextView);
  });
  updateHero();
  renderList();
}

document.querySelectorAll(".section-tab").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.view));
});

closeDetailButton.addEventListener("click", closeDetail);
sheetBackdrop.addEventListener("click", closeDetail);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDetail();
  }
});

showSplashIfNeeded();
updateHero();
renderList();
