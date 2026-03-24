const listNode = document.querySelector("#news-list");
const itemTemplate = document.querySelector("#item-template");
const statusBanner = document.querySelector("#status-banner");
const updatedAtNode = document.querySelector("#updated-at");
const itemCountNode = document.querySelector("#item-count");
const currentViewLabelNode = document.querySelector("#current-view-label");
const searchInput = document.querySelector("#search-input");
const featuredCardNode = document.querySelector("#featured-card");
const featuredTagNode = document.querySelector("#featured-tag");
const featuredTitleNode = document.querySelector("#featured-title");
const featuredSummaryNode = document.querySelector("#featured-summary");
const livePillNode = document.querySelector("#live-pill");
const refreshButton = document.querySelector("#refresh-button");
const tabButtons = Array.from(document.querySelectorAll("[data-view]"));

let currentPayload = { items: [], industryItems: [] };
let currentView = "all";
let currentQuery = "";
let lastRefreshAt = 0;

function resolveApiUrl(forceRefresh = false) {
  if (window.location.hostname.endsWith("github.io")) {
    const stamp = forceRefresh ? Date.now() : Math.floor(Date.now() / (30 * 60 * 1000));
    return `./briefing.json?t=${stamp}`;
  }
  const suffix = forceRefresh ? "?refresh=1" : "";
  if (window.location.protocol === "file:") {
    return `http://127.0.0.1:8123/api/briefing${suffix}`;
  }
  return `/api/briefing${suffix}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function setStatus(message, mode) {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${mode}`;
}

function setLiveState(mode) {
  livePillNode.classList.toggle("is-error", mode === "error");
  livePillNode.textContent = mode === "error" ? "连接异常" : "实时更新";
}

function getSourceItems() {
  return currentView === "industry" ? currentPayload.industryItems || [] : currentPayload.items || [];
}

function getVisibleItems() {
  const items = getSourceItems();
  if (!currentQuery) {
    return items;
  }

  const query = currentQuery.toLowerCase();
  return items.filter((item) => {
    const text = [item.summary, item.content_summary, item.title]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(query);
  });
}

function getViewLabel() {
  return currentView === "industry" ? "平台新规" : "全部大事件";
}

function updateTabs() {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === currentView);
  });
}

function renderFeatured(items) {
  const topItem = items[0];
  if (!topItem) {
    featuredCardNode.hidden = true;
    return;
  }

  featuredCardNode.hidden = false;
  featuredTagNode.textContent = currentView === "industry" ? "平台头条" : "今日头条";
  featuredTitleNode.textContent = topItem.summary || topItem.title || "";
  featuredSummaryNode.textContent = topItem.content_summary || "这条是当前最值得先看的重点内容。";
}

function renderList() {
  const items = getVisibleItems();
  const restItems = items.length > 1 ? items.slice(1) : [];
  currentViewLabelNode.textContent = getViewLabel();
  itemCountNode.textContent = String(items.length);
  listNode.innerHTML = "";
  renderFeatured(items);

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "news-item";
    empty.textContent = currentQuery
      ? `没有找到包含“${currentQuery}”的内容。`
      : currentView === "industry"
        ? "当前没有抓到平台新规。"
        : "当前没有抓到可展示的大事件。";
    listNode.appendChild(empty);
    return;
  }

  if (!restItems.length) {
    return;
  }

  restItems.forEach((item, index) => {
    const fragment = itemTemplate.content.cloneNode(true);
    const titleNode = fragment.querySelector(".item-title");
    const summaryNode = fragment.querySelector(".item-summary");

    titleNode.textContent = `${index + 2}. ${item.summary || item.title || ""}`;
    const contentSummary = item.content_summary || "";
    if (contentSummary) {
      summaryNode.textContent = `内容总结：${contentSummary}`;
    } else {
      summaryNode.remove();
    }

    listNode.appendChild(fragment);
  });
}

function updateSuccessStatus() {
  const count = getVisibleItems().length;
  if (currentQuery) {
    setStatus(`已筛出 ${count} 条和“${currentQuery}”相关的当天资讯。`, "success");
    return;
  }

  if (currentView === "industry") {
    setStatus(`已更新 ${(currentPayload.industryItems || []).length} 条平台新规。`, "success");
    return;
  }

  setStatus(`已更新 ${(currentPayload.items || []).length} 条当天最新资讯。`, "success");
}

function applyPayload(payload) {
  currentPayload = {
    ...payload,
    items: Array.isArray(payload.items) ? payload.items : [],
    industryItems: Array.isArray(payload.industryItems) ? payload.industryItems : [],
  };
  updatedAtNode.textContent = formatDate(currentPayload.updatedAt);
  renderList();
  updateSuccessStatus();
  setLiveState("ok");
}

function setView(view) {
  currentView = view;
  updateTabs();
  renderList();
  updateSuccessStatus();
}

function getFriendlyError(error) {
  if (error instanceof TypeError) {
    return "网络连接不到服务。";
  }
  return error.message || "未知错误";
}

async function loadBriefing(forceRefresh = true) {
  refreshButton.disabled = true;
  setStatus(forceRefresh ? "正在拉取当天最新内容。" : "正在同步最新内容。", "loading");

  try {
    const response = await fetch(resolveApiUrl(forceRefresh), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`接口返回 ${response.status}`);
    }

    const payload = await response.json();
    lastRefreshAt = Date.now();
    applyPayload(payload);
  } catch (error) {
    currentPayload = { items: [], industryItems: [] };
    updatedAtNode.textContent = "更新失败";
    itemCountNode.textContent = "0";
    renderList();
    setLiveState("error");
    setStatus(`加载失败：${getFriendlyError(error)} 请点刷新重试。`, "error");
  } finally {
    refreshButton.disabled = false;
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.view || "all");
  });
});

searchInput.addEventListener("input", (event) => {
  currentQuery = event.target.value.trim();
  renderList();
  updateSuccessStatus();
});

refreshButton.addEventListener("click", () => {
  loadBriefing(true);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") {
    return;
  }

  const stale = Date.now() - lastRefreshAt > 120000;
  if (stale) {
    loadBriefing(true);
  }
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker
    .register("./service-worker.js")
    .then((registration) => registration.update())
    .catch(() => {
    });
}

updateTabs();
loadBriefing(true);
