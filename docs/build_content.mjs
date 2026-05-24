import fs from "node:fs";
import path from "node:path";

const BASE_DIR = process.cwd();
const DOCS_DIR = path.join(BASE_DIR, "docs");
const CONTENT_JS = path.join(BASE_DIR, "content.js");

const RSS_SOURCES = [
  { name: "中新网滚动", category: "要闻", url: "https://www.chinanews.com.cn/rss/scroll-news.xml", limit: 12 },
  { name: "中新网国内", category: "国内", url: "https://www.chinanews.com.cn/rss/china.xml", limit: 12 },
  { name: "中新网国际", category: "国际", url: "https://www.chinanews.com.cn/rss/world.xml", limit: 12 },
  { name: "中新网财经", category: "财经", url: "https://www.chinanews.com.cn/rss/finance.xml", limit: 12 },
  { name: "中新网社会", category: "社会", url: "https://www.chinanews.com.cn/rss/society.xml", limit: 10 },
  { name: "中新网法治", category: "法治", url: "https://www.chinanews.com.cn/rss/fz.xml", limit: 8 },
  { name: "中新网科技", category: "科技", url: "https://www.chinanews.com.cn/rss/it.xml", limit: 10 },
];

const LOW_VALUE_KEYWORDS = ["财报", "业绩", "收益电话会", "季度业绩", "营收", "净利润"];
const INDUSTRY_KEYWORDS = [
  "网易", "网易云", "网易云音乐", "腾讯", "腾讯音乐", "QQ音乐", "酷狗", "酷我",
  "字节", "字节跳动", "抖音", "豆包", "飞书", "音乐人", "版权", "著作权",
  "版税", "分成", "分账", "商单", "发行", "平台", "AI", "人工智能", "芯片",
];
const INDUSTRY_STRONG_KEYWORDS = [
  "音乐", "音乐人", "网易云", "网易云音乐", "QQ音乐", "腾讯音乐", "酷狗", "酷我",
  "抖音", "抖音音乐", "字节", "版权", "著作权", "版税", "分成", "发行", "商单",
  "AI", "人工智能", "大模型", "芯片", "智能体", "量子", "设计", "创作工具", "平台规则",
];
const POLICY_KEYWORDS = [
  "新规", "政策", "规定", "办法", "通知", "版权", "著作权", "规则", "治理",
  "专项行动", "正版软件", "公示", "批复", "意见", "条例", "预警名单",
];

const SOURCES = [
  "OpenAI 官方",
  "Google DeepMind 官方",
  "Google 官方博客",
  "Suno 官方 / 帮助中心",
  "中国政府网｜最新政策",
  "国家版权局｜通知公告 / 要闻信息",
  "国家新闻出版署｜通知公示 / 要闻信息",
  "中国新闻网｜滚动 / 国内 / 国际 / 财经 / 社会 / 科技",
  "腾讯音乐 IR 官方",
  "网易云音乐创作者中心（官方入口）",
  "抖音音乐开放平台帮助中心（官方入口）",
];

const AI_SECTION = [
  ["智能体", "05/19 08:00", "OpenAI", "OpenAI 推进工作区智能体能力。", "OpenAI 持续强化工作区智能体场景，让智能体更适合在企业和团队任务里直接落地。", "这类更新的价值在于把聊天能力推进到真实工作流里，重点不是模型参数，而是智能体能不能真正接手长期任务。", "OpenAI 官方", "https://openai.com/index/introducing-workspace-agents-in-chatgpt//", "2026-05-19T08:00:00+08:00"],
  ["搜索 AI", "05/19 08:00", "Google", "Google Search 在 I/O 2026 推出 AI agents 新能力。", "Google 将 AI agents 能力接入搜索，让用户直接通过提问触发更复杂的任务处理。", "这类更新说明搜索产品正在从“找答案”转向“替你做事”，对 AI agent 产品形态很关键。", "Google 官方博客", "https://blog.google/products-and-platforms/products/search/search-io-2026/", "2026-05-19T08:00:00+08:00"],
  ["智能体", "04/15 08:00", "OpenAI", "OpenAI 更新 Agents SDK，强化智能体任务执行能力。", "新版 Agents SDK 强化了文件、命令和长任务处理能力，也补了更标准化的执行基础设施。", "这类更新对开发者非常重要，因为真正决定智能体能不能落地的，是工具调用、执行环境和稳定性。", "OpenAI 官方", "https://openai.com/index/the-next-evolution-of-the-agents-sdk", "2026-04-15T08:00:00+08:00"],
  ["智能体", "03/11 08:00", "OpenAI", "OpenAI 为 Responses API 补上计算机环境。", "Responses API 现在可以结合计算机环境工作，让模型向更完整的 agent 方向推进。", "这意味着智能体不再只是会回答问题，而是更接近能操作环境、执行复杂流程的系统。", "OpenAI 官方", "https://openai.com/index/equip-responses-api-computer-environment/", "2026-03-11T08:00:00+08:00"],
  ["开发工具", "03/04 08:00", "OpenAI", "OpenAI 推出 Codex app，面向多智能体协作开发。", "Codex app 把 coding agent 做成桌面工作台，让用户能直接监督和协同多个智能体。", "重点不是单次代码生成，而是智能体协同、项目监督和端到端开发流程。", "OpenAI 官方", "https://openai.com/index/introducing-the-codex-app/", "2026-03-04T08:00:00+08:00"],
  ["AI 云服务", "04/28 08:00", "OpenAI", "OpenAI 模型和 Managed Agents 接入 AWS。", "OpenAI 把模型和托管智能体能力带到 AWS Bedrock 场景，降低企业部署门槛。", "这类动作说明 agent 产品正在从实验工具进入企业基础设施层。", "OpenAI 官方", "https://openai.com/index/openai-on-aws", "2026-04-28T08:00:00+08:00"],
  ["智能体平台", "10/06 08:00", "OpenAI", "OpenAI 推出 AgentKit，覆盖构建、部署和评估。", "AgentKit 把可视化流程、前端嵌入和评估工具整合在一起，方便开发者落地 agent。", "对于 AI agent 领域来说，这代表平台化建设正在提速。", "OpenAI 官方", "https://openai.com/index/introducing-agentkit/", "2025-10-06T08:00:00+08:00"],
  ["AI 助手", "07/17 08:00", "OpenAI", "ChatGPT agent 整合 Operator 与深度研究能力。", "ChatGPT agent 让模型不仅能对话，还能结合浏览器、研究和工具直接完成任务。", "这类整合最值得关注的，是智能体真正从单一模型能力转向完整产品能力。", "OpenAI 官方", "https://openai.com/index/introducing-chatgpt-agent/", "2025-07-17T08:00:00+08:00"],
  ["模型进展", "05/10 08:00", "Google", "Google DeepMind 持续主推 Gemini 3.5 作为新一代行动型模型。", "Gemini 3.5 的定位不只是多模态，而是面向行动型任务和更强工作流能力。", "在 AI 领域里，这类模型定义变化，往往比单次 benchmark 更有意义。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["生成视频", "05/10 08:00", "Google", "Google DeepMind 持续强化 Veo 视频生成能力。", "Veo 继续代表 Google 在生成视频和音视频理解方向上的核心布局。", "如果你关注生成视频赛道，这一类产品会持续是重点观察对象。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["图像生成", "05/10 08:00", "Google", "Google DeepMind 持续强化 Imagen 图像生成能力。", "Imagen 继续作为 Google 图像生成主力产品，重点方向是细节表现和创意控制。", "图像生成已经很卷，真正值得看的是控制力、质感和产品接入深度。", "Google DeepMind 官方", "https://deepmind.google/models/imagen/", "2026-05-10T08:00:00+08:00"],
  ["AI 音乐", "05/10 08:00", "Google", "Google DeepMind 持续推进 Lyria 3 音乐生成。", "Lyria 3 是 Google 在高保真音乐与音频生成方向的重要产品。", "你既然关心音乐领域，这类 AI 音乐模型就是必须长期跟踪的对象。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["图像生成", "05/10 08:00", "Google", "Nano Banana 2 继续强化图像生成与编辑。", "Google 把 Nano Banana 2 放在图像生成和编辑场景中，强调速度与成图能力。", "这一类工具更贴近普通创作者和视觉工作流，是值得看功能落地的方向。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["机器人", "05/10 08:00", "Google", "Google DeepMind 推进 Gemini Robotics。", "Gemini Robotics 继续代表 Google 在智能体与机器人结合方向上的探索。", "这类能力虽然离大众产品还有距离，但会决定 AI agent 的下一阶段边界。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["世界模型", "05/10 08:00", "Google", "Google DeepMind 推进 Genie 3 世界模型方向。", "Genie 3 更偏世界模型与交互式生成环境，是 DeepMind 长线技术路线的重要部分。", "世界模型和 agent 的结合，是未来 AI 系统从工具走向环境级能力的关键。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["AI 音乐", "03/26 08:00", "Suno", "Suno v5.5 发布，强化声音表达和个性控制。", "Suno v5.5 新增 Voices、Custom models 和 My Taste，让音乐生成更可控。", "这类更新对音乐创作者最有价值，因为它直接提升生成音乐的个性表达和可调性。", "Suno 官方", "https://suno.com/blog", "2026-03-26T08:00:00+08:00"],
  ["AI 音乐", "02/18 08:00", "Suno", "Suno Studio 1.2 发布，增强音乐细节编辑能力。", "Suno Studio 1.2 强调更精细的音乐编辑和控制，比如 Remove FX 与拍号支持。", "和“直接生成一首歌”相比，这类功能更接近真正可用的音乐工作流。", "Suno 官方帮助中心", "https://help.suno.com/en/articles/10625089", "2026-02-18T08:00:00+08:00"],
  ["AI 音乐", "02/23 08:00", "Suno", "Suno 持续强化文本作曲、人声、歌词和节拍生成能力。", "Suno 把 AI 音乐创作做成一整套产品，从文本成歌到旋律、人声和节拍生成都在打磨。", "这类产品趋势值得长期看，因为它正在改变普通创作者进入音乐创作的门槛。", "Suno 官方", "https://suno.com/hub/create-music-with-ai", "2026-02-23T08:00:00+08:00"],
  ["开放模型", "05/10 08:00", "Google", "Google DeepMind 推进 Gemma 4 开放模型。", "Gemma 4 继续作为 Google 的开放模型方向，强调智能密度与开放使用场景。", "开源和开放模型一直是 AI 生态里非常关键的一条线，值得持续放进这栏。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"],
  ["多模态", "05/10 08:00", "Google", "Google DeepMind 推进 Gemini Omni，多模态创作能力再强化。", "Gemini Omni 走的是“从任何输入创造任何内容”的方向，覆盖多模态创作。", "多模态能力是 AI 产品升级的核心方向，尤其会影响视频、图像、文本和音频一体化工作流。", "Google DeepMind 官方", "https://deepmind.google/models/", "2026-05-10T08:00:00+08:00"]
];

const SEED_CONTENT = {
  latest: [
    ["国内", "05/06 16:12", "北京", "中方：将依法坚决维护中国公民和企业的正当权益。", "中国政府表示，将依法坚决维护中国公民和企业的正当权益。", "相关表态体现出对外部变化和企业权益保护的明确态度，这类信息对判断外部环境和企业经营预期很有参考价值。", "中国新闻网", "https://www.chinanews.com.cn/gn/2026/05-06/10616330.shtml", "2026-05-06T16:12:27+08:00"],
    ["外事", "05/06 15:20", "北京", "王毅同伊朗外长阿拉格齐会谈。", "王毅同伊朗外长阿拉格齐会谈，聚焦地区局势与外交沟通。", "这类外事信息往往不只是会谈本身，更重要的是后续相关地区局势、国际协调和政策表态的变化。", "中国新闻网", "https://www.chinanews.com.cn/gn/2026/05-06/10616266.shtml", "2026-05-06T15:20:51+08:00"],
    ["国际", "05/05 23:07", "泰国", "泰国内阁废除与柬海域备忘录 柬埔寨外交部回应。", "泰国内阁废除相关海域备忘录，柬埔寨外交部作出回应。", "地区间协议变化往往会影响外交、安全和海域合作判断，属于值得持续跟进的国际局势信息。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T23:07:00+08:00"],
    ["国际", "05/05 22:44", "阿联酋", "阿联酋称防空系统正应对导弹和无人机袭击。", "阿联酋称其防空系统正在应对导弹和无人机袭击。", "这类信息直接反映中东地区安全局势变化，对能源、市场和国际关系判断都有即时影响。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T22:44:00+08:00"],
    ["国际", "05/05 22:43", "伊朗", "伊朗最高领袖外事顾问：伊美之间仍处于战争状态。", "伊朗方面表示，伊美之间仍处于战争状态。", "这类表态会强化地区风险预期，也会继续影响全球安全、能源与资本市场情绪。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T22:43:00+08:00"],
    ["科技", "05/05 21:11", "国际", "2025年国际量子科学技术年全面评估报告出炉。", "国际量子科学技术年全面评估报告发布，反映量子领域阶段性进展。", "量子技术属于高前沿领域，这类报告适合放进最新资讯，因为它既有科技意义，也有产业和国际竞争参考价值。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T21:11:00+08:00"],
    ["国际", "05/05 20:08", "中东", "以军称打死哈马斯精锐部队“努赫巴”指挥官。", "以军称打死哈马斯精锐部队“努赫巴”指挥官。", "这类信息属于地区冲突升级中的关键节点，适合进入最新资讯栏目持续跟进。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T20:08:00+08:00"],
    ["国际", "05/05 18:17", "泰国", "泰国内阁批准借款逾百亿美元应对能源危机。", "泰国内阁批准大规模借款，以应对能源危机。", "能源和财政联动的政策动作，既影响本国民生，也会影响国际市场和区域经济判断。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T18:17:00+08:00"],
    ["国际", "05/05 17:52", "霍尔木兹海峡", "伊朗称美军在霍尔木兹海峡袭击民船 造成5人死亡。", "伊朗称霍尔木兹海峡发生袭击事件，造成5人死亡。", "这类涉及关键航运通道的消息，对全球能源、贸易和安全局势判断都极具敏感性。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T17:52:00+08:00"],
    ["要闻", "05/03 09:00", "全国", "网信部门严管“自媒体”未规范标注信息来源行为。", "网信部门加强对“自媒体”未规范标注信息来源行为的管理。", "这类规则与治理动作，直接影响内容传播秩序和平台生态，也与信息可信度建设密切相关。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gn/2026/0503/news.shtml", "2026-05-03T09:00:00+08:00"],
    ["国际", "05/02 06:56", "联合国", "中国担任安理会5月轮值主席 将聚焦三项重点。", "中国担任联合国安理会5月轮值主席，将聚焦三项重点。", "这类外事消息具备明确的国际议程意义，影响对中国外交动作和国际协同方向的判断。", "中国新闻网", "https://www.chinanews.com.cn/gj/2026/05-02/10612772.shtml", "2026-05-02T06:56:00+08:00"],
  ],
  policy: [
    ["版权保护", "04/29 08:00", "国家版权局", "2026年度第六批重点作品版权保护预警名单（院线电影）。", "国家版权局公布新一批重点作品版权保护预警名单。", "这类预警名单会直接影响平台传播、内容下架和版权治理，是音乐和影视内容行业必须关注的规则信号。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/", "2026-04-29T08:00:00+08:00"],
    ["版权规则", "04/29 08:00", "国家版权局", "中国版权协会发布《关于强化微短剧领域“通知—删除”规则的工作指南》。", "关于微短剧领域“通知—删除”规则的工作指南发布。", "这条信息会直接影响平台内容治理、版权申诉和创作者发布环境，适合放在政策新规栏。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/", "2026-04-29T08:00:00+08:00"],
    ["政策新规", "04/20 08:00", "苏州", "2026年全国知识产权宣传周版权主题活动启动仪式暨长三角版权协同发展主题活动在苏州举行。", "版权主题活动启动，释放版权治理、宣传和协同发展信号。", "这类活动类信息常常伴随新政策方向、版权治理动作和行业倡导内容，适合作为规则风向信号保留。", "国家版权局", "https://www.ncac.gov.cn/xxfb/ywxx/202604/t20260420_985429.html", "2026-04-20T08:00:00+08:00"],
    ["政策新规", "04/01 08:00", "全国", "关于开展2026年全国知识产权宣传周活动的通知。", "全国知识产权宣传周活动通知发布，聚焦新兴领域知识产权保护。", "这类通知反映全年政策宣传重点和治理方向，适合放进政策新规栏目里。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/202604/t20260401_976611.html", "2026-04-01T08:00:00+08:00"],
    ["版权保护", "04/03 08:00", "国家版权局", "2026年度第五批重点作品版权保护预警名单（院线电影）。", "国家版权局公布第五批重点作品版权保护预警名单。", "持续更新的预警名单说明版权治理动作是常态化的，适合保留在政策新规里作为连贯观察项。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/", "2026-04-03T08:00:00+08:00"],
    ["版权保护", "03/31 08:00", "国家版权局", "2026年度第四批重点作品版权保护预警名单（电视剧）。", "国家版权局发布第四批重点作品版权保护预警名单。", "这类名单关系到平台内容治理、侵权处理与传播边界。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/", "2026-03-31T08:00:00+08:00"],
    ["政策新规", "03/22 08:00", "全国", "中共中央办公厅 国务院办公厅印发《国有企业领导人员廉洁从业规定》。", "围绕国企领导人员廉洁从业的最新规定已经印发，后续重点看执行与配套细则。", "这类政策信息的核心不是标题本身，而是落地后的适用范围、实施强度和后续是否有更多细则同步出台。", "中国政府网", "https://www.gov.cn/zhengce/202603/content_7063468.htm", "2026-03-22T00:00:00+00:00"],
    ["版权动态", "03/20 08:00", "北京", "推进使用正版软件工作部际联席会议第十五次全体会议在京召开。", "正版软件推进会议召开，反映版权治理和规范化使用软件的持续强化。", "这类信息会影响到软件采购、内容生产和版权治理方向，对创作行业和企业合规都有现实意义。", "国家版权局", "https://www.ncac.gov.cn/xxfb/ywxx/202603/t20260320_964877.html", "2026-03-20T00:00:00+00:00"],
    ["版权新规", "03/17 08:00", "国家版权局", "国家版权局关于公布2025年全国著作权登记情况的通知。", "全国著作权登记情况公布，对音乐、设计和内容行业判断版权趋势有直接参考价值。", "这类信息直接关系到内容产业、创作环境和版权保护强度，后续可继续延展到音乐人、设计师和平台生态层面的变化。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/202603/t20260317_962958.html", "2026-03-17T00:00:00+00:00"],
    ["版权保护", "02/14 08:00", "国家版权局", "民间文艺版权保护与促进试点申报表。", "民间文艺版权保护与促进试点申报工作发布。", "这类试点工作能反映版权保护从制度走向落地推进，对内容和文化行业有现实意义。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/202602/t20260214_954089.html", "2026-02-14T08:00:00+08:00"],
    ["版权保护", "02/10 08:00", "全国", "国家版权局等四部门启动2026年院线电影版权保护专项行动。", "院线电影版权保护专项行动启动，体现版权打击和保护力度持续增强。", "虽然表面是电影领域，但这类专项行动对整个内容产业的版权意识、平台治理和侵权打击都具有风向标意义。", "国家版权局", "https://www.ncac.gov.cn/xxfb/ywxx/202602/t20260210_949671.html", "2026-02-10T00:00:00+00:00"],
  ],
  industry: [
    ["规则动向", "04/29 08:00", "国家版权局", "中国版权协会发布《关于强化微短剧领域“通知—删除”规则的工作指南》。", "微短剧领域“通知—删除”规则指南发布，直接关系平台内容治理与版权处理。", "这类规则会直接影响平台审核、创作者发布和内容下架机制。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/", "2026-04-29T08:00:00+08:00"],
    ["版权动向", "04/20 08:00", "苏州", "2026年全国知识产权宣传周版权主题活动启动仪式暨长三角版权协同发展主题活动在苏州举行。", "版权主题活动启动，释放版权治理、宣传和协同发展信号。", "这类活动常常同步释放制度方向、行业协同和平台治理趋势。", "国家版权局", "https://www.ncac.gov.cn/xxfb/ywxx/202604/t20260420_985429.html", "2026-04-20T08:00:00+08:00"],
    ["科技动向", "05/05 21:11", "国际", "2025年国际量子科学技术年全面评估报告出炉。", "国际量子科学技术年全面评估报告发布，反映量子领域阶段性进展。", "量子技术属于高前沿领域，这类报告适合放进行业动向，因为它既有科技意义，也有产业和国际竞争参考价值。", "中国新闻网", "https://www.chinanews.com.cn/scroll-news/gj/2026/0505/news.shtml", "2026-05-05T21:11:00+08:00"],
    ["产业动向", "03/24 22:03", "北京", "郑栅洁会见韩国三星电子会长李在镕。", "发改委负责人会见三星电子会长，信息释放出高水平开放和产业合作的延续信号。", "这类公司和政策层面的会见信息，虽然不像热搜那样直白，但对科技产业、制造链和国际商业合作判断很有价值。", "中新网财经", "https://www.chinanews.com.cn/cj/2026/03-24/10592181.shtml", "2026-03-24T14:03:46+00:00"],
    ["科技动向", "03/24 21:59", "杭州", "全球计量技术专家齐聚杭州 共商计量科技创新发展。", "全球计量技术专家在杭州集中讨论科技创新发展，体现产业基础能力的升级趋势。", "计量关系到工业、制造、芯片、实验和技术验证，是很多高科技产业的底层能力支撑。", "中新网财经", "https://www.chinanews.com.cn/cj/2026/03-24/10592174.shtml", "2026-03-24T14:02:14+00:00"],
    ["平台入口", "05/15 13:00", "", "网易云音乐创作者中心官方入口已接入。", "网易云音乐创作者中心官方入口已接入，后续将持续跟进规则更新。", "当前先将网易云音乐创作者中心纳入来源白名单，后续继续补入更稳定的规则、说明和平台动向内容。", "网易云音乐创作者中心", "https://musicupload.netease.com/", "2026-05-15T13:00:00+08:00"],
    ["平台入口", "05/15 13:00", "", "抖音音乐开放平台官方帮助中心已接入。", "抖音音乐开放平台官方帮助中心已接入，后续将持续跟进规则更新。", "当前先将抖音音乐开放平台纳入来源白名单，后续继续补入更稳定的平台规则、帮助文档和机制变化内容。", "抖音音乐开放平台", "https://music.douyin.com/support/content/root?spaceId=299", "2026-05-15T13:00:00+08:00"],
    ["规则动向", "03/17 08:00", "国家版权局", "国家版权局关于公布2025年全国著作权登记情况的通知。", "全国著作权登记情况公布，对音乐、设计和内容行业判断版权趋势有直接参考价值。", "这类信息直接关系到内容产业、创作环境和版权保护强度，也会影响平台和创作者对版权环境的判断。", "国家版权局", "https://www.ncac.gov.cn/xxfb/tzgg/202603/t20260317_962958.html", "2026-03-17T00:00:00+00:00"],
    ["规则动向", "03/20 08:00", "北京", "推进使用正版软件工作部际联席会议第十五次全体会议在京召开。", "正版软件推进会议召开，反映版权治理和规范化使用软件的持续强化。", "这类内容会影响软件合规、创作生产和平台治理，也属于内容行业生态的重要组成部分。", "国家版权局", "https://www.ncac.gov.cn/xxfb/ywxx/202603/t20260320_964877.html", "2026-03-20T00:00:00+00:00"],
  ],
};

function fromArray([category, time, location, title, summary, content, source, url, publishedAt]) {
  return { category, time, location, title, summary, content, source, url, publishedAt };
}

for (const key of Object.keys(SEED_CONTENT)) {
  SEED_CONTENT[key] = SEED_CONTENT[key].map(fromArray);
}

const AI_ITEMS = AI_SECTION.map(fromArray);

function cleanHtml(text = "") {
  return text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function shortText(text = "", length = 88) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) return normalized;
  return normalized.slice(0, length - 1).trimEnd() + "…";
}

function hasChineseText(text = "") {
  return /[\u4e00-\u9fff]/.test(text);
}

function isChineseDominant(text = "") {
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const asciiLetters = (text.match(/[A-Za-z]/g) || []).length;
  return chinese > 0 && chinese >= asciiLetters;
}

function parseDatetime(value = "") {
  if (!value) return new Date();
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return new Date(`${compact[1]}-${compact[2]}-${compact[3]}T00:00:00+08:00`);
  return new Date();
}

function formatTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function inferLocation(text = "") {
  const match = text.match(/(北京|上海|天津|重庆|山东|杭州|深圳|广州|菲律宾|日本|韩国|全球|全国|苏州|阿联酋|伊朗|泰国|中东|联合国)/);
  return match ? match[1] : "";
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "DH-KM-Assistant/3.0" } });
  if (!response.ok) throw new Error(`${url} => ${response.status}`);
  return await response.text();
}

function parseRssItems(xml, source) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = regex.exec(xml)) && items.length < source.limit) {
    const block = match[1];
    const title = cleanHtml((block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || block.match(/<title>(.*?)<\/title>/s) || [, ""])[1]);
    const link = cleanHtml((block.match(/<link>(.*?)<\/link>/s) || [, ""])[1]);
    const description = cleanHtml((block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s) || block.match(/<description>(.*?)<\/description>/s) || [, ""])[1]);
    const pubDate = cleanHtml((block.match(/<pubDate>(.*?)<\/pubDate>/s) || [, ""])[1]);
    if (!title || !link) continue;
    if (!isChineseDominant(title)) continue;
    if (LOW_VALUE_KEYWORDS.some((keyword) => title.includes(keyword))) continue;
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

async function fetchGovCn(limit = 12) {
  const text = await fetchText("https://www.gov.cn/zhengce/zuixin/ZUIXINZHENGCE.json");
  const data = JSON.parse(text);
  return data.slice(0, limit).map((item) => {
    const published = parseDatetime(item.DOCRELPUBTIME || "");
    const title = String(item.TITLE || "").trim();
    if (!isChineseDominant(title)) return null;
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
  }).filter(Boolean);
}

async function fetchNcac(limit = 12) {
  const html = await fetchText("https://www.ncac.gov.cn/xxfb/tzgg/");
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
  const items = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(html)) && items.length < limit) {
    const href = match[1];
    const title = cleanHtml(match[2]);
    if (!title || seen.has(title)) continue;
    if (!isChineseDominant(title)) continue;
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

async function fetchTencentIr(limit = 10) {
  const html = await fetchText("https://ir.tencentmusic.com/Press-Releases");
  const regex = /<div class="wd_date">(.*?)<\/div>\s*<div class="wd_title"><a href="(.*?)">(.*?)<\/a><\/div>\s*(?:.*?<div class="wd_summary"><p>(.*?)<\/p><\/div>)?/gs;
  const items = [];
  let match;
  while ((match = regex.exec(html)) && items.length < limit) {
    const [, rawDate, link, rawTitle, rawSummary] = match;
    const title = cleanHtml(rawTitle);
    const summary = cleanHtml(rawSummary);
    if (!title || LOW_VALUE_KEYWORDS.some((keyword) => title.includes(keyword))) continue;
    if (!isChineseDominant(title)) continue;
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

function sortAndLimit(items, limit = 20) {
  const unique = new Map();
  for (const item of items) {
    if (!unique.has(item.title)) unique.set(item.title, item);
  }
  return [...unique.values()].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, limit);
}

function isIndustryRelevant(item) {
  const text = `${item.title} ${item.summary} ${item.content} ${item.source}`;
  if (!hasChineseText(text)) return false;
  if (item.category === "要闻") return false;
  return INDUSTRY_STRONG_KEYWORDS.some((keyword) => text.includes(keyword));
}

function scoreIndustry(item) {
  const text = `${item.title} ${item.summary} ${item.content}`;
  let score = 0;
  if (/音乐|音乐人|版税|分成|网易云|QQ音乐|腾讯音乐|抖音音乐|发行|商单|版权|著作权/.test(text)) score += 10;
  if (/AI|人工智能|大模型|芯片|智能体|量子|科技/.test(text)) score += 6;
  if (/设计|创作工具|平台规则/.test(text)) score += 4;
  return score;
}

function fillWithBestAvailable(primary, pool, limit = 20) {
  const chosen = sortAndLimit(primary, limit);
  const seen = new Set(chosen.map((item) => item.title));
  const backup = sortAndLimit(pool, 200);
  for (const item of backup) {
    if (chosen.length >= limit) break;
    if (seen.has(item.title)) continue;
    chosen.push(item);
    seen.add(item.title);
  }
  return chosen.slice(0, limit);
}

function latestRelevant(item) {
  const text = `${item.title} ${item.summary} ${item.content}`;
  return hasChineseText(text) && !/创作者中心官方入口已接入|帮助中心已接入|平台入口/.test(text);
}

function policyRelevant(item) {
  const text = `${item.title} ${item.summary} ${item.content}`;
  if (!hasChineseText(text)) return false;
  if (/官方入口已接入|帮助中心已接入|平台入口/.test(text)) return false;
  return POLICY_KEYWORDS.some((keyword) => text.includes(keyword));
}

function rankIndustry(items) {
  return [...items].sort((a, b) => scoreIndustry(b) - scoreIndustry(a) || new Date(b.publishedAt) - new Date(a.publishedAt));
}

async function buildPayload() {
  const latestLive = [];
  for (const source of RSS_SOURCES) {
    try {
      latestLive.push(...(await fetchRssSource(source)));
    } catch {}
  }

  const policyLive = [];
  try {
    policyLive.push(...(await fetchGovCn()));
  } catch {}
  try {
    policyLive.push(...(await fetchNcac()));
  } catch {}

  const industryLive = [];
  try {
    industryLive.push(...(await fetchTencentIr()));
  } catch {}

  for (const item of [...latestLive, ...policyLive]) {
    const text = `${item.title} ${item.summary} ${item.source}`;
    if (INDUSTRY_KEYWORDS.some((keyword) => text.includes(keyword)) && isIndustryRelevant(item)) {
      industryLive.push({ ...item, category: "行业动向" });
    }
  }

  const latestPool = AI_ITEMS.filter((item) => isChineseDominant(item.title));

  const policyPool = [
    ...policyLive.filter(policyRelevant),
    ...SEED_CONTENT.policy.filter(policyRelevant),
    ...SEED_CONTENT.industry.filter(policyRelevant),
  ];

  const industryPool = rankIndustry([
    ...industryLive.filter(isIndustryRelevant),
    ...SEED_CONTENT.industry.filter(isIndustryRelevant),
    ...SEED_CONTENT.policy.filter(isIndustryRelevant),
  ]);

  const latestSection = fillWithBestAvailable(latestPool, latestPool, 20);
  const policySection = fillWithBestAvailable(policyPool, policyPool, 20);
  const industrySection = fillWithBestAvailable(industryPool, industryPool, 20);

  return {
    updatedAt: new Date().toISOString(),
    views: {
      latest: {
        kicker: "实时更新",
        title: "AI领域相关资讯",
        description: "优先展示 AI agent、智能体、OpenAI、Google、Suno、生成视频、新模型和新功能更新。",
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
