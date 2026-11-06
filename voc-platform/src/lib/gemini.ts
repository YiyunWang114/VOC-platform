// AI分析引擎 - 支持DeepSeek和模拟模式
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const USE_MOCK = process.env.AI_MOCK === 'true'; // 设置 AI_MOCK=true 启用模拟模式

// 自动检测：如果 API Key 为空，强制使用 mock 模式
const FORCE_MOCK = !DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.length < 5;

interface AnalysisResult {
  sentiment: string;
  category: string;
  coreIssue: string;
  userDemand: string;
  urgency: string;
  churnRisk: number;
}

// ========== 流失风险关键词库 ==========
const CHURN_CRITICAL = ['再也不买', '转黑', '拉黑', '一生黑', '取关', '卸载', '退群', '再也不用', '永远不买', '再也不来', '黑名单', '差评到底', '曝光', '维权', '举报', '投诉到底', '再也不推荐', '彻底失望', '死忠变黑', '粉转黑'];
const CHURN_HIGH = ['退款', '退货', '差评', '垃圾', '骗人', '假货', '失望', '不会再买', '浪费钱', '太差了', '不推荐', '劝退', '避雷', '踩雷', '后悔', '上当', '受骗', '再也不', '不会再', '不会再回购', '不会再来'];
const CHURN_MEDIUM = ['一般', '凑合', '还行吧', '不太满意', '有待改进', '体验差', '不如', '差劲', '不好用', '没效果', '不划算', '不值', '贵了', '慢了', '态度差'];

// ========== 模拟流失风险评分 ==========
function mockChurnRisk(content: string): number {
  if (CHURN_CRITICAL.some(w => content.includes(w))) return Math.floor(Math.random() * 10) + 90; // 90-100
  if (CHURN_HIGH.some(w => content.includes(w))) return Math.floor(Math.random() * 15) + 70;   // 70-85
  if (CHURN_MEDIUM.some(w => content.includes(w))) return Math.floor(Math.random() * 20) + 40; // 40-60
  return Math.floor(Math.random() * 30) + 5; // 5-35
}

// ========== 增强版智能安抚话术模板库 ==========
function mockSmartReply(
  content: string,
  coreIssue: string,
  userDemand: string,
  tone: 'sincere' | 'professional' | 'concise' = 'sincere',
  sentiment: string = '消极'
): string {
  // 判断情绪类型
  const isPositive = sentiment === '积极' || sentiment === 'positive';
  const isNeutral = sentiment === '中性' || sentiment === 'neutral';

  // 好评/中性反馈：感谢+互动引导，不需要道歉
  if (isPositive || isNeutral) {
    const positiveTemplates: Record<string, string[]> = {
      sincere: [
        `非常感谢您分享关于${coreIssue}的宝贵体验！看到您满意我们特别开心，您的认可就是对我们团队最大的鼓励。如果您愿意，欢迎晒图分享您的使用心得，让更多小伙伴发现这份美好。期待您继续陪伴我们成长！`,
        `读到您关于${coreIssue}的好评，我们整个团队都倍感温暖！感谢您愿意花时间写下这些真挚的感受。为表谢意，我们准备了一份小惊喜[请填入补偿金额]元心意券已发放到您的账户，期待您下次光临！`,
        `太开心了！看到您对${coreIssue}的认可，我们所有的努力都值得了。您的每一条好评都是我们前进的动力。如果您有任何其他想法或建议，随时联系[请填入专员联系电话]，我们随时倾听！`,
        `感谢您就${coreIssue}给予的认可！您的满意是我们坚持品质的初心。我们已将您的反馈收录进"用户好评案例库"，作为团队激励。期待您继续关注我们的新品，会有更多惊喜等着您！`,
        `真心感谢您对${coreIssue}的肯定！像您这样用心分享的用户是我们最珍贵的财富。如果您愿意加入我们的"产品体验官"计划，可以优先试用新品，联系[请填入专员联系电话]了解详情。`,
      ],
      professional: [
        `尊敬的客户，感谢您就${coreIssue}提供的正面反馈。您的认可已录入我司VOC系统，将作为产品优化及服务提升的重要参考。为表谢意，[请填入补偿金额]元会员积分已到账，期待您的持续关注。`,
        `尊敬的客户，感谢您分享关于${coreIssue}的使用体验。您的满意是我们持续改进的动力源泉。我司已为您升级会员权益，详情可咨询[请填入专员联系电话]。期待为您提供更优质的服务。`,
        `尊敬的客户，感谢您就${coreIssue}给予的高度评价。您的反馈已同步至产品研发及品控部门，成为团队复盘会的正面案例。诚邀您关注我们的新品发布，将有专属老客礼遇。`,
      ],
      concise: [
        `感谢您对${coreIssue}的认可！[请填入补偿金额]元券已到账，期待您下次光临。`,
        `谢谢好评！${coreIssue}得到您的肯定我们很开心，欢迎继续关注我们。`,
        `感谢您的认可！${coreIssue}我们会继续保持，期待您再次体验。`,
      ],
    };
    const templates = positiveTemplates[tone] || positiveTemplates.sincere;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // 差评/负面反馈：原有安抚逻辑
  // 根据诉求选择模板分支
  const demandLower = userDemand.toLowerCase();
  const isRefund = demandLower.includes('退款') || demandLower.includes('赔偿');
  const isExchange = demandLower.includes('换货') || demandLower.includes('换新');
  const isComplaint = demandLower.includes('吐槽') || demandLower.includes('仅');
  const isApology = demandLower.includes('道歉');
  const isExplain = demandLower.includes('解释');

  // 诚恳版模板（每个分支至少5条，避免重复）
  const sincereTemplates: Record<string, string[]> = {
    refund: [
      `非常抱歉让您经历了${coreIssue}的糟糕体验，这完全不是我们希望带给您的感受。针对您的退款诉求，我们已为您开启极速退款绿色通道，[请填入专属退货链接]，审核通过后款项将在24小时内原路退回。同时我们已将此问题同步至品控部门彻查整改，恳请您给我们一次弥补的机会。`,
      `对于${coreIssue}给您造成的不便，我们深感抱歉。您的退款申请已优先处理，请点击[请填入专属退货链接]提交退货信息，我们承担全部退货运费。退款将在仓库签收后24小时内到账。您的反馈对我们至关重要，我们会认真改进。`,
      `真的很抱歉因为${coreIssue}让您失望了。您的退款请求我们已经加急处理，[请填入专属退货链接]是您的专属通道，无需排队等待。退款到账后我们会第一时间短信通知您，同时附赠[请填入补偿金额]元心意券表达歉意。`,
      `看到您因为${coreIssue}而困扰，我们心里也很不好受。退款事宜已安排专人一对一跟进，[请填入专员联系电话]是您专属客服的直线电话。我们承诺从申请到到账全程不超过48小时，绝不让您再为这件事费心。`,
      `非常理解您因为${coreIssue}想要退款的心情，换作是我们也会这样做。退款链接已生成：[请填入专属退货链接]，点击即可提交，无需填写复杂信息。退货运费我们全包，额外再送您一张[请填入补偿金额]元无门槛券，希望能稍微弥补这次的遗憾。`,
    ],
    exchange: [
      `抱歉让您收到了有问题的商品，${coreIssue}确实令人失望。我们已为您预留全新商品，[请填入换货链接]，提交后新商品将优先发货，同时安排快递上门取回问题商品，全程无需您承担运费。感谢您的包容与理解。`,
      `非常抱歉商品出现了${coreIssue}的问题。我们已为您安排换新服务，[请填入换货链接]，新商品预计48小时内发出。为表歉意，随包裹附赠一份小礼品。希望这次能给您带来满意的体验。`,
      `因为${coreIssue}让您收到不完美的商品，我们真的很抱歉。新的商品已经从仓库优先拣货，[请填入换货链接]提交后24小时内发出。快递员会同时把新商品送到并取走有问题的商品，您不用跑一趟，全程我们承担费用。`,
      `商品出现${coreIssue}是我们不愿看到的。换货申请已为您提前审批通过，[请填入换货链接]一键提交即可。新商品发出时我们会做三重质检，确保这次完美无瑕。另外随包裹准备了[请填入补偿金额]元心意卡，感谢您的耐心。`,
      `非常抱歉${coreIssue}影响了您的使用体验。我们已锁定同款商品的优质批次为您预留，[请填入换货链接]提交申请后优先发货。如果您愿意，也可以联系[请填入专员联系电话]直接挑选其他等价商品替换，灵活满足您的需求。`,
    ],
    complaint: [
      `抱歉让您有了不愉快的体验，关于${coreIssue}的问题，我们真诚向您致歉。您的反馈我已第一时间提交给产品研发中心和品控部门，他们将在3个工作日内给出专项改进方案。为感谢您的宝贵意见，我们为您准备了[请填入补偿金额]元无门槛优惠券，期待您看到我们的改变。`,
      `对于${coreIssue}给您带来的困扰，我们深感抱歉。您的声音我们已经完整记录并提交至产品研发中心，相关团队正在紧急复盘。我们承诺会在7天内通过站内信向您同步改进进展。附上[请填入补偿金额]元心意券，恳请您继续监督我们的成长。`,
      `感谢您愿意花时间来反馈${coreIssue}的问题，您的每一条意见对我们来说都弥足珍贵。我已经把您的案例标注为"重点改进项"直接呈报给产品总监，[请填入专员联系电话]是我的直线，有任何进展我会第一时间通知您。`,
      `读完您关于${coreIssue}的反馈，我们整个团队都进行了深刻反思。这不是一句"抱歉"就能带过的，我们已经在召集研发、品控、供应链三方会议彻查根因。3天内我会亲自向您汇报改进方案，[请填入补偿金额]元账户余额先奉上，恳请您见证我们的改变。`,
      `您提到的${coreIssue}问题戳中了我们的痛点，说明我们在[请填入具体环节]上确实还有很大提升空间。您的反馈已录入我们的VOC重点案例库，成为本月产品复盘会的核心议题。[请填入专员联系电话]是产品负责人的联系方式，欢迎您直接对话，一起把产品做得更好。`,
    ],
    apology: [
      `对于${coreIssue}给您带来的不愉快，我们郑重向您道歉。这确实是我们工作的疏忽，没有任何借口。道歉不能弥补您的损失，但请相信我们改正的决心。[请填入补偿金额]元诚意金已发放到您的账户，同时[请填入专员联系电话]将全程跟进后续处理。`,
      `非常抱歉因为${coreIssue}让您有了糟糕的体验，我们真诚地向您说一声对不起。您的遭遇让我们意识到流程上的漏洞，我们已经在连夜整改。除了[请填入补偿金额]元补偿外，我们愿意为您提供[请填入额外补偿方案]，希望能获得您的谅解。`,
      `看到您因为${coreIssue}而生气，我们完全理解，换作是我们也会一样。在这里正式向您道歉，是我们的错。为了表达诚意，[请填入专员联系电话]——这是客服总监的直线，您有任何不满可以直接跟他说，我们绝不推脱。`,
      `关于${coreIssue}，我们想真诚地向您道歉。问题发生后我们没有第一时间处理好，让您反复沟通，这更是我们的失职。[请填入补偿金额]元只是小小心意，更重要的是我们已建立"同类问题48小时闭环"机制，确保不再有人经历您的不愉快。`,
      `对不起，因为${coreIssue}让您失望了。我们不找理由，只找解决方案。除了已发放的[请填入补偿金额]元补偿，我们还想邀请您成为我们的"产品体验官"，您的意见将直接传达给CEO办公室。[请填入专员联系电话]期待您的回音。`,
    ],
    explain: [
      `关于您提到的${coreIssue}，我们查阅了相关记录并想向您说明情况。[请填入原因说明]。这确实给您带来了困扰，我们深表歉意。为避免类似问题，我们已[请填入改进措施]。如有任何疑问，请随时联系[请填入专员联系电话]。`,
      `感谢您就${coreIssue}寻求解释，这让我们有机会把情况说清楚。[请填入原因说明]。但解释不等于推脱，我们承认在这个过程中存在沟通不及时的问题。[请填入补偿金额]元心意券已到账，希望能弥补这次不愉快的沟通体验。`,
      `关于${coreIssue}，我们想给您一个透明的交代。[请填入原因说明]。这不是我们想要的结果，我们已经在[请填入改进措施]上做了紧急调整。完整的说明报告会在24小时内发送到您预留的邮箱，[请填入专员联系电话]随时解答您的任何疑问。`,
      `您有权知道${coreIssue}的来龙去脉，我们绝不隐瞒。[请填入原因说明]。虽然事出有因，但影响到了您的体验就是我们的责任。除了详细的书面说明，[请填入专员联系电话]会一对一为您解读，确保您完全了解情况。`,
      `对于${coreIssue}，我们整理了一份详细的说明供您参考：[请填入原因说明]。我们理解这个解释可能无法完全消除您的不快，所以额外准备了[请填入补偿金额]元补偿和[请填入额外补偿方案]。 transparency是我们的承诺，[请填入专员联系电话]随时待命。`,
    ],
    default: [
      `非常抱歉让您经历了${coreIssue}的不愉快体验。我们已安排专人跟进您的问题，[请填入专员联系电话]，工作时间内随时为您服务。同时此案例已升级至客服主管亲自督办，确保给您一个满意的解决方案。`,
      `对于${coreIssue}给您造成的困扰，我们深表歉意。您的诉求我们已完整记录并加急处理，[请填入专员联系电话]是您的专属对接通道。我们承诺在24小时内给出明确解决方案，绝不让您的问题石沉大海。`,
      `了解到您遇到的${coreIssue}问题，我们非常重视。已为您分配专属客服[请填入专员姓名]，电话[请填入专员联系电话]，从这一刻起由他/她全程跟进您的案例，不再让您重复描述问题。我们承诺48小时内给出让您满意的答复。`,
      `关于${coreIssue}，我们不想让您等待和焦虑。您的案例已被标记为"优先处理"，[请填入专员联系电话]是直通客服经理的热线。无论最终结果如何，我们保证在24小时内给您一个明确的交代，期间每6小时主动同步一次进展。`,
      `非常理解${coreIssue}给您带来的不便，我们已经启动了内部快速响应流程。[请填入专员联系电话]是您的专属联络窗口，他/她已经提前了解了您的全部情况，您无需重复说明。我们会像对待自己的问题一样对待您的问题，直到彻底解决。`,
    ],
  };

  // 专业版模板
  const professionalTemplates: Record<string, string[]> = {
    refund: [
      `尊敬的客户，针对您反馈的${coreIssue}问题，我司深表歉意。经核实，您的退款诉求符合我司售后政策，现已为您开通优先退款通道：[请填入专属退货链接]。退款将于仓库签收后24小时内原路返还。相关品控报告将同步发送至您预留邮箱。`,
      `尊敬的客户，关于${coreIssue}的售后申请已受理。您的退款请求已通过审核，[请填入专属退货链接]为专属退货通道。我司承担退货运费，退款将在物流签收后T+1工作日到账。如有疑问请联系[请填入专员联系电话]。`,
      `尊敬的客户，${coreIssue}问题给您造成的不便，我司诚挚致歉。退款流程已启动，请在[请填入专属退货链接]提交退货信息。款项将在质检完成后24小时内原路退回，届时您将收到短信通知。`,
    ],
    exchange: [
      `尊敬的客户，关于${coreIssue}的商品异常，我司已启动换货流程。请通过[请填入换货链接]提交申请，新商品将于48小时内发出，运费由我司承担。异常商品将由物流上门回收，无需您额外操作。`,
      `尊敬的客户，${coreIssue}问题已记录并提交售后部门。换货申请已预审批通过，[请填入换货链接]可查看进度。新商品已从优质批次预留，预计48小时内发出。`,
    ],
    complaint: [
      `尊敬的客户，感谢您就${coreIssue}问题提出的宝贵反馈。该案例已录入我司VOC系统并提交至产品研发中心，改进方案将于7个工作日内出具。为表诚意，[请填入补偿金额]元账户余额已发放至您的会员账户，请查收。`,
      `尊敬的客户，您反馈的${coreIssue}已生成工单[请填入工单号]，流转至产品研发及品控部门。改进进展将通过站内信同步，预计7个工作日内出具根因分析报告。[请填入补偿金额]元已发放，感谢您推动我们进步。`,
    ],
    apology: [
      `尊敬的客户，对于${coreIssue}给您造成的不良体验，我司正式致歉。该事件已触发内部质量回溯流程，相关责任方已启动整改。[请填入补偿金额]元诚意金已到账，[请填入专员联系电话]将全程跟进。`,
    ],
    explain: [
      `尊敬的客户，关于${coreIssue}的说明如下：[请填入原因说明]。我司承认在[请填入具体环节]存在不足，已制定改进计划。[请填入专员联系电话]可为您提供进一步解读。`,
    ],
    default: [
      `尊敬的客户，您反馈的${coreIssue}问题已收到。我司已指派客服专员全程跟进，专属对接热线：[请填入专员联系电话]。处理进度将每日同步，确保问题闭环。感谢您的耐心与理解。`,
      `尊敬的客户，${coreIssue}问题已录入CRM系统并分配至专属客服[请填入专员姓名]。您可通过[请填入专员联系电话]或企业微信直接联系，处理进度实时可查。`,
    ],
  };

  // 简短版模板
  const conciseTemplates: Record<string, string[]> = {
    refund: [
      `抱歉${coreIssue}给您带来困扰。退款已优先处理：[请填入专属退货链接]，24小时内到账。`,
      `退款通道已开：[请填入专属退货链接]。${coreIssue}问题我们承担全责，运费全免。`,
      `抱歉因${coreIssue}退款。链接：[请填入专属退货链接]，T+1到账，请注意查收。`,
    ],
    exchange: [
      `抱歉商品出现${coreIssue}。换货链接：[请填入换货链接]，新商品48小时发出，上门取旧。`,
      `换货已审批：[请填入换货链接]。${coreIssue}商品快递上门回收，新货优先发。`,
    ],
    complaint: [
      `抱歉${coreIssue}影响您的体验。反馈已提交研发中心，[请填入补偿金额]元券已到账。`,
      `${coreIssue}已录入改进清单。补偿[请填入补偿金额]元，7天内同步进展。`,
    ],
    apology: [
      `为${coreIssue}正式致歉。[请填入补偿金额]元已补偿，[请填入专员联系电话]跟进。`,
    ],
    explain: [
      `关于${coreIssue}：[请填入原因说明]。疑问请联系[请填入专员联系电话]。`,
    ],
    default: [
      `抱歉${coreIssue}给您带来不便。专员已跟进：[请填入专员联系电话]，24小时内给方案。`,
      `${coreIssue}已加急处理。[请填入专员联系电话]专属对接，6小时同步一次。`,
    ],
  };

  // 选择模板集
  let templates: Record<string, string[]>;
  if (tone === 'professional') templates = professionalTemplates;
  else if (tone === 'concise') templates = conciseTemplates;
  else templates = sincereTemplates;

  // 选择诉求分支
  let branch = 'default';
  if (isRefund) branch = 'refund';
  else if (isExchange) branch = 'exchange';
  else if (isApology) branch = 'apology';
  else if (isExplain) branch = 'explain';
  else if (isComplaint) branch = 'complaint';

  const branchTemplates = templates[branch] || templates.default;
  return branchTemplates[Math.floor(Math.random() * branchTemplates.length)];
}

// ========== 增强版情绪识别词库 ==========
// 否定词：当否定词+负面词组合时，情绪应反转
const NEGATION_WORDS = ['不', '没', '无', '非', '别', '未', '勿', '不曾', '不必', '不要', '不会', '不能', '没有'];

// 程度副词：增强情绪权重
const INTENSIFIERS = ['非常', '很', '太', '超级', '巨', '特别', '十分', '极其', '相当', '格外', '无比', '真', '真的', '实在', '确实'];
const DIMINISHERS = ['有点', '稍微', '略', ' somewhat', '比较', '还算', '勉强', '一般'];

// 负面词库（带权重）
const NEGATIVE_WORDS: Record<string, number> = {
  // 通用负面
  '烂脸': 3, '过敏': 3, '痒': 2, '痛': 2, '差': 2, '垃圾': 3, '假': 2, '骗': 3,
  '退款': 1, '投诉': 2, '破损': 2, '漏': 2, '变质': 3, '过期': 3, '拉肚子': 3,
  '中毒': 3, '伤害': 3, '危险': 3, '难用': 2, '失望': 2, '后悔': 2, '上当': 3,
  '受骗': 3, '踩雷': 2, '避雷': 1, '劝退': 2, '差评': 2, '退货': 1, '浪费': 2,
  '不值': 2, '贵了': 1, '慢了': 1, '态度差': 2, '推脱': 2, '敷衍': 2, '糊弄': 2,
  '粗糙': 2, '劣质': 3, ' defective': 3, '故障': 2, '坏了': 2, '断裂': 2, '脱落': 2,
  // 美妆/护肤负面
  '卡粉': 2, '浮粉': 2, '脱妆': 2, '暗沉': 2, '闷痘': 3, '搓泥': 2, '拔干': 2,
  '油腻': 1, '刺激': 2, '泛红': 2, '起皮': 2, '斑驳': 2, '结块': 2, '晕染': 1,
  '假白': 2, '假滑': 1, '反光': 1, '厚重': 1, '闷': 1, '粘腻': 1, '难闻': 2,
  '刺鼻': 2, '辣眼睛': 3, '糊眼睛': 2, '流白汤': 2, '氧化': 1, '发黄': 1,
};

// 正面词库（带权重）
const POSITIVE_WORDS: Record<string, number> = {
  // 通用正面
  '好': 1, '赞': 2, '不错': 1, '喜欢': 2, '满意': 2, '回购': 2, '推荐': 2,
  '完美': 3, '滋润': 2, '高级': 2, '棒': 2, '惊喜': 2, '舒服': 2, '值得': 2,
  '划算': 2, '便宜': 1, '优惠': 1, '好用': 2, '有效': 2, '明显': 1, '改善': 2,
  '修复': 2, '提升': 1, '爱了': 2, '种草': 2, '安利': 2, '好评': 2, '回购': 2,
  '囤货': 2, '必备': 2, '首选': 2, '惊艳': 3, '出色': 2, '优秀': 2, '给力': 2,
  // 美妆/护肤正面
  '服帖': 2, '持妆': 2, '显色': 2, '显白': 2, '自然': 2, '清透': 2, '轻薄': 2,
  '水润': 2, '保湿': 2, '补水': 2, '提亮': 2, '遮瑕': 2, '均匀': 1, '细腻': 2,
  '光滑': 2, '柔嫩': 2, '紧致': 2, '抗皱': 2, '温和': 2, '清爽': 2, '不刺激': 3,
  '不过敏': 3, '不闷痘': 3, '不卡粉': 3, '不假白': 3, '不假滑': 2, '不搓泥': 3,
  '不拔干': 3, '不暗沉': 3, '不脱妆': 3, '不浮粉': 3, '不晕染': 2, '不结块': 2,
  '防水': 2, '防汗': 2, '持久': 2, '显气质': 2, '有质感': 2, '高级': 2,
  '奶油肌': 2, '水光肌': 2, '雾面': 1, '哑光': 1, '丝绒': 1, '缎光': 1,
};

// 中性/客观词（不计入情绪评分，但用于分类）
const NEUTRAL_WORDS = ['但是', '不过', '虽然', '然而', '只是', '可惜', '遗憾'];

// ========== 智能语义分析引擎 ==========
function analyzeSentiment(content: string): { sentiment: string; score: number; details: string[] } {
  const details: string[] = [];
  let positiveScore = 0;
  let negativeScore = 0;

  // 1. 检测整句否定+负面/正面的组合（优先匹配更长的词）
  // 先处理带"不"的正面表达（如"不假白"、"不卡粉"）
  for (const [word, weight] of Object.entries(POSITIVE_WORDS)) {
    if (word.startsWith('不') && content.includes(word)) {
      positiveScore += weight * 1.5; // 否定+负面=正面，加权奖励
      details.push(`✓ 检测到正面组合词"${word}"(+${weight * 1.5})`);
    }
  }

  // 2. 检测否定词+负面词的组合（如"不刺激"已在POSITIVE_WORDS中处理）
  // 检测否定词+正面词的组合（如"不喜欢"=负面）
  for (const neg of NEGATION_WORDS) {
    for (const [posWord, weight] of Object.entries(POSITIVE_WORDS)) {
      if (!posWord.startsWith('不') && content.includes(neg + posWord)) {
        negativeScore += weight;
        details.push(`✗ 检测到否定+正面"${neg}${posWord}"(-${weight})`);
      }
    }
  }

  // 3. 检测程度副词+情绪词的组合
  for (const intensifier of INTENSIFIERS) {
    for (const [negWord, weight] of Object.entries(NEGATIVE_WORDS)) {
      if (content.includes(intensifier + negWord)) {
        negativeScore += weight * 1.5;
        details.push(`✗ 检测到强化负面"${intensifier}${negWord}"(-${weight * 1.5})`);
      }
    }
    for (const [posWord, weight] of Object.entries(POSITIVE_WORDS)) {
      if (!posWord.startsWith('不') && content.includes(intensifier + posWord)) {
        positiveScore += weight * 1.5;
        details.push(`✓ 检测到强化正面"${intensifier}${posWord}"(+${weight * 1.5})`);
      }
    }
  }

  // 4. 基础情绪词匹配（排除已处理的组合）
  for (const [word, weight] of Object.entries(NEGATIVE_WORDS)) {
    if (content.includes(word)) {
      // 检查是否已被否定词+该词的组合处理过
      const isNegated = NEGATION_WORDS.some(n => content.includes(n + word));
      if (!isNegated && !word.startsWith('不')) {
        negativeScore += weight;
        details.push(`✗ 检测到负面词"${word}"(-${weight})`);
      }
    }
  }

  for (const [word, weight] of Object.entries(POSITIVE_WORDS)) {
    if (content.includes(word)) {
      // 检查是否被否定
      const isNegated = NEGATION_WORDS.some(n => content.includes(n + word) && !word.startsWith('不'));
      if (!isNegated) {
        positiveScore += weight;
        details.push(`✓ 检测到正面词"${word}"(+${weight})`);
      }
    }
  }

  // 5. 转折词检测（转折后通常更重要）
  const turnIndex = NEUTRAL_WORDS.findIndex(w => content.includes(w));
  if (turnIndex >= 0) {
    // 简单处理：如果有转折，后半句权重*1.2
    const turnWord = NEUTRAL_WORDS[turnIndex];
    const latterHalf = content.split(turnWord)[1] || '';
    if (latterHalf) {
      details.push(`↪ 检测到转折词"${turnWord}"，后半句权重提升`);
    }
  }

  // 6. 最终情绪判定
  const netScore = positiveScore - negativeScore;
  let sentiment: string;
  if (netScore >= 1.5) {
    sentiment = '积极';
  } else if (netScore <= -1.5) {
    sentiment = '消极';
  } else {
    sentiment = '中性';
  }

  // 特殊规则：如果包含极端负面词且没有被否定，强制消极
  const extremeNegative = ['烂脸', '中毒', '伤害', '危险', '假货', '骗人'];
  const hasExtremeNeg = extremeNegative.some(w => {
    const isNegated = NEGATION_WORDS.some(n => content.includes(n + w));
    return content.includes(w) && !isNegated;
  });
  if (hasExtremeNeg && sentiment !== '消极') {
    sentiment = '消极';
    details.push('⚠ 包含极端负面词，强制判定为消极');
  }

  return { sentiment, score: netScore, details };
}

// ========== 增强版模拟AI分析 ==========
function mockAnalyze(content: string): AnalysisResult {
  // 使用新的语义分析引擎
  const sentimentResult = analyzeSentiment(content);
  const sentiment = sentimentResult.sentiment;
  const isNegative = sentiment === '消极';
  const isPositive = sentiment === '积极';

  // 分类（增强版）
  let category = '其他';
  if (/物流|快递|发货|配送|到货|邮|运输/.test(content)) category = '物流';
  else if (/客服|服务|态度|回复|推脱|售后/.test(content)) category = '服务';
  else if (/包装|盒子|外观|瓶|盖|颜值|设计/.test(content)) category = '包装';
  else if (/价格|贵|便宜|券|性价比|划算|优惠|活动/.test(content)) category = '价格';
  else if (/质量|效果|成分|味道|质地|过敏|烂脸|功效|肤感|保湿|遮瑕|持妆|显色/.test(content)) category = '产品质量';

  // 核心痛点（改进：尝试提取更精准的问题描述）
  let coreIssue = content.length > 15 ? content.slice(0, 15) : content;
  // 尝试匹配"XX不好"、"XX很差"等模式
  const issueMatch = content.match(/(.{2,8})(?:不好|很差|有问题|不行|差劲|糟糕)/);
  if (issueMatch) {
    coreIssue = issueMatch[0].slice(0, 15);
  }

  // 诉求（增强版）
  let userDemand = '仅想吐槽';
  if (/退款|赔偿|退钱/.test(content)) userDemand = '要求退款';
  else if (/换货|换新|更换/.test(content)) userDemand = '要求换货';
  else if (/解决|处理|回复|跟进|处理一下/.test(content)) userDemand = '寻求解决方案';
  else if (/道歉|致歉|认错/.test(content)) userDemand = '要求道歉';
  else if (/解释|说明|原因/.test(content)) userDemand = '要求解释';
  else if (isPositive) userDemand = '好评分享';

  // 紧急程度（增强版）
  let urgency = '低';
  if (/烂脸|过敏.*严重|中毒|拉肚子|伤害|危险|安全隐患|进医院|就医|急诊/.test(content)) urgency = '高';
  else if (/过敏|痒|痛|泛红|刺激|闷痘/.test(content)) urgency = '中';
  else if (isNegative) urgency = '中';

  // 流失风险
  const churnRisk = mockChurnRisk(content);

  return { sentiment, category, coreIssue, userDemand, urgency, churnRisk };
}

// ========== 带重试机制的API调用工具 ==========
interface ApiCallOptions {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  timeoutMs?: number;
  retries?: number;
}

async function callDeepSeekWithRetry<T>(
  options: ApiCallOptions,
  parser: (data: unknown) => T | null
): Promise<{ result: T | null; usedMock: boolean; error?: string }> {
  const { url, headers, body, timeoutMs = 15000, retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      // 4xx 错误不重试（客户端错误）
      if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text().catch(() => '');
        console.error(`DeepSeek API ${response.status} 错误 (尝试 ${attempt}/${retries}):`, errorText.slice(0, 200));
        return { result: null, usedMock: true, error: `API ${response.status}: ${errorText.slice(0, 100)}` };
      }

      if (!response.ok) {
        // 5xx 或其他错误，尝试重试
        console.warn(`DeepSeek API ${response.status} (尝试 ${attempt}/${retries})，${attempt < retries ? '准备重试...' : '放弃重试'}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1))); // 指数退避: 1s, 2s, 4s
          continue;
        }
        return { result: null, usedMock: true, error: `API ${response.status}  after ${retries} retries` };
      }

      const data = await response.json();
      const parsed = parser(data);

      if (parsed) {
        return { result: parsed, usedMock: false };
      }

      // 解析失败，尝试重试
      console.warn(`DeepSeek API 响应解析失败 (尝试 ${attempt}/${retries})`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      return { result: null, usedMock: true, error: '响应解析失败' };

    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.message.includes('timeout'));
      const isNetworkError = error instanceof Error && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNREFUSED'));

      console.error(`DeepSeek API 调用失败 (尝试 ${attempt}/${retries}):`, isTimeout ? '请求超时' : isNetworkError ? '网络错误' : error);

      if (attempt < retries && (isTimeout || isNetworkError || !error)) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return { result: null, usedMock: true, error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  return { result: null, usedMock: true, error: '所有重试均失败' };
}

// ========== 反馈分析（含流失风险 + 重试机制） ==========
export async function analyzeFeedback(content: string): Promise<AnalysisResult & { usedMock?: boolean; error?: string }> {
  console.log(`[AI分析] USE_MOCK=${USE_MOCK}, FORCE_MOCK=${FORCE_MOCK}, API_KEY=${DEEPSEEK_API_KEY.slice(0, 8)}...`);

  // 模拟模式直接返回
  if (USE_MOCK || FORCE_MOCK) {
    console.log('[AI分析] 使用本地规则分析引擎（mock模式）');
    return { ...mockAnalyze(content), usedMock: true };
  }

  console.log('[AI分析] 调用 DeepSeek API 进行分析...');

  const prompt = `你是一个专业的用户反馈分析专家。请对以下用户反馈进行深度语义拆解，并以严格的JSON格式返回分析结果。

用户反馈："${content}"

请从以下6个维度进行分析：
1. sentiment（情绪）：只能返回 "积极"、"中性" 或 "消极"
2. category（业务归属）：返回最相关的分类，如"产品质量"、"服务"、"物流"、"包装"、"价格"、"其他"
3. coreIssue（核心痛点）：用15个字以内的一句话高度概括具体问题
4. userDemand（用户诉求）：提炼用户的核心动机，如"要求退款"、"要求换货"、"仅想吐槽"、"寻求解决方案"等
5. urgency（紧急程度）：智能风控评估。若涉及人身伤害、安全隐患、严重质量问题等，返回"高"；一般问题返回"中"；轻微建议返回"低"
6. churnRisk（流失风险评分）：0-100的整数。根据文本中"再也不买"、"转黑"、"退款"等极端词汇判断客户流失概率。0-30为低风险，31-60为中风险，61-85为高风险，86-100为极高风险。

必须返回纯JSON格式，不要包含任何其他文字：
{
  "sentiment": "...",
  "category": "...",
  "coreIssue": "...",
  "userDemand": "...",
  "urgency": "...",
  "churnRisk": 0
}`;

  const { result, usedMock, error } = await callDeepSeekWithRetry({
    url: `${DEEPSEEK_BASE_URL}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个专业的用户反馈分析专家，只返回JSON格式结果。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    },
    timeoutMs: 15000,
    retries: 3,
  }, (data) => {
    const text = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || '中性',
        category: parsed.category || '其他',
        coreIssue: parsed.coreIssue || content.slice(0, 15),
        userDemand: parsed.userDemand || '未明确',
        urgency: parsed.urgency || '中',
        churnRisk: Math.min(100, Math.max(0, parseInt(parsed.churnRisk) || mockChurnRisk(content))),
      };
    }
    return null;
  });

  if (result) {
    console.log('[DeepSeek API] 分析调用成功');
    return { ...result, usedMock, error };
  }

  // 降级到本地分析
  console.warn('[DeepSeek API] 分析失败，降级到本地语义分析引擎');
  return { ...mockAnalyze(content), usedMock: true, error };
}

// ========== 智能安抚话术生成（带重试机制 + 语气微调） ==========
export async function generateSmartReply(
  feedback: {
    rawContent: string;
    category: string;
    coreIssue: string;
    userDemand: string;
    sentiment: string;
    churnRisk: number;
  },
  tone: 'sincere' | 'professional' | 'concise' = 'sincere'
): Promise<{ reply: string; usedMock: boolean; error?: string }> {
  console.log(`[智能回复] USE_MOCK=${USE_MOCK}, FORCE_MOCK=${FORCE_MOCK}, API_KEY=${DEEPSEEK_API_KEY.slice(0, 8)}...`);

  // 模拟模式
  if (USE_MOCK || FORCE_MOCK) {
    console.log('[智能回复] 使用本地话术模板库（mock模式）');
    return {
      reply: mockSmartReply(feedback.rawContent, feedback.coreIssue, feedback.userDemand, tone, feedback.sentiment),
      usedMock: true,
    };
  }

  console.log('[智能回复] 调用 DeepSeek API 生成回复...');

  // 判断情绪类型
  const isPositive = feedback.sentiment === '积极' || feedback.sentiment === 'positive' || feedback.sentiment === '正面';
  const isNeutral = feedback.sentiment === '中性' || feedback.sentiment === 'neutral';

  // 语气描述映射
  const toneDescriptions: Record<string, string> = {
    sincere: '语气要非常真诚、温暖、充满共情，像一位贴心的朋友在对话。多用"抱歉让您..."、"我们深感..."等表达，情感浓度高。',
    professional: '语气要专业、干练、有条理，像一位资深客服主管在处理客诉。用词规范、逻辑清晰，体现品牌专业度。',
    concise: '语气要简洁明了、直击要点，适合移动端快速阅读。去掉冗余修饰，保留核心信息，字数控制在80字以内。',
  };

  // 好评/中性反馈的prompt
  if (isPositive || isNeutral) {
    const positivePrompt = `# Role (角色)
你是一位拥有10年经验的资深客户关系管理专家，擅长维护用户忠诚度与品牌口碑。

# Task (任务)
用户的反馈是正面或中性的，你的任务是撰写一段温暖、真诚的"感谢与互动回复话术"，目的是：
1. 感谢用户的认可与分享
2. 强化品牌与用户之间的情感连接
3. 引导用户继续互动（如晒图、关注新品、加入会员等）
4. 适当给予回馈（如优惠券、积分等）

# Input Variables (输入变量)
- 用户原始反馈：${feedback.rawContent}
- 核心反馈点：${feedback.coreIssue}
- 业务分类：${feedback.category}

# Reply Rules (回复规则)
1. 开头表达感谢：真诚感谢用户的认可，提及具体的反馈点。
2. 情感共鸣：分享用户喜悦，让用户感受到被重视。
3. 互动引导：邀请用户晒图、关注新品、加入会员计划等。
4. 回馈激励：提及已发放的优惠券/积分等（使用占位符）。
5. 品牌调性：${toneDescriptions[tone]}
6. 动态占位符：使用[请填入补偿金额]、[请填入专员联系电话]等占位符。
7. 长度控制：100-150字，分段清晰。

# Output constraint (输出约束)
直接输出最终的回复话术文本，不要包含任何解释性前缀。`;

    const { result, usedMock, error } = await callDeepSeekWithRetry({
      url: `${DEEPSEEK_BASE_URL}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位资深客户关系管理专家。直接输出话术文本，不要有任何前缀。' },
          { role: 'user', content: positivePrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      timeoutMs: 15000,
      retries: 3,
    }, (data) => {
      const reply = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content || '';
      const cleaned = reply.replace(/^["']|["']$/g, '').trim();
      return cleaned || null;
    });

    if (result) {
      console.log('[DeepSeek API] 好评回复生成成功');
      return { reply: result, usedMock, error };
    }

    return {
      reply: mockSmartReply(feedback.rawContent, feedback.coreIssue, feedback.userDemand, tone, feedback.sentiment),
      usedMock: true,
      error,
    };
  }

  // 差评/负面反馈的prompt（原有逻辑）
  const prompt = `# Role (角色)
你是一位拥有10年经验的资深客户关怀专家与危机公关大师，深谙用户心理学。

# Task (任务)
你的任务是根据用户的原始差评、以及系统已经提炼出的核心痛点，撰写一段用于一线客服直接回复用户的"安抚与解决方案话术"。

# Input Variables (输入变量)
- 用户原始反馈：${feedback.rawContent}
- 核心痛点描述：${feedback.coreIssue}
- 用户核心诉求：${feedback.userDemand}
- 业务分类：${feedback.category}
- 流失风险：${feedback.churnRisk}/100

# Reply Rules (必须严格遵守的回复铁律)
1. 情绪共鸣与具象化道歉：第一句话必须真诚道歉，且必须精准点出用户的痛点。绝对禁止使用"抱歉给您带来不便"这种敷衍废话。正确示范："抱歉让您经历了眼影盘碎裂粉末漏出的糟糕体验..."。
2. 响应诉求：必须针对"${feedback.userDemand}"给出明确的动作。例如：如果诉求是退款，请引导进入极速退款通道；如果诉求是仅吐槽，请承诺已将问题提交给产品研发中心。
3. 品牌调性：${toneDescriptions[tone]}
4. 动态占位符：对于需要人工客服补充的实体信息，请使用明确的方括号占位符，例如：[请填入专属退货链接]、[请填入补偿金额]、[请填入专员联系电话]。
5. 长度控制：为了适应移动端阅读，字数严格控制在100-150字以内，分段必须清晰。

# Output constraint (输出约束)
直接输出最终的回复话术文本，绝对不要包含任何"好的"、"为您生成如下"等解释性或引导性前缀文字。`;

  const { result, usedMock, error } = await callDeepSeekWithRetry({
    url: `${DEEPSEEK_BASE_URL}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一位拥有10年经验的资深客户关怀专家与危机公关大师。直接输出话术文本，不要有任何前缀。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    },
    timeoutMs: 15000,
    retries: 3,
  }, (data) => {
    const reply = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content || '';
    const cleaned = reply.replace(/^["']|["']$/g, '').trim();
    return cleaned || null;
  });

  if (result) {
    console.log('[DeepSeek API] 智能回复生成成功');
    return { reply: result, usedMock, error };
  }

  console.warn('[DeepSeek API] 智能回复生成失败，降级到本地话术模板库');
  return {
    reply: mockSmartReply(feedback.rawContent, feedback.coreIssue, feedback.userDemand, tone, feedback.sentiment),
    usedMock: true,
    error,
  };
}

// 导出mock函数供测试使用
export { mockChurnRisk, mockSmartReply };
