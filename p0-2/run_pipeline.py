# -*- coding: utf-8 -*-
"""
VoC AI 洞察链路 Demo（P0-2）
按《VoC_AI能力设计说明》四层落地：打标 → 聚类 → 摘要 → 洞察
每层结果落盘 JSON，支持断点续跑，方便展示数据流与复盘。
"""
import json
import os
import re
import sys
import time

import requests

OUT = r"c:\Users\联想\OneDrive\Desktop\voc\p0-2"
BASE = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"

# 密钥不硬编码：优先环境变量，其次读取 voc-platform/.env（该文件已被 gitignore，不会入库）
def _load_api_key():
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if key:
        return key
    env_path = os.path.join(os.path.dirname(OUT), "voc-platform", ".env")
    if os.path.exists(env_path):
        for line in open(env_path, encoding="utf-8"):
            line = line.strip()
            if line.startswith("DEEPSEEK_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
    if not key:
        raise SystemExit("[FATAL] 未找到 DEEPSEEK_API_KEY。请设置环境变量，或在 voc-platform/.env 中配置。")
    return key

API_KEY = _load_api_key()

# 话题白名单：V1=设计说明原始版(偏通用)、V2=品类化版(贴合唇部数据)
TAGSET_V1 = ["肤感", "功效", "包装", "价格", "物流", "客服", "其他"]
TAGSET_V2 = ["肤感质地", "滋润保湿", "气味味道", "颜色显色", "使用场景", "包装设计", "性价比", "物流服务", "回购意向", "其他"]

SAMPLE = os.path.join(OUT, "sample_reviews.json")


def load_sample():
    with open(SAMPLE, encoding="utf-8") as f:
        return json.load(f)


def call_deepseek(system, user, temperature=0.3, max_tokens=4000, retries=3):
    url = BASE
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer %s" % API_KEY,
    }
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, headers=headers, json=body, timeout=180)
            if resp.status_code == 401:
                print("[FATAL] API Key 无效或已过期 (401)")
                return None
            if resp.status_code == 429:
                time.sleep(min(30, 2 ** attempt))
                continue
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            print("  tokens: in=%s out=%s" % (
                usage.get("prompt_tokens", "?"), usage.get("completion_tokens", "?")))
            return content
        except Exception as e:
            print("  [WARN] 第 %d 次调用失败: %s" % (attempt, e))
            time.sleep(min(20, 2 ** attempt))
    return None


def extract_json(text):
    """从模型输出中抽取 JSON（兼容 ```json 包裹 / 前后杂文）"""
    if not text:
        return None
    t = text.strip()
    # 去掉代码块围栏
    t = re.sub(r"^```(?:json)?\s*", "", t)
    t = re.sub(r"\s*```$", "", t)
    try:
        return json.loads(t)
    except Exception:
        pass
    # 兜底：截取第一个 [ 或 { 到最后一个 ] 或 }
    for open_ch, close_ch in (("[", "]"), ("{", "}")):
        a = t.find(open_ch)
        b = t.rfind(close_ch)
        if a != -1 and b > a:
            try:
                return json.loads(t[a:b + 1])
            except Exception:
                continue
    return None


# ================= 第一层：打标 =================
def stage_tag(tagset, limit=None):
    sample = load_sample()
    if limit:
        sample = sample[:limit]
    print("打标条数: %d  标签集: %s" % (len(sample), tagset))
    # 每条加 id
    items = [{"id": i, "content": r["content"]} for i, r in enumerate(sample)]

    BATCH = 20
    results = []
    for start in range(0, len(items), BATCH):
        batch = items[start:start + BATCH]
        system = "你是消费者口碑分析专家。只输出 JSON，不输出任何解释。"
        user = """请对下列 %d 条用户评论逐条做「情感倾向 + 话题标签」标注。

话题标签只能从以下候选选择（禁止自创）：
%s

输出要求（必须逐条遵守）：
1. 严格返回 JSON 数组，长度与输入一致，按输入顺序排列。
2. 每条格式：{"id": 原文id, "sentiment": "积极|中性|消极", "topic": ["标签1","标签2"], "confidence": 0到1之间的小数}
3. topic 选 1-3 个；拿不准就选"其他"。
4. 情感不确定时 confidence 低于 0.6，并取更保守的情感值。
5. 只输出 JSON 数组，不要 ``` 标记，不要任何解释文字。

输入评论：
%s""" % (len(batch), "、".join(tagset), json.dumps(batch, ensure_ascii=False))
        content = call_deepseek(system, user, temperature=0.2, max_tokens=6000)
        parsed = extract_json(content)
        if isinstance(parsed, list):
            results.extend(parsed)
            print("  批次 %d/%d 成功，累计 %d 条" % (start // BATCH + 1, (len(items) + BATCH - 1) // BATCH, len(results)))
        else:
            print("  批次 %d 解析失败，原文片段: %s" % (start, str(content)[:200]))
        time.sleep(0.5)

    tag = "v1" if tagset is TAGSET_V1 else "v2"
    suffix = "_limit%d" % limit if limit else ""
    out = os.path.join(OUT, "tagged_%s%s.json" % (tag, suffix))
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("打标结果已写入: %s (%d 条)" % (out, len(results)))
    return results


# ================= 第二层：聚类 =================
def stage_cluster(tagged_file):
    with open(os.path.join(OUT, tagged_file), encoding="utf-8") as f:
        tagged = json.load(f)
    # 还原评论内容：聚类时需要引用原文
    sample = load_sample()
    id2content = {i: r["content"] for i, r in enumerate(sample)}
    for t in tagged:
        t["content"] = id2content.get(t.get("id"), "")

    system = "你是资深消费者洞察分析师。只输出 JSON。"
    user = """以下是 %d 条已打标的用户评论（含 id、原文、情感、话题标签）。
请把它们归纳为 3-8 个「话题组」。

输出要求：
1. 返回 JSON 数组，每组格式：
   {"topic": "话题组名", "count": 归纳进来的评论条数, "sample_ids": [若干原id], "representative": ["代表性原声1","代表性原声2"]}
2. 话题组名要贴合评论实际语义，不是照搬标签。
3. representative 必须从输入原文里原样摘录，用于证明分组有依据。
4. 覆盖不到的评论归入一个名为"其他"的组。
5. 只输出 JSON 数组，不要解释。

已打标评论数据：
%s""" % (len(tagged), json.dumps(tagged, ensure_ascii=False))
    content = call_deepseek(system, user, temperature=0.3, max_tokens=4000)
    parsed = extract_json(content)
    out = os.path.join(OUT, "clusters.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(parsed if isinstance(parsed, list) else [], f, ensure_ascii=False, indent=2)
    print("聚类结果已写入: %s (%d 组)" % (out, len(parsed) if isinstance(parsed, list) else 0))
    return parsed


# ================= 第三层：摘要 =================
def stage_summarize(clusters_file, tagged_file):
    with open(os.path.join(OUT, clusters_file), encoding="utf-8") as f:
        clusters = json.load(f)
    with open(os.path.join(OUT, tagged_file), encoding="utf-8") as f:
        tagged = json.load(f)
    sample = load_sample()
    id2item = {i: r for i, r in enumerate(sample)}
    # 按 sample_ids 找回每组的评论原文
    per_cluster = []
    for c in clusters:
        ids = set(c.get("sample_ids", []))
        contents = [id2item[i]["content"] for i in ids if i in id2item]
        per_cluster.append({"cluster": c.get("topic"), "contents": contents})

    summaries = []
    for pc in per_cluster:
        system = "你是资深消费者洞察分析师。只输出 JSON。"
        user = """下面是话题组「%s」下的 %d 条用户原始评论。
请提炼该话题组下的正、反两类观点。

输出要求：
1. 返回一个 JSON 对象（不是数组）：
   {"topic": "%s", "positive": [{"point":"正面观点","evidence":["原声片段"]}], "negative": [{"point":"负面观点","evidence":["原声片段"]}]}
2. 正、反观点各 1-3 条；每条 point 必须配至少一条 evidence（从原文原样摘录）。
3. 没有证据的一侧输出空数组 []，不要硬凑。
4. 只输出 JSON 对象，不要解释。

评论：
%s""" % (pc["cluster"], len(pc["contents"]), pc["cluster"], json.dumps(pc["contents"], ensure_ascii=False))
        content = call_deepseek(system, user, temperature=0.5, max_tokens=3000)
        parsed = extract_json(content)
        if isinstance(parsed, dict):
            summaries.append(parsed)
            print("  话题「%s」摘要完成" % pc["cluster"])
        else:
            print("  话题「%s」摘要解析失败" % pc["cluster"])
        time.sleep(0.5)

    out = os.path.join(OUT, "summaries.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(summaries, f, ensure_ascii=False, indent=2)
    print("摘要结果已写入: %s (%d 个话题)" % (out, len(summaries)))
    return summaries


# ================= 第四层：洞察 =================
def stage_insight(clusters_file, summaries_file, tagged_file):
    with open(os.path.join(OUT, clusters_file), encoding="utf-8") as f:
        clusters = json.load(f)
    with open(os.path.join(OUT, summaries_file), encoding="utf-8") as f:
        summaries = json.load(f)
    with open(os.path.join(OUT, tagged_file), encoding="utf-8") as f:
        tagged = json.load(f)

    # 粗算情感分布（用于给模型统计佐证）
    sent = {}
    for t in tagged:
        s = t.get("sentiment", "中性")
        sent[s] = sent.get(s, 0) + 1

    system = "你是资深消费者洞察分析师，向品牌市场负责人直接汇报。只输出 JSON。"
    user = """以下是某唇部产品近期的结构化口碑数据。请生成 3-5 条可行动的洞察结论。

输入数据：
1. 情感分布统计：%s
2. 主题聚类结果：%s
3. 各话题正反观点摘要：%s

输出要求：
1. 返回 JSON 数组，每条格式：
   {"conclusion": "一句话结论", "evidence": ["支撑结论的原声或统计"], "confidence": "高|中|低", "action": "对应的下一步建议"}
2. 每条 conclusion 必须有 evidence 支撑，不得凭空发挥。
3. 把握不大的结论 confidence 只能写"中"或"低"，不得自我拔高。
4. action 要具体可执行，禁止"加强管理""持续优化"这类空话。
5. 只输出 JSON 数组，不要解释。
""" % (json.dumps(sent, ensure_ascii=False),
       json.dumps(clusters, ensure_ascii=False),
       json.dumps(summaries, ensure_ascii=False))
    content = call_deepseek(system, user, temperature=0.6, max_tokens=4000)
    parsed = extract_json(content)
    out = os.path.join(OUT, "insights.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(parsed if isinstance(parsed, list) else [], f, ensure_ascii=False, indent=2)
    print("洞察结果已写入: %s (%d 条)" % (out, len(parsed) if isinstance(parsed, list) else 0))
    return parsed


if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "all"

    if stage == "tag":
        ts = "v2"
        limit = None
        for a in sys.argv[2:]:
            if a == "v1":
                ts = "v1"
            if a.startswith("limit="):
                limit = int(a.split("=")[1])
        tagset = TAGSET_V1 if ts == "v1" else TAGSET_V2
        stage_tag(tagset, limit)

    elif stage == "cluster":
        stage_cluster("tagged_v2.json")

    elif stage == "summarize":
        stage_summarize("clusters.json", "tagged_v2.json")

    elif stage == "insight":
        stage_insight("clusters.json", "summaries.json", "tagged_v2.json")

    elif stage == "all":
        stage_tag(TAGSET_V2)
        stage_cluster("tagged_v2.json")
        stage_summarize("clusters.json", "tagged_v2.json")
        stage_insight("clusters.json", "summaries.json", "tagged_v2.json")