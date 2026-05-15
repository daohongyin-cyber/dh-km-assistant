import fs from "node:fs";
import path from "node:path";

const BASE_DIR = process.cwd();
const DOCS_DIR = path.join(BASE_DIR, "docs");
const CONTENT_JS = path.join(BASE_DIR, "content.js");
const LOCAL_NOW = () => new Date();

const RSS_SOURCES = [
  { name: "中新网滚动", category: "要闻", url: "http://www.chinanews.com/rss/scroll-news.xml", limit: 8 },
  { name: "中新网国内", category: "国内", url: "http://www.chinanews.com/rss/china.xml", limit: 8 },
  { name: "中新网国际", category: "国际", url: "http://www.chinanews.com/rss/world.xml", limit: 8 },
  { name: "中新网财经", category: "财经", url: "http://www.chinanews.com/rss/finance.xml", limit: 8 },
  { name: "中新网社会", category: "社会", url: "http://www.chinanews.com/rss/society.xml", limit: 8 },
  { name: "中新网法治", category: "法治", url: "http://www.chinanews.com/rss/fz.xml", limit: 6 },
  { name: "中新网教育", category: "教育", url: "http://www.chinanews.com/rss/edu.xml", limit: 6 },
];

const INDUSTRY_KEYWORDS = [
  "网易", "网易云", "网易云音乐", "腾讯", "腾讯音乐", "QQ音乐", "酷狗", "酷我",
  "字节", "字节跳动", "抖音", "豆包", "飞书", "音乐人", "版权", "著作权",
  "版税", "分成", "分账", "商单", "发行", "平台", "AI", "人工智能", "芯片",
];

const POLICY_KEYWORDS = [
  "新规", "政策", "规定", "办法", "通知", "版权", "著作权", "规则", "治理",
  "专项行动", "正版软件", "公示", "批复", "意见", "条例",
];

const LOW_VALUE_KEYWORDS = ["财报", "业绩", "收益电话会", "季度业绩", "营收", "净利润"];

const SOURCES = [
  "中国政府网｜最新政策",
  "国家版权局｜通知公告 / 要闻信息",
  "国家新闻出版署｜通知公示 / 要闻信息",
  "中国新闻网｜滚动 / 国内 / 国际 / 财经 / 社会",
  "腾讯音乐 IR 官方",
  "网易云音乐创作者中心（官方入口）",
  "抖音音乐开放平台帮助中心（官方入口）",
];

const FALLBACK_SECTIONS = {
  latest: [
    {
      category: "国际",
      time: "03/24 22:16",
      location: "菲律宾",
      title: "菲律宾总统宣布全国进入能源紧急状态。",
      summary: "菲律宾宣布进入能源紧急状态，以应对中东局势对本国能源供应造成的冲击。",
      content: "菲律宾总统马科斯签署第110号行政令，宣布全国进入能源紧急状态，重点是稳定能源供应，减轻地缘局势对国内生活和生产的影响。",
      source: "中新网国际",
      url: "https://www.chinanews.com.cn/gj/2026/03-24/10592194.shtml",
      publishedAt: "2026-03-24T14:16:43+00:00",
    },
    {
      category: "要闻",
      time: "03/24 23:27",
      location: "日本",
      title: "闯入中国大使馆的日本自卫队人员已被逮捕。",
      summary: "日本方面已对闯入中国驻日使馆的自卫队人员采取逮捕处理。",
      content: "这条信息的重点不只是事件本身，而是后续外交沟通和相关处置走向，涉及使馆安全、外交秩序和舆论影响。",
      source: "中新网滚动",
      url: "https://www.chinanews.com.cn/gn/2026/03-24/10592209.shtml",
      publishedAt: "2026-03-24T15:27:41+00:00",
    },
    {
      category: "科技",
      time: "03/24 22:15",
      location: "北京",
      title: "中国杰出微电子科学家吴德馨院士逝世。",
      summary: "中国科学院院士吴德馨逝世，微电子领域失去一位重要科学家。",
      content: "吴德馨院士长期深耕微电子研究，这条信息更偏科技界与产业界的里程碑意义，也体现出基础科技人物对行业长期发展的影响。",
      source: "中新网国内",
      url: "https://www.chinanews.com.cn/gn/2026/03-24/10592189.shtml",
      publishedAt: "2026-03-24T14:15:55+00:00",
    },
    {
      category: "气候",
      time: "03/24 22:14",
      location: "全球",
      title: "2025年全球年平均陆地气温创1850年以来第三高。",
      summary: "最新报告显示，2025年全球年平均陆地气温位列1850年以来第三高。",
      content: "这类数据会影响能源、环境、农业和国际政策讨论，对长期判断世界局势和行业变化有持续参考价值。",
      source: "中新网国际",
      url: "https://www.chinanews.com.cn/gj/2026/03-24/10592191.shtml",
      publishedAt: "2026-03-24T14:14:53+00:00",
    },
    {
      category: "社会",
      time: "03/24 09:27",
      location: "山东",
      title: "山东泰安入室抢婴案二审宣判：驳回上诉，维持原判。",
      summary: "山东泰安入室抢婴案二审结果公布，维持原判。",
      content: "这类案件之所以值得保留，是因为它具备典型社会关注度，也能反映司法处理与舆论关注的交点。",
      source: "法治在线",
      url: "https://www.chinanews.com.cn/sh/2026/03-24/10591875.shtml",
      publishedAt: "2026-03-24T01:27:25+00:00",
    },
  ],
  policy: [
    {
      category: "政策新规",
      time: "03/22 08:00",
      location: "全国",
      title: "中共中央办公厅 国务院办公厅印发《国有企业领导人员廉洁从业规定》。",
      summary: "围绕国企领导人员廉洁从业的最新规定已经印发，后续重点看执行与配套细则。",
      content: "这类政策信息的核心不是标题本身，而是落地后的适用范围、实施强度和后续是否有更多细则同步出台。",
      source: "中国政府网",
      url: "https://www.gov.cn/zhengce/202603/content_7063468.htm",
      publishedAt: "2026-03-22T00:00:00+00:00",
    },
    {
      category: "版权新规",
      time: "03/17 08:00",
      location: "国家版权局",
      title: "国家版权局关于公布2025年全国著作权登记情况的通知。",
      summary: "全国著作权登记情况公布，对音乐、设计和内容行业判断版权趋势有直接参考价值。",
      content: "这类信息直接关系到内容产业、创作环境和版权保护强度，后续可继续延展到音乐人、设计师和平台生态层面的变化。",
      source: "国家版权局",
      url: "https://www.ncac.gov.cn/xxfb/tzgg/202603/t20260317_962958.html",
      publishedAt: "2026-03-17T00:00:00+00:00",
    },
    {
      category: "版权动态",
      time: "03/20 08:00",
      location: "北京",
      title: "推进使用正版软件工作部际联席会议第十五次全体会议在京召开。",
      summary: "正版软件推进会议召开，反映版权治理和规范化使用软件的持续强化。",
      content: "这类信息会影响到软件采购、内容生产和版权治理方向，对创作行业和企业合规都有现实意义。",
      source: "国家版权局",
      url: "https://www.ncac.gov.cn/xxfb/ywxx/202603/t20260320_964877.html",
      publishedAt: "2026-03-20T00:00:00+00:00",
    },
    {
      category: "版权保护",
      time: "02/10 08:00",
      location: "全国",
      title: "国家版权局等四部门启动2026年院线电影版权保护专项行动。",
      summary: "院线电影版权保护专项行动启动，体现版权打击和保护力度持续增强。",
      content: "虽然表面是电影领域，但这类专项行动对整个内容产业的版权意识、平台治理和侵权打击都具有风向标意义。",
      source: "国家版权局",
      url: "https://www.ncac.gov.cn/xxfb/ywxx/202602/t20260210_949671.html",
      publishedAt: "2026-02-10T00:00:00+00:00",
    },
  ],
  industry: [
    {
      category: "产业动向",
      time: "03/24 22:03",
      location: "北京",
      title: "郑栅洁会见韩国三星电子会长李在镕。",
      summary: "发改委负责人会见三星电子会长，信息释放出高水平开放和产业合作的延续信号。",
      content: "这类公司和政策层面的会见信息，虽然不像热搜那样直白，但对科技产业、制造链和国际商业合作判断很有价值。",
      source: "中新网财经",
      url: "https://www.chinanews.com.cn/cj/2026/03-24/10592181.shtml",
      publishedAt: "2026-03-24T14:03:46+00:00",
    },
    {
      category: "科技动向",
      time: "03/24 21:59",
      location: "杭州",
      title: "全球计量技术专家齐聚杭州 共商计量科技创新发展。",
      summary: "全球计量技术专家在杭州集中讨论科技创新发展，体现产业基础能力的升级趋势。",
      content: "计量听起来偏基础，但它关系到工业、制造、芯片、实验和技术验证，是很多高科技产业的底层能力支撑。",
      source: "中新网财经",
      url: "https://www.chinanews.com.cn/cj/2026/03-24/10592174.shtml",
      publishedAt: "2026-03-24T14:02:14+00:00",
    },
    {
      category: "行业观察",
      time: "待更新",
      location: "",
      title: "网易云音乐创作者中心规则更新待补充。",
      summary: "网易云音乐创作者中心 已接入为官方来源入口，当前待抓取更稳定的正式更新项。",
      content: "网易云音乐创作者中心 已纳入官方来源白名单，后续会持续补入更稳定的规则与公告内容。",
      source: "网易云音乐创作者中心",
      url: "https://musicupload.netease.com/",
      publishedAt: "2026-05-15T05:24:55.953Z",
    },
    {
      category: "行业观察",
      time: "待更新",
      location: "",
      title: "抖音音乐开放平台规则更新待补充。",
      summary: "抖音音乐开放平台 已接入为官方来源入口，当前待抓取更稳定的正式更新项。",
      content: "抖音音乐开放平台 已纳入官方来源白名单，后续会持续补入更稳定的规则与公告内容。",
      source: "抖音音乐开放平台",
      url: "https://music.douyin.com/support/content/root?spaceId=299",
      publishedAt: "2026-05-15T05:24:55.954Z",
    },
  ],
};

function cleanHtml(text = "") {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(text = "", length = 88) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) return normalized;
  return normalized.slice(0, length - 1).trimEnd() + "…";
}

function parseDatetime(value = "") {
  if (!value) return new Date();
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    return new Date(`${compact[1]}-${compact[2]}-${compact[3]}T00:00:00+08:00`);
  }
  return new Date();
}

function formatTime(date) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace("/", "/");
}

function inferLocation(text = "") {
  const match = text.match(/(北京|上海|天津|重庆|山东|杭州|深圳|广州|菲律宾|日本|韩国|全球|全国)/);
  return match ? match[1] : "";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "DH-KM-Assistant/3.0" },
  });
  if (!response.ok) throw new Error(`${url} => ${response.status}`);
  return await response.text();
}

function parseRssItems(xml, source) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = regex.exec(xml)) && items.length < source.limit) {
    const block = match[1];
    const title = cleanHtml((block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || block.match(/<title>(.*?)<\/title>/s) || [,""])[1]);
    const link = cleanHtml((block.match(/<link>(.*?)<\/link>/s) || [,""])[1]);
    const description = cleanHtml((block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s) || block.match(/<description>(.*?)<\/description>/s) || [,""])[1]);
    const pubDate = cleanHtml((block.match(/<pubDate>(.*?)<\/pubDate>/s) || [,""])[1]);
    if (!title || !link) continue;
    const published = parseDatetime(pubDate);
    items.push({
      category: source.category,
      time: formatTime(published),
      location: inferLocation(description || title),
      title: title.endsWith("。") ? title : `${title}。`,
      summary: shortText(description || title),
      content: description || title,
      source: source.name,
      url: link,
      publishedAt: published.toISOString(),
    });
  }
  return items;
}

async function fetchRssSource(source) {
  const xml = await fetchText(source.url);
  return parseRssItems(xml, source);
}

async function fetchGovCn(limit = 10) {
  const text = await fetchText("https://www.gov.cn/zhengce/zuixin/ZUIXINZHENGCE.json");
  const data = JSON.parse(text);
  return data.slice(0, limit).map((item) => {
    const published = parseDatetime(item.DOCRELPUBTIME || "");
    const title = String(item.TITLE || "").trim();
    return {
      category: "政策新规",
      time: formatTime(published),
      location: "全国",
      title: title.endsWith("。") ? title : `${title}。`,
      summary: shortText(item.SUB_TITLE || title),
      content: item.SUB_TITLE || title,
      source: "中国政府网",
      url: item.URL || "",
      publishedAt: published.toISOString(),
    };
  }).filter((item) => item.title);
}

async function fetchNcac(limit = 10) {
  const html = await fetchText("https://www.ncac.gov.cn/xxfb/tzgg/");
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
  const items = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(html)) && items.length < limit) {
    const href = match[1];
    const title = cleanHtml(match[2]);
    if (!title || seen.has(title)) continue;
    seen.add(title);
    if (!POLICY_KEYWORDS.some((keyword) => title.includes(keyword))) continue;
    const dateMatch = href.match(/t(\d{8})_/);
    const published = parseDatetime(dateMatch ? dateMatch[1] : "");
    items.push({
      category: "政策新规",
      time: formatTime(published),
      location: "国家版权局",
      title: title.endsWith("。") ? title : `${title}。`,
      summary: shortText(title),
      content: title,
      source: "国家版权局",
      url: new URL(href, "https://www.ncac.gov.cn/").toString(),
      publishedAt: published.toISOString(),
    });
  }
  return items;
}

async function fetchTencentIr(limit = 6) {
  const html = await fetchText("https://ir.tencentmusic.com/Press-Releases");
  const regex = /<div class="wd_date">(.*?)<\/div>\s*<div class="wd_title"><a href="(.*?)">(.*?)<\/a><\/div>\s*(?:.*?<div class="wd_summary"><p>(.*?)<\/p><\/div>)?/gs;
  const items = [];
  let match;
  while ((match = regex.exec(html)) && items.length < limit) {
    const [, rawDate, link, rawTitle, rawSummary] = match;
    const title = cleanHtml(rawTitle);
    const summary = cleanHtml(rawSummary);
    if (!title || LOW_VALUE_KEYWORDS.some((keyword) => title.includes(keyword))) continue;
    const published = parseDatetime(rawDate);
    items.push({
      category: "行业动向",
      time: formatTime(published),
      location: "",
      title: title.endsWith("。") ? title : `${title}。`,
      summary: shortText(summary || title),
      content: summary || title,
      source: "腾讯音乐官方",
      url: link,
      publishedAt: published.toISOString(),
    });
  }
  return items;
}

function placeholder(category, title, source, url) {
  return {
    category,
    time: "待更新",
    location: "",
    title,
    summary: `${source} 已接入为官方来源入口，当前待抓取更稳定的正式更新项。`,
    content: `${source} 已纳入官方来源白名单，后续会持续补入更稳定的规则与公告内容。`,
    source,
    url,
    publishedAt: LOCAL_NOW().toISOString(),
  };
}

function padSection(items, target, makeItem) {
  const padded = [...items];
  let index = 1;
  while (padded.length < target) {
    padded.push(makeItem(index));
    index += 1;
  }
  return padded;
}

function sortAndLimit(items, limit = 20) {
  const unique = new Map();
  for (const item of items) {
    if (!unique.has(item.title)) unique.set(item.title, item);
  }
  return [...unique.values()]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit);
}

async function buildPayload() {
  const latest = [];
  for (const source of RSS_SOURCES) {
    try {
      latest.push(...(await fetchRssSource(source)));
    } catch {}
  }

  const policy = [];
  try {
    policy.push(...(await fetchGovCn()));
  } catch {}
  try {
    policy.push(...(await fetchNcac()));
  } catch {}

  const industry = [];
  try {
    industry.push(...(await fetchTencentIr()));
  } catch {}

  for (const item of latest) {
    const text = `${item.title} ${item.summary} ${item.source}`;
    if (INDUSTRY_KEYWORDS.some((keyword) => text.includes(keyword))) {
      industry.push({ ...item, category: "行业动向" });
    }
  }

  industry.push(
    placeholder("行业动向", "网易云音乐创作者中心规则更新待补充。", "网易云音乐创作者中心", "https://musicupload.netease.com/"),
    placeholder("行业动向", "抖音音乐开放平台规则更新待补充。", "抖音音乐开放平台", "https://music.douyin.com/support/content/root?spaceId=299")
  );

  const latestBase = latest.length ? sortAndLimit(latest, 20) : FALLBACK_SECTIONS.latest;
  const policyBase = policy.length ? sortAndLimit(policy, 20) : FALLBACK_SECTIONS.policy;
  const industryBase = industry.length ? sortAndLimit(industry, 20) : FALLBACK_SECTIONS.industry;

  const latestSection = padSection(latestBase, 20, (index) =>
    placeholder(
      "最新资讯",
      `最新资讯补充位 ${index}。`,
      "待补充",
      "#"
    )
  );
  const policySection = padSection(policyBase, 20, (index) =>
    placeholder(
      "政策新规",
      `政策新规补充位 ${index}。`,
      "待补充",
      "#"
    )
  );
  const industrySection = padSection(industryBase, 20, (index) =>
    placeholder(
      "行业动向",
      `行业动向补充位 ${index}。`,
      "待补充",
      "#"
    )
  );

  return {
    updatedAt: new Date().toISOString(),
    views: {
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
    },
    sections: {
      latest: latestSection,
      policy: policySection,
      industry: industrySection,
    },
    sources: SOURCES,
  };
}

async function main() {
  const payload = await buildPayload();
  const text = `window.DHKM_CONTENT = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(CONTENT_JS, text, "utf8");
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DOCS_DIR, "content.js"), text, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
