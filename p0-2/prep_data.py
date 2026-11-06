# -*- coding: utf-8 -*-
import csv, json, os
from collections import Counter, OrderedDict

SRC = r"c:\Users\联想\.trae-cn\attachments\6a20f878de31e9d7114777b0\d4591691-1c76-44fb-ab7a-117c7c8920a6_fccd2982-7506-4300-afea-2820574d4fe1_taobao_reviews(1).csv"
OUT_DIR = r"c:\Users\联想\OneDrive\Desktop\voc\p0-2"
os.makedirs(OUT_DIR, exist_ok=True)

def clean(s):
    if s is None:
        return ""
    return str(s).strip()

rows = []
with open(SRC, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    fields = list(reader.fieldnames or [])
    for r in reader:
        rows.append(r)

nonempty = [clean(r.get("评价内容", "")) for r in rows if clean(r.get("评价内容", ""))]

# 去重（按评价内容，保留首次出现顺序）
seen = OrderedDict()
for r in rows:
    c = clean(r.get("评价内容", ""))
    if c and c not in seen:
        seen[c] = r
unique = list(seen.values())

type_counter = Counter(clean(r.get("评价类型", "")) for r in rows)
star_counter = Counter(clean(r.get("评分星级", "")) for r in rows)
brand_counter = Counter(clean(r.get("商品品牌") or r.get("商品所属品牌", "") for r in rows))
lens = [len(clean(r.get("评价内容"))) for r in unique]

lines = []
lines.append("=== 数据探查报告 ===")
lines.append("总记录数: %d" % len(rows))
lines.append("字段数: %d" % len(fields))
lines.append("字段: %s" % fields)
lines.append("评价内容非空数: %d" % len(nonempty))
lines.append("去重后独立评论数: %d" % len(unique))
lines.append("去重冗余比: %.1fx" % (len(nonempty) / max(len(unique), 1)))
lines.append("")
lines.append("评价类型分布: %s" % dict(type_counter))
lines.append("评分星级分布: %s" % dict(star_counter))
lines.append("品牌分布(top10): %s" % dict(brand_counter.most_common(10)))
lines.append("评论长度: 最短%d, 最长%d, 平均%.1f" % (min(lens) if lens else 0, max(lens) if lens else 0, sum(lens)/len(lens) if lens else 0))
lines.append("")
lines.append("=== 去重后前 30 条独立评论预览 ===")
for i, r in enumerate(unique[:30], 1):
    lines.append("[%d] (%s) %s" % (i, clean(r.get("评价类型", "")), clean(r.get("评价内容", ""))[:70]))
lines.append("")
lines.append("=== 去重后全部独立评论全文（共 %d 条）===" % len(unique))
for i, r in enumerate(unique, 1):
    lines.append("--- %d ---" % i)
    lines.append(clean(r.get("评价内容", "")))
    lines.append("[类型:%s | 星级:%s | 时间:%s]" % (clean(r.get("评价类型", "")), clean(r.get("评分星级", "")), clean(r.get("评价发表时间", ""))))

with open(os.path.join(OUT_DIR, "data_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

clean_data = [{"content": clean(r.get("评价内容", "")),
               "type": clean(r.get("评价类型", "")),
               "star": clean(r.get("评分星级", "")),
               "time": clean(r.get("评价发表时间", "")),
               "brand": clean(r.get("商品品牌") or r.get("商品所属品牌", ""))}
              for r in unique]
with open(os.path.join(OUT_DIR, "clean_reviews.json"), "w", encoding="utf-8") as f:
    json.dump(clean_data, f, ensure_ascii=False, indent=2)

print("DONE unique=%d rows=%d nonempty=%d" % (len(unique), len(rows), len(nonempty)))