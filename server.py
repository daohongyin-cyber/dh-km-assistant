import json
import os
import re
import ssl
import threading
import time
import ctypes
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HOST = os.environ.get("DHKM_HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT") or os.environ.get("DHKM_PORT") or "8123")
USER_AGENT = "DH-KM-Assistant/2.0 (+https://localhost)"
REQUEST_TIMEOUT = 12
CACHE_TTL_SECONDS = 600
SNAPSHOT_PATH = os.path.join(BASE_DIR, "briefing-cache.json")
LOCAL_TZ = timezone(timedelta(hours=8))

MEMORY_CACHE = {
    "payload": None,
    "expires_at": 0.0,
    "refreshing": False,
}
CACHE_LOCK = threading.Lock()

RSS_SOURCES = [
    {
        "name": "中新网滚动",
        "source_zh": "中新网滚动",
        "category": "要闻",
        "url": "http://www.chinanews.com/rss/scroll-news.xml",
        "limit": 6,
    },
    {
        "name": "中新网国内",
        "source_zh": "中新网国内",
        "category": "国内",
        "url": "http://www.chinanews.com/rss/china.xml",
        "limit": 6,
    },
    {
        "name": "中新网国际",
        "source_zh": "中新网国际",
        "category": "国际",
        "url": "http://www.chinanews.com/rss/world.xml",
        "limit": 6,
    },
    {
        "name": "中新网财经",
        "source_zh": "中新网财经",
        "category": "财经",
        "url": "http://www.chinanews.com/rss/finance.xml",
        "limit": 6,
    },
    {
        "name": "中新网社会",
        "source_zh": "中新网社会",
        "category": "社会",
        "url": "http://www.chinanews.com/rss/society.xml",
        "limit": 6,
    },
    {
        "name": "中新网法治",
        "source_zh": "中新网法治",
        "category": "法治",
        "url": "http://www.chinanews.com/rss/fz.xml",
        "limit": 6,
    },
]

SOURCE_LABELS = {
    "中国政府网": "中国政府网",
    "中新网滚动": "中新网滚动",
    "中新网国内": "中新网国内",
    "中新网国际": "中新网国际",
    "中新网财经": "中新网财经",
    "中新网社会": "中新网社会",
    "中新网法治": "中新网法治",
    "腾讯音乐官方": "腾讯音乐官方",
    "国家版权局": "国家版权局",
}

AI_KEYWORDS = (
    "ai",
    "人工智能",
    "大模型",
    "模型",
    "芯片",
    "算力",
    "机器人",
    "自动驾驶",
    "智能体",
    "生成式",
    "算法",
)

HIGH_SIGNAL_KEYWORDS = (
    "发布",
    "宣布",
    "签署",
    "新规",
    "政策",
    "条例",
    "办法",
    "会议",
    "协议",
    "关税",
    "利率",
    "监管",
    "法院",
    "警方",
    "事故",
    "死亡",
    "地震",
    "暴雨",
    "冲突",
    "能源",
    "芯片",
    "人工智能",
    "大模型",
    "机器人",
    "卫星",
    "发射",
    "经济",
    "融资",
    "平台",
    "出口",
    "制裁",
    "法治",
    "院士逝世",
)

LOW_SIGNAL_KEYWORDS = (
    "采茶",
    "采收期",
    "桃花",
    "美景",
    "留学生",
    "文化",
    "旅游",
    "景区",
    "展演",
    "赏花",
    "美食",
    "竞技",
    "体验",
    "打卡",
    "科普",
    "提醒",
    "赏樱",
    "月季",
    "花卉",
    "西瓜",
    "致敬",
    "探访",
)

PRIORITY_COMPANY_KEYWORDS = (
    "网易",
    "网易云",
    "网易云音乐",
    "腾讯",
    "腾讯音乐",
    "腾讯音乐娱乐",
    "qq音乐",
    "酷狗",
    "酷我",
    "字节",
    "字节跳动",
    "抖音",
    "豆包",
    "飞书",
    "版权",
    "著作权",
    "音乐人",
    "版税",
    "分成",
    "分账",
    "收益规则",
    "商务",
    "商单",
    "合作规则",
    "发行",
    "下架",
    "独家版权",
)

LOW_VALUE_TITLE_KEYWORDS = (
    "如何",
    "怎么",
    "答案来了",
    "记牢",
    "提醒",
    "科普",
    "探访",
    "独家视频",
    "法治在线",
    "聚焦博鳌",
    "赏花",
    "打卡",
    "致敬",
)

INDUSTRY_FOCUS_KEYWORDS = (
    "网易",
    "网易云",
    "网易云音乐",
    "腾讯",
    "腾讯音乐",
    "腾讯音乐娱乐",
    "qq音乐",
    "酷狗",
    "酷我",
    "字节",
    "字节跳动",
    "抖音",
    "豆包",
    "飞书",
    "版权",
    "著作权",
    "正版软件",
    "音乐人",
    "版税",
    "分成",
    "分账",
    "收益规则",
    "商单",
    "合作规则",
    "发行",
    "下架",
    "独家版权",
    "唱片",
    "音像",
    "预警名单",
    "专项行动",
)

DIRECT_ACTION_KEYWORDS = (
    "发布",
    "印发",
    "公布",
    "公示",
    "上线",
    "启动",
    "签署",
    "通过",
    "决定",
    "批复",
    "约谈",
    "处罚",
    "逮捕",
    "立案",
    "进入",
    "宣布",
    "会见",
)

COPYRIGHT_RULE_KEYWORDS = (
    "版权",
    "著作权",
    "正版",
    "软件",
    "音乐",
    "歌曲",
    "词曲",
    "唱片",
    "电影",
    "音像",
    "预警名单",
    "专项行动",
    "登记",
    "通知",
    "办法",
    "规定",
    "版税",
    "分成",
    "授权",
)

TOPIC_RULES = [
    (("preparedness", "emergency", "resilience"), "公共安全与应急准备"),
    (("commission", "commissioner", "eu", "european"), "欧盟政策动向"),
    (("rule", "regulation", "bill", "law", "order"), "监管与规则调整"),
    (("tariff", "trade", "export", "sanction", "embargo"), "贸易限制与跨境博弈"),
    (("tax", "budget", "spending", "inflation", "rate"), "财政税收与价格压力"),
    (("security", "defense", "military", "border", "immigration"), "国家安全与边境治理"),
    (("health", "drug", "medical", "disease"), "公共健康与医疗政策"),
    (("education", "school", "student"), "教育与人才政策"),
    (("climate", "energy", "carbon", "emissions"), "能源转型与气候议题"),
    (("housing", "rent", "property"), "住房与生活成本"),
    (("ai", "artificial intelligence", "llm", "model", "reasoning"), "大模型能力进展"),
    (("agent", "assistant", "workflow"), "AI 智能体落地"),
    (("funding", "raises", "raise", "investment", "valuation"), "AI 融资与资本动向"),
    (("chip", "gpu", "semiconductor", "nvidia", "tsmc"), "算力与芯片供给"),
    (("open source", "opensource"), "开源 AI 生态"),
    (("robot", "humanoid", "automation"), "机器人与自动化"),
    (("cyber", "privacy", "data"), "数据安全与网络治理"),
    (("router", "device", "hardware", "consumer internet"), "硬件设备与基础设施"),
    (("battery", "fusion", "quantum", "satellite", "space"), "前沿硬科技突破"),
    (("apple", "google", "microsoft", "meta", "amazon"), "科技巨头最新动作"),
    (("startup", "app", "platform"), "新产品与平台变化"),
    (("war", "attack", "missile", "conflict", "ceasefire"), "地缘冲突与安全风险"),
    (("election", "vote", "campaign"), "选举与政治博弈"),
    (("earthquake", "flood", "storm", "wildfire"), "自然灾害与气候冲击"),
    (("market", "stocks", "economy", "growth", "recession"), "经济预期与市场变化"),
]

HISTORY_RULES = [
    (
        ("tariff", "trade", "export", "sanction", "restriction", "embargo"),
        "这类事件和 2018 到 2019 年那轮贸易与限制升级很像，先打预期，再重排供应链。",
    ),
    (
        ("bill", "law", "rule", "order", "policy", "regulation", "agency", "government"),
        "性质上接近历次政策窗口期，真正影响往往不在标题，而在后面的执行细则和落地速度。",
    ),
    (
        ("ai", "artificial intelligence", "model", "llm", "agent", "reasoning"),
        "这和 2023 年生成式 AI 爆发早期很像，先卷能力，随后就会卷成本、速度和可用性。",
    ),
    (
        ("chip", "gpu", "semiconductor", "nvidia", "tsmc"),
        "这类消息的节奏接近过去几轮半导体竞赛，短期看供给与资本开支，长期看生态锁定。",
    ),
    (
        ("quantum", "battery", "fusion", "robot", "biotech", "space"),
        "这更像历次前沿技术突破新闻，科研热度一般会先跑在商业化前面。",
    ),
    (
        ("war", "attack", "missile", "conflict", "election", "security"),
        "和过去地缘政治冲击类似，先影响市场情绪，随后才逐步传导到价格、汇率和出行判断。",
    ),
]


def fetch_bytes(url: str, *, insecure: bool = False) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    if insecure:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        with urlopen(request, timeout=REQUEST_TIMEOUT, context=context) as response:
            return response.read()

    with urlopen(request, timeout=REQUEST_TIMEOUT) as response:
        return response.read()


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def clean_html(raw: str) -> str:
    if not raw:
        return ""
    text = re.sub(r"<[^>]+>", " ", raw)
    text = text.replace("&nbsp;", " ")
    text = text.replace("&amp;", "&")
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")
    return normalize_space(text)


def short_text(value: str, limit: int = 70) -> str:
    text = normalize_space(value)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def parse_datetime(raw: str) -> datetime:
    if not raw:
        return datetime.now(timezone.utc)

    value = raw.strip()
    try:
        if value.endswith("Z"):
            return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
        return datetime.fromisoformat(value).astimezone(timezone.utc)
    except ValueError:
        pass

    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except (TypeError, ValueError):
        pass

    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    return datetime.now(timezone.utc)


def keyword_in_text(text: str, keyword: str) -> bool:
    lower_text = text.lower()
    lower_keyword = keyword.lower()
    if re.fullmatch(r"[a-z0-9\.\+\-]{1,3}", lower_keyword):
        return re.search(rf"\b{re.escape(lower_keyword)}\b", lower_text) is not None
    return lower_keyword in lower_text


def matches_keywords(text: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword_in_text(text, keyword) for keyword in keywords)


def localize_source(name: str) -> str:
    return SOURCE_LABELS.get(name, name)


def mark_hidden(path: str) -> None:
    if os.name != "nt" or not os.path.exists(path):
        return
    try:
        attrs = ctypes.windll.kernel32.GetFileAttributesW(path)
        if attrs == -1:
            return
        ctypes.windll.kernel32.SetFileAttributesW(path, attrs | 0x02)
    except Exception:
        return


def infer_category(item: dict) -> str:
    text = " ".join([item.get("title", ""), item.get("summary_source", "")]).lower()
    if matches_keywords(text, AI_KEYWORDS):
        return "AI"
    return item["category"]


def clean_title_for_display(title: str) -> str:
    text = normalize_space(title)
    text = re.sub(r"^（[^）]{1,18}）", "", text)
    text = re.sub(r"^[^丨]{1,18}丨", "", text)
    text = re.sub(r"\s*[-_|丨]\s*(中新网|中国新闻网|新华网|人民网).*$", "", text)
    text = re.sub(r"\s*（[^）]*图[^）]*）$", "", text)
    text = re.sub(r"^今日关注[:：]\s*", "", text)
    text = normalize_space(text)
    if text and not re.search(r"[。！？]$", text):
        text += "。"
    return text


def looks_like_low_value_title(title: str) -> bool:
    clean_title = clean_title_for_display(title).rstrip("。")
    if "？" in clean_title or "?" in clean_title:
        return True
    return any(keyword in clean_title for keyword in LOW_VALUE_TITLE_KEYWORDS)


def fallback_summary_from_title(item: dict) -> str:
    title = clean_title_for_display(item.get("title", "")).rstrip("。")
    if not title:
        return ""

    if item.get("source") == "腾讯音乐官方":
        if "财报" in title:
            return "这是腾讯音乐最新披露的经营和业绩动态，重点看收入、付费用户和版权成本变化。"
        if "审计委员会" in title:
            return "这是腾讯音乐董事会和公司治理层面的调整，通常关系到审计与合规安排。"

    if item.get("source") == "国家版权局":
        if "著作权登记" in title:
            return "这是国家版权局公布的著作权登记新数据，能直接看出版权登记活跃度变化。"
        if "预警名单" in title:
            return "这是新的版权保护预警名单，和影视音乐内容传播、下架和维权动作直接相关。"
        if "专项行动" in title:
            return "这是官方启动的新一轮版权保护治理动作，后续通常会跟进执法和平台整改。"
        if "正版软件" in title:
            return "这是正版软件治理的新动作，重点看执行范围、检查要求和时间节点。"
        if "通知" in title or "办法" in title or "规定" in title:
            return "这是版权领域的新通知或规则调整，重点看执行对象、生效时间和配套细则。"

    if "印发" in title or "意见" in title or "决定" in title or "批复" in title:
        return "这是新的政策或监管动作，重点看执行范围、生效时间和后续配套细则。"
    if "签署" in title or "会见" in title:
        return "这是新的合作或外事动作，后续重点看是否带来更具体的项目、投资或政策变化。"
    if "逮捕" in title or "立案" in title or "宣判" in title:
        return "这是新的执法或司法进展，后续重点看处罚结果和是否引出更大范围治理。"
    if "宣布" in title or "启动" in title or "上线" in title:
        return "这是新的动作落地信号，后续重点看执行强度、影响范围和持续时间。"

    return f"{title}这条信息值得关注，重点看后续有没有更具体的执行动作。"


def build_content_summary(item: dict) -> str:
    summary = clean_html(item.get("summary_source", ""))
    title = clean_title_for_display(item.get("title", ""))
    if not summary:
        return fallback_summary_from_title(item)

    summary = re.sub(r"^(中新网|中新社)[^。]{0,40}电\s*(\([^)]*\))?\s*", "", summary)
    summary = re.sub(r"图为[^。]{0,80}(摄|供图)[。 ]*", "", summary)
    summary = re.sub(r"^\(?[^()]{1,20}\)?[:：]\s*", "", summary)
    summary = normalize_space(summary)

    sentences = [part.strip() for part in re.split(r"(?<=[。！？])", summary) if part.strip()]
    filtered_sentences: list[str] = []
    seen: set[str] = set()
    for sentence in sentences:
        key = re.sub(r"[^\w\u4e00-\u9fff]", "", sentence)
        if not key or key in seen:
            continue
        seen.add(key)
        filtered_sentences.append(sentence)
        if len(filtered_sentences) >= 2:
            break

    summary = normalize_space("".join(filtered_sentences)) or short_text(summary, 78)
    summary = short_text(summary, 88)
    if summary.startswith("图为") or summary.count("图为") >= 1:
        return fallback_summary_from_title(item)
    if len(re.sub(r"[^\w\u4e00-\u9fff]", "", summary)) < 8:
        return fallback_summary_from_title(item)
    if re.search(r"[A-Za-z]{12,}", summary):
        return fallback_summary_from_title(item)
    if not summary or summary == title.rstrip("。"):
        return fallback_summary_from_title(item)

    if not re.search(r"[。！？]$", summary):
        summary += "。"
    return summary


def localize_industry_title(title: str) -> str:
    text = normalize_space(title)
    replacements = [
        ("Tencent Music Entertainment Group", "腾讯音乐娱乐集团"),
        ("Announces", "公布"),
        ("to Report", "将公布"),
        ("Fourth Quarter and Full-Year", "第四季度及全年"),
        ("Fourth Quarter and Full Year", "第四季度及全年"),
        ("Third Quarter", "第三季度"),
        ("Unaudited Financial Results", "未审计财报"),
        ("Financial Results", "财报"),
        ("New Audit Committee Member", "新增审计委员会成员"),
    ]
    for source, target in replacements:
        text = text.replace(source, target)

    text = re.sub(
        r"\bon\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})",
        lambda match: f"（时间：{match.group(1)}）",
        text,
        flags=re.I,
    )
    text = text.replace("  ", " ")
    text = re.sub(r"\s+", " ", text).strip()
    if text and not re.search(r"[。！？]$", text):
        text += "。"
    return text


def canonical_title(title: str) -> str:
    text = clean_title_for_display(title).lower()
    text = text.replace("全力抢救无效", "抢救无效")
    text = text.replace("不幸去世", "去世")
    text = text.replace("逝世", "去世")
    text = text.replace("因心源性猝死", "心源性猝死")
    text = re.sub(r"[^\w\u4e00-\u9fff]", "", text)
    return text


def parse_xml_feed(payload: bytes, source: dict) -> list[dict]:
    root = ET.fromstring(payload)
    items: list[dict] = []

    if root.tag.endswith("rss"):
        channel = root.find("channel")
        if channel is None:
            return items

        for entry in channel.findall("item")[: source["limit"]]:
            title = normalize_space(entry.findtext("title", ""))
            link = normalize_space(entry.findtext("link", ""))
            summary = clean_html(entry.findtext("description", ""))
            published = (
                entry.findtext("pubDate")
                or entry.findtext("{http://purl.org/dc/elements/1.1/}date")
                or ""
            )
            if title and link:
                items.append(
                    {
                        "source": source["name"],
                        "source_zh": source["source_zh"],
                        "category": source["category"],
                        "title": title,
                        "summary_source": summary or title,
                        "url": link,
                        "published_at": parse_datetime(published),
                    }
                )
        return items

    atom_ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.findall("atom:entry", atom_ns)[: source["limit"]]:
        title = normalize_space(entry.findtext("atom:title", "", atom_ns))
        link = ""
        for link_node in entry.findall("atom:link", atom_ns):
            href = link_node.attrib.get("href")
            rel = link_node.attrib.get("rel", "alternate")
            if href and rel in ("alternate", ""):
                link = href
                break
        summary = clean_html(
            entry.findtext("atom:summary", "", atom_ns)
            or entry.findtext("atom:content", "", atom_ns)
        )
        published = (
            entry.findtext("atom:updated", "", atom_ns)
            or entry.findtext("atom:published", "", atom_ns)
        )
        if title and link:
            items.append(
                {
                    "source": source["name"],
                    "source_zh": source["source_zh"],
                    "category": source["category"],
                    "title": title,
                    "summary_source": summary or title,
                    "url": link,
                    "published_at": parse_datetime(published),
                }
            )

    return items


def fetch_rss_source(source: dict) -> list[dict]:
    payload = fetch_bytes(source["url"])
    return parse_xml_feed(payload, source)


def fetch_federal_register(limit: int = 6) -> list[dict]:
    payload = fetch_bytes(
        f"https://www.federalregister.gov/api/v1/documents.json?per_page={limit}&order=newest"
    )
    data = json.loads(payload.decode("utf-8"))
    items: list[dict] = []

    for result in data.get("results", [])[:limit]:
        title = normalize_space(result.get("title", ""))
        link = result.get("html_url", "")
        abstract = clean_html(result.get("abstract") or "")
        agency = ""
        if result.get("agencies"):
            agency = result["agencies"][0].get("name", "")

        if title and link:
            items.append(
                {
                    "source": "Federal Register",
                    "source_zh": localize_source("Federal Register"),
                    "category": "政策",
                    "title": title,
                    "summary_source": abstract or agency or title,
                    "url": link,
                    "published_at": parse_datetime(result.get("publication_date", "")),
                }
            )

    return items


def fetch_gov_cn_policy(limit: int = 12) -> list[dict]:
    payload = fetch_bytes(
        "https://www.gov.cn/zhengce/zuixin/ZUIXINZHENGCE.json",
        insecure=True,
    )
    data = json.loads(payload.decode("utf-8"))
    items: list[dict] = []

    for result in data[:limit]:
        title = normalize_space(result.get("TITLE", ""))
        link = result.get("URL", "")
        published = result.get("DOCRELPUBTIME", "")
        if title and link:
            items.append(
                {
                    "source": "中国政府网",
                    "source_zh": localize_source("中国政府网"),
                    "category": "政策",
                    "title": title,
                    "summary_source": result.get("SUB_TITLE", "") or title,
                    "url": link,
                    "published_at": parse_datetime(published),
                }
            )

    return items


def fetch_tencent_music_ir(limit: int = 6) -> list[dict]:
    payload = fetch_bytes("https://ir.tencentmusic.com/Press-Releases")
    html = payload.decode("utf-8", errors="ignore")
    pattern = re.compile(
        r'<div class="wd_date">(.*?)</div>\s*'
        r'<div class="wd_title"><a href="(.*?)">(.*?)</a></div>\s*'
        r'(?:.*?<div class="wd_summary"><p>(.*?)</p></div>)?',
        re.S,
    )

    items: list[dict] = []
    for raw_date, link, raw_title, raw_summary in pattern.findall(html)[:limit]:
        title = localize_industry_title(clean_html(raw_title))
        summary = clean_html(raw_summary)
        if not title or not link:
            continue
        items.append(
            {
                "source": "腾讯音乐官方",
                "source_zh": localize_source("腾讯音乐官方"),
                "category": "平台新规",
                "title": title,
                "summary_source": summary or title,
                "url": link,
                "published_at": parse_datetime(normalize_space(raw_date)),
            }
        )

    return items


def fetch_ncac_updates(limit: int = 8) -> list[dict]:
    payload = fetch_bytes("https://www.ncac.gov.cn/")
    html = payload.decode("utf-8", errors="ignore")
    pattern = re.compile(r'<a[^>]+href="([^"]*t\d+_\d+\.html)"[^>]*>(.*?)</a>', re.S)

    items: list[dict] = []
    seen: set[str] = set()
    for href, raw_title in pattern.findall(html):
        title = clean_html(raw_title)
        if not title:
            continue
        if title in seen:
            continue
        seen.add(title)
        if not matches_keywords(title, COPYRIGHT_RULE_KEYWORDS):
            continue

        published = datetime.now(timezone.utc)
        date_match = re.search(r"t(\d{8})_\d+\.html", href)
        if date_match:
            published = parse_datetime(date_match.group(1))

        items.append(
            {
                "source": "国家版权局",
                "source_zh": localize_source("国家版权局"),
                "category": "平台新规",
                "title": title,
                "summary_source": title,
                "url": urljoin("https://www.ncac.gov.cn/", href),
                "published_at": published,
            }
        )

        if len(items) >= limit:
            break

    return items


def extract_topic_zh(item: dict) -> str:
    haystack = " ".join([item.get("title", ""), item.get("summary_source", "")]).lower()
    for keywords, label in TOPIC_RULES:
        if matches_keywords(haystack, keywords):
            return label

    fallback = {
        "政策": "政策执行与监管变化",
        "AI": "AI 产业与产品进展",
        "科技": "科技产品与产业变化",
        "世界": "全球局势与关键变化",
    }
    return fallback.get(item["category"], "值得关注的新动态")


def build_summary(item: dict) -> str:
    return clean_title_for_display(item["title"])


def build_insight(item: dict) -> str:
    return build_content_summary(item)


def build_history(item: dict) -> str:
    return ""


def dedupe_items(items: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for item in items:
        key = canonical_title(item["title"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def sort_items(items: list[dict]) -> list[dict]:
    return sorted(items, key=lambda item: item["published_at"], reverse=True)


def score_item(item: dict) -> int:
    score = 0
    title = item.get("title", "")
    haystack = " ".join([title, item.get("summary_source", "")]).lower()
    published_at = item.get("published_at")

    if isinstance(published_at, datetime):
        now_local = datetime.now(LOCAL_TZ)
        published_local = published_at.astimezone(LOCAL_TZ)
        age_hours = max(0, (now_local - published_local).total_seconds() / 3600)

        if published_local.date() == now_local.date():
            score += 18
        elif age_hours <= 24:
            score += 14
        elif age_hours <= 48:
            score += 10
        elif age_hours <= 72:
            score += 6
        elif age_hours <= 168:
            score += 2
        elif age_hours > 720:
            score -= 10
        elif age_hours > 168:
            score -= 4

    if item.get("source") == "中国政府网":
        score += 8
    if item.get("source") == "国家版权局":
        score += 7
    if item.get("source") == "腾讯音乐官方":
        score += 8

    for keyword in PRIORITY_COMPANY_KEYWORDS:
        if keyword_in_text(haystack, keyword):
            score += 5

    for keyword in HIGH_SIGNAL_KEYWORDS:
        if keyword_in_text(haystack, keyword):
            score += 2

    for keyword in LOW_SIGNAL_KEYWORDS:
        if keyword_in_text(haystack, keyword):
            score -= 3

    for keyword in DIRECT_ACTION_KEYWORDS:
        if keyword_in_text(title, keyword):
            score += 2

    if looks_like_low_value_title(title):
        score -= 6

    if "《" in title and "》" in title:
        score += 2

    return score


def is_industry_focus_item(item: dict) -> bool:
    haystack = " ".join([item.get("title", ""), item.get("summary_source", "")]).lower()
    if item.get("source") in {"腾讯音乐官方", "国家版权局"}:
        return True
    return any(keyword_in_text(haystack, keyword) for keyword in INDUSTRY_FOCUS_KEYWORDS)


def sort_digest_items(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            item.get("item_score", score_item(item)),
            1 if item.get("industry_focus") else 0,
            item.get("published_at", ""),
        ),
        reverse=True,
    )


def choose_digest(items: list[dict], target: int = 20) -> list[dict]:
    now_local = datetime.now(LOCAL_TZ)
    recent: list[dict] = []
    older: list[dict] = []

    for item in items:
        published_at = item.get("published_at")
        if isinstance(published_at, str):
            published_at = parse_datetime(published_at)
        if isinstance(published_at, datetime):
            age_hours = max(0, (now_local - published_at.astimezone(LOCAL_TZ)).total_seconds() / 3600)
            if age_hours <= 72:
                recent.append(item)
            else:
                older.append(item)
        else:
            older.append(item)

    filtered = [item for item in recent if item.get("item_score", score_item(item)) >= 0]
    selected = sort_digest_items(filtered)

    if len(selected) < target:
        supplemental = [item for item in older if item.get("item_score", score_item(item)) >= 0]
        selected.extend(sort_digest_items(supplemental)[: target - len(selected)])

    if len(selected) < target:
        filtered_keys = {item["id"] for item in selected if "id" in item}
        leftovers = [item for item in sort_digest_items(items) if item.get("id") not in filtered_keys]
        selected.extend(leftovers[: target - len(selected)])

    return selected[:target]


def choose_industry_digest(items: list[dict], target: int = 12) -> list[dict]:
    now_local = datetime.now(LOCAL_TZ)
    recent: list[dict] = []
    older: list[dict] = []

    for item in items:
        published_at = item.get("published_at")
        if isinstance(published_at, str):
            published_at = parse_datetime(published_at)
        if isinstance(published_at, datetime):
            age_days = max(0, (now_local - published_at.astimezone(LOCAL_TZ)).total_seconds() / 86400)
            if age_days <= 90:
                recent.append(item)
            else:
                older.append(item)
        else:
            older.append(item)

    preferred = [
        item
        for item in recent
        if item.get("industry_focus")
        and not looks_like_low_value_title(item.get("title", ""))
    ]
    if not preferred:
        preferred = recent or items

    selected = sort_digest_items(preferred)[:target]
    if len(selected) < target:
        selected_ids = {item.get("id") for item in selected}
        selected.extend(
            [item for item in sort_digest_items(older) if item.get("id") not in selected_ids][: target - len(selected)]
        )
    return selected[:target]


def collect_all_items() -> tuple[list[dict], list[str]]:
    jobs: list[tuple[str, object]] = []
    for source in RSS_SOURCES:
        jobs.append((source["name"], lambda source=source: fetch_rss_source(source)))

    jobs.append(("中国政府网", fetch_gov_cn_policy))

    all_items: list[dict] = []
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=min(8, len(jobs))) as executor:
        future_map = {executor.submit(job): name for name, job in jobs}
        for future in as_completed(future_map):
            name = future_map[future]
            try:
                result = future.result()
                if result:
                    all_items.extend(result)
            except Exception as exc:
                errors.append(f"{name}: {exc}")

    return all_items, errors


def build_digest() -> dict:
    all_items, errors = collect_all_items()
    industry_raw: list[dict] = []

    try:
        industry_raw.extend(fetch_tencent_music_ir())
    except Exception as exc:
        errors.append(f"腾讯音乐官方: {exc}")

    try:
        industry_raw.extend(fetch_ncac_updates())
    except Exception as exc:
        errors.append(f"国家版权局: {exc}")

    unique = dedupe_items(all_items)
    enriched: list[dict] = []

    for index, item in enumerate(sort_items(unique), start=1):
        category = infer_category(item)
        item_score = score_item(item)
        enriched.append(
            {
                "id": f"brief-{index}",
                "category": category,
                "source": item["source"],
                "source_zh": item["source_zh"],
                "industry_focus": is_industry_focus_item(item),
                "item_score": item_score,
                "published_at": item["published_at"].isoformat(),
                "title": item["title"],
                "url": item["url"],
                "summary": build_summary(item),
                "content_summary": build_content_summary(item),
                "insight": build_insight(item),
                "history": build_history(item),
                "origin_note": short_text(item["summary_source"], 120),
            }
        )

    chosen = choose_digest(enriched, target=20)
    industry_pool = dedupe_items(all_items + industry_raw)
    industry_enriched: list[dict] = []

    for index, item in enumerate(sort_items(industry_pool), start=1):
        category = infer_category(item)
        industry_focus = True if item["source"] in {"腾讯音乐官方", "国家版权局"} else is_industry_focus_item(item)
        item_score = score_item(item) + (4 if item["source"] in {"腾讯音乐官方", "国家版权局"} else 0)
        industry_enriched.append(
            {
                "id": f"industry-{index}",
                "category": category,
                "source": item["source"],
                "source_zh": item["source_zh"],
                "industry_focus": industry_focus,
                "item_score": item_score,
                "published_at": item["published_at"].isoformat(),
                "title": item["title"],
                "url": item["url"],
                "summary": build_summary(item),
                "content_summary": build_content_summary(item),
                "insight": build_insight(item),
                "history": build_history(item),
                "origin_note": short_text(item["summary_source"], 120),
            }
        )

    industry_items = choose_industry_digest(industry_enriched, target=12)
    return {
        "appName": "DH KM 助理",
        "headline": "每日最新事件资讯",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(chosen),
        "items": chosen,
        "industryItems": industry_items,
        "errors": errors,
        "sources": [
            "中国政府网最新政策 JSON",
            "中新网滚动 RSS",
            "中新网国内 RSS",
            "中新网国际 RSS",
            "中新网财经 RSS",
            "中新网社会 RSS",
            "中新网法治 RSS",
            "腾讯音乐官方动态",
            "国家版权局官网",
        ],
    }


def load_snapshot() -> dict | None:
    try:
        with open(SNAPSHOT_PATH, "r", encoding="utf-8") as file:
            payload = json.load(file)
        if (
            isinstance(payload, dict)
            and payload.get("items")
            and isinstance(payload.get("industryItems"), list)
            and isinstance(payload["items"][0], dict)
            and "item_score" in payload["items"][0]
        ):
            return payload
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return None
    return None


def save_snapshot(payload: dict) -> None:
    temp_path = SNAPSHOT_PATH + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False)
    os.replace(temp_path, SNAPSHOT_PATH)
    mark_hidden(SNAPSHOT_PATH)


def refresh_cache_sync() -> dict:
    payload = build_digest()
    with CACHE_LOCK:
        MEMORY_CACHE["payload"] = payload
        MEMORY_CACHE["expires_at"] = time.time() + CACHE_TTL_SECONDS
        MEMORY_CACHE["refreshing"] = False
    save_snapshot(payload)
    return payload


def refresh_cache_async() -> None:
    with CACHE_LOCK:
        if MEMORY_CACHE["refreshing"]:
            return
        MEMORY_CACHE["refreshing"] = True

    def worker():
        try:
            refresh_cache_sync()
        except Exception:
            with CACHE_LOCK:
                MEMORY_CACHE["refreshing"] = False

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()


def get_cached_digest(force_refresh: bool = False) -> dict:
    now = time.time()
    cached_payload = None
    should_refresh = False

    with CACHE_LOCK:
        payload = MEMORY_CACHE["payload"]
        expires_at = MEMORY_CACHE["expires_at"]
        if force_refresh:
            pass
        elif payload and now < expires_at:
            return payload
        elif payload:
            cached_payload = payload
            should_refresh = True

    if force_refresh:
        return refresh_cache_sync()

    if cached_payload is not None:
        if should_refresh:
            refresh_cache_async()
        return cached_payload

    if not force_refresh:
        snapshot = load_snapshot()
        if snapshot:
            with CACHE_LOCK:
                if MEMORY_CACHE["payload"] is None:
                    MEMORY_CACHE["payload"] = snapshot
                    MEMORY_CACHE["expires_at"] = 0.0
            refresh_cache_async()
            return snapshot

    return refresh_cache_sync()


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.serve_health()
            return
        if parsed.path == "/api/briefing":
            query = parse_qs(parsed.query)
            force_refresh = query.get("refresh", ["0"])[0] == "1"
            self.serve_briefing(force_refresh=force_refresh)
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def serve_health(self):
        payload = json.dumps({"ok": True}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def serve_briefing(self, force_refresh: bool = False):
        try:
            payload = json.dumps(
                get_cached_digest(force_refresh=force_refresh),
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as exc:
            error_payload = json.dumps(
                {
                    "appName": "DH KM 助理",
                    "headline": "每日最新事件资讯",
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "count": 0,
                    "items": [],
                    "errors": [str(exc)],
                    "sources": [],
                },
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(error_payload)))
            self.end_headers()
            self.wfile.write(error_payload)


def main():
    snapshot = load_snapshot()
    if snapshot:
        with CACHE_LOCK:
            MEMORY_CACHE["payload"] = snapshot
            MEMORY_CACHE["expires_at"] = 0.0
    refresh_cache_async()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"DH KM 助理已启动: http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
