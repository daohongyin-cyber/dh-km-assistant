const VIEWS = {
  latest: {
    kicker: "内容导入版",
    title: "最新资讯",
    description: "当前先导入现有资讯，优先保留重要时事、国际变化、社会重点和科技消息。",
  },
  policy: {
    kicker: "内容导入版",
    title: "政策新规",
    description: "这里优先放中央、地方、版权、正版软件和行业规则相关的新规信息。",
  },
  industry: {
    kicker: "内容导入版",
    title: "行业动向",
    description: "这里先放现阶段已有的产业和科技动向，音乐平台热榜和观测模板后续再补。",
  },
};

const CONTENT = {
  latest: [
    {
      category: "国际",
      time: "03/24 22:16",
      location: "菲律宾",
      title: "菲律宾总统宣布全国进入能源紧急状态",
      summary: "菲律宾宣布进入能源紧急状态，以应对中东局势对本国能源供应造成的冲击。",
      content:
        "菲律宾总统马科斯签署第110号行政令，宣布全国进入能源紧急状态，重点是稳定能源供应，减轻地缘局势对国内生活和生产的影响。",
      source: "中新网国际",
      url: "https://www.chinanews.com.cn/gj/2026/03-24/10592194.shtml",
    },
    {
      category: "要闻",
      time: "03/24 23:27",
      location: "日本",
      title: "闯入中国大使馆的日本自卫队人员已被逮捕",
      summary: "日本方面已对闯入中国驻日使馆的自卫队人员采取逮捕处理。",
      content:
        "这条信息的重点不只是事件本身，而是后续外交沟通和相关处置走向，涉及使馆安全、外交秩序和舆论影响。",
      source: "中新网滚动",
      url: "https://www.chinanews.com.cn/gn/2026/03-24/10592209.shtml",
    },
    {
      category: "科技",
      time: "03/24 22:15",
      location: "北京",
      title: "中国杰出微电子科学家吴德馨院士逝世",
      summary: "中国科学院院士吴德馨逝世，微电子领域失去一位重要科学家。",
      content:
        "吴德馨院士长期深耕微电子研究，这条信息更偏科技界与产业界的里程碑意义，也体现出基础科技人物对行业长期发展的影响。",
      source: "中新网国内",
      url: "https://www.chinanews.com.cn/gn/2026/03-24/10592189.shtml",
    },
    {
      category: "气候",
      time: "03/24 22:14",
      location: "全球",
      title: "2025年全球年平均陆地气温创1850年以来第三高",
      summary: "最新报告显示，2025年全球年平均陆地气温位列1850年以来第三高。",
      content:
        "这类数据会影响能源、环境、农业和国际政策讨论，对长期判断世界局势和行业变化有持续参考价值。",
      source: "中新网国际",
      url: "https://www.chinanews.com.cn/gj/2026/03-24/10592191.shtml",
    },
    {
      category: "社会",
      time: "03/24 09:27",
      location: "山东",
      title: "山东泰安入室抢婴案二审宣判：驳回上诉，维持原判",
      summary: "山东泰安入室抢婴案二审结果公布，维持原判。",
      content:
        "这类案件之所以值得保留，是因为它具备典型社会关注度，也能反映司法处理与舆论关注的交点。",
      source: "法治在线",
      url: "https://www.chinanews.com.cn/sh/2026/03-24/10591875.shtml",
    },
  ],
  policy: [
    {
      category: "政策新规",
      time: "03/22 08:00",
      location: "全国",
      title: "中共中央办公厅 国务院办公厅印发《国有企业领导人员廉洁从业规定》",
      summary: "围绕国企领导人员廉洁从业的最新规定已经印发，后续重点看执行与配套细则。",
      content:
        "这类政策信息的核心不是标题本身，而是落地后的适用范围、实施强度和后续是否有更多细则同步出台。",
      source: "中国政府网",
      url: "https://www.gov.cn/zhengce/202603/content_7063468.htm",
    },
    {
      category: "版权新规",
      time: "03/17 08:00",
      location: "国家版权局",
      title: "国家版权局关于公布2025年全国著作权登记情况的通知",
      summary: "全国著作权登记情况公布，对音乐、设计和内容行业判断版权趋势有直接参考价值。",
      content:
        "这类信息直接关系到内容产业、创作环境和版权保护强度，后续可继续延展到音乐人、设计师和平台生态层面的变化。",
      source: "国家版权局",
      url: "https://www.ncac.gov.cn/xxfb/tzgg/202603/t20260317_962958.html",
    },
    {
      category: "版权动态",
      time: "03/20 08:00",
      location: "北京",
      title: "推进使用正版软件工作部际联席会议第十五次全体会议在京召开",
      summary: "正版软件推进会议召开，反映版权治理和规范化使用软件的持续强化。",
      content:
        "这类信息会影响到软件采购、内容生产和版权治理方向，对创作行业和企业合规都有现实意义。",
      source: "国家版权局",
      url: "https://www.ncac.gov.cn/xxfb/ywxx/202603/t20260320_964877.html",
    },
    {
      category: "版权保护",
      time: "02/10 08:00",
      location: "全国",
      title: "国家版权局等四部门启动2026年院线电影版权保护专项行动",
      summary: "院线电影版权保护专项行动启动，体现版权打击和保护力度持续增强。",
      content:
        "虽然表面是电影领域，但这类专项行动对整个内容产业的版权意识、平台治理和侵权打击都具有风向标意义。",
      source: "国家版权局",
      url: "https://www.ncac.gov.cn/xxfb/ywxx/202602/t20260210_949671.html",
    },
  ],
  industry: [
    {
      category: "产业动向",
      time: "03/24 22:03",
      location: "北京",
      title: "郑栅洁会见韩国三星电子会长李在镕",
      summary: "发改委负责人会见三星电子会长，信息释放出高水平开放和产业合作的延续信号。",
      content:
        "这类公司和政策层面的会见信息，虽然不像热搜那样直白，但对科技产业、制造链和国际商业合作判断很有价值。",
      source: "中新网财经",
      url: "https://www.chinanews.com.cn/cj/2026/03-24/10592181.shtml",
    },
    {
      category: "科技动向",
      time: "03/24 21:59",
      location: "杭州",
      title: "全球计量技术专家齐聚杭州 共商计量科技创新发展",
      summary: "全球计量技术专家在杭州集中讨论科技创新发展，体现产业基础能力的升级趋势。",
      content:
        "计量听起来偏基础，但它关系到工业、制造、芯片、实验和技术验证，是很多高科技产业的底层能力支撑。",
      source: "中新网财经",
      url: "https://www.chinanews.com.cn/cj/2026/03-24/10592174.shtml",
    },
    {
      category: "行业观察",
      time: "待补充",
      location: "",
      title: "音乐平台热榜观测待补充",
      summary: "这里后续会接入你要的上榜音乐观测模板，目前先保留位置。",
      content:
        "这一栏会补充平台热歌数据、榜单变化、曲风统计和用户偏好变化，当前先保留结构，后面按你的模板继续填充。",
      source: "待补充",
      url: "#",
    },
    {
      category: "行业观察",
      time: "待补充",
      location: "",
      title: "音乐平台规则动向待补充",
      summary: "这里后续会补充你更关心的音乐平台规则、分成、商务和头部公司动作。",
      content:
        "这一块后续优先补网易云、QQ音乐、腾讯音乐、字节、抖音和版权相关规则，不会往没用的财报内容上偏。",
      source: "待补充",
      url: "#",
    },
  ],
};

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

function shouldShowSplash() {
  return true;
}

function showSplashIfNeeded() {
  if (!shouldShowSplash()) {
    return;
  }

  splashScreen.classList.add("is-visible");
  splashScreen.setAttribute("aria-hidden", "false");

  if (shouldPreviewSplash()) {
    return;
  }

  window.setTimeout(() => {
    splashScreen.classList.remove("is-visible");
    splashScreen.setAttribute("aria-hidden", "true");
  }, 2000);
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
    fragment.querySelector(".card-location").textContent = item.location || "";
    fragment.querySelector(".card-location").style.display = item.location ? "block" : "none";
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
