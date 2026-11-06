# -*- coding: utf-8 -*-
import json, random, os
from collections import Counter

OUT = r"c:\Users\联想\OneDrive\Desktop\voc\p0-2"
reviews = json.load(open(os.path.join(OUT, "clean_reviews.json"), encoding="utf-8"))

NOISE = ["系统默认好评", "此用户没有填写评价", "评价方未及时", "默认好评", "默认评价"]

def is_noise(c):
    return any(p in c for p in NOISE)

def is_lip(c):
    if "唇" in c or "口红" in c or "嘴巴" in c or "润唇" in c:
        if any(k in c for k in ["遮瑕", "粉底", "痘印", "粉扑", "黄褐斑", "痘"]):
            return False
        return True
    return False

valid = [r for r in reviews if len(r["content"].strip()) >= 6 and not is_noise(r["content"])]
lip = [r for r in valid if is_lip(r["content"])]

lens = [len(r["content"]) for r in lip]
buckets = {
    ">=30字": sum(1 for l in lens if l >= 30),
    "20-29字": sum(1 for l in lens if 20 <= l < 30),
    "10-19字": sum(1 for l in lens if 10 <= l < 20),
    "<10字": sum(1 for l in lens if l < 10),
}

lip_rich = [r for r in lip if len(r["content"]) >= 20]

random.seed(42)
n = min(300, len(lip_rich))
sample = random.sample(lip_rich, n)

with open(os.path.join(OUT, "sample_reviews.json"), "w", encoding="utf-8") as f:
    json.dump(sample, f, ensure_ascii=False, indent=2)

rep = []
rep.append("清洗后有效评论: %d" % len(valid))
rep.append("唇部产品聚焦后: %d" % len(lip))
rep.append("唇部评论长度分桶: %s" % dict(buckets))
rep.append("信息量足(>=20字)唇部评论: %d" % len(lip_rich))
rep.append("抽样条数: %d" % n)
rep.append("样本「评价类型」分布: %s" % dict(Counter(r["type"] for r in sample)))
rep.append("")
rep.append("=== 前 20 条采样预览 ===")
for i, r in enumerate(sample[:20], 1):
    rep.append("[%d] %s" % (i, r["content"]))

with open(os.path.join(OUT, "sample_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(rep))

print("lip=%d lip_rich=%d sample=%d" % (len(lip), len(lip_rich), n))