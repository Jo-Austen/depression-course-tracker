#!/usr/bin/env python3
"""
抑郁症疲劳记录表 - 图表生成脚本
读取 data/records.json，生成倒置疲劳病程图并保存为 PNG。
"""

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

# ---------- 依赖检测 ----------
_MISSING_DEPS = []

try:
    import matplotlib
    matplotlib.use("Agg")  # 无 GUI 后端，适合脚本运行
    import matplotlib.pyplot as plt
except ImportError:
    _MISSING_DEPS.append("matplotlib")

try:
    import numpy as np
except ImportError:
    _MISSING_DEPS.append("numpy")

if _MISSING_DEPS:
    print(f"错误: 缺少以下 Python 模块: {', '.join(_MISSING_DEPS)}")
    print()
    print("请运行以下命令安装依赖:")
    print(f"  {sys.executable} -m pip install {' '.join(_MISSING_DEPS)}")
    print()
    print("或者使用 requirements.txt:")
    print(f"  {sys.executable} -m pip install -r requirements.txt")
    sys.exit(1)

# ---------- 常量定义 ----------

DIMENSION_KEYS = [
    "sleepRecovery",
    "physicalFatigue",
    "activityTolerance",
    "lowMood",
    "cognitiveSlowing",
    "motivation",
]

DIMENSION_LABELS = {
    "sleepRecovery": "精神耗竭",
    "physicalFatigue": "身体疲惫",
    "activityTolerance": "启动困难",
    "lowMood": "情绪下沉",
    "cognitiveSlowing": "头脑迟滞",
    "motivation": "接触他人困难",
}

REASON_LABELS = {
    "sleepRecovery": "精神耗竭重",
    "physicalFatigue": "身体疲惫重",
    "activityTolerance": "启动困难重",
    "lowMood": "情绪下沉重",
    "cognitiveSlowing": "头脑迟滞重",
    "motivation": "接触他人困难",
}

# 总分 → 等级映射
SCORE_BANDS = [
    (2, "N1"), (4, "N2"), (6, "N3"), (8, "N4"),
    (10, "N5"), (12, "N6"), (14, "N7"), (16, "N8"), (18, "N9"),
]

LEVEL_TO_NUMBER = {f"N{i}": i for i in range(1, 10)}

# 背景区域定义
ZONES = [
    (1, 3.5, "rgba(111,168,123,0.18)", "相对稳定区"),
    (3.5, 6.5, "rgba(230,183,84,0.16)", "明显受影响区"),
    (6.5, 9, "rgba(193,87,87,0.14)", "重度区"),
]

# ---------- 评分逻辑（与前端一致）----------

def sum_scores(scores: dict) -> int:
    return sum(scores.values())


def level_from_score(total_score: int, scores: dict) -> str:
    """根据总分和评分计算疲劳等级"""
    base_level = "N9"
    for max_score, level in SCORE_BANDS:
        if total_score <= max_score:
            base_level = level
            break

    severe_physical = scores.get("physicalFatigue") == 3 or scores.get("activityTolerance") == 3
    current_level_number = LEVEL_TO_NUMBER[base_level]
    near_upper_boundary = total_score == min(current_level_number * 2, 18)

    if severe_physical and near_upper_boundary and current_level_number < 9:
        base_level = f"N{current_level_number + 1}"

    return base_level


def build_reason_tags(scores: dict) -> list:
    """生成原因摘要标签"""
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    ranked = [(k, v) for k, v in ranked if v > 0]
    if not ranked:
        return ["状态总体平稳"]
    return [REASON_LABELS[k] for k, _ in ranked[:2]]


def score_entry(entry: dict) -> dict:
    """对单条记录计算总分、等级、原因标签"""
    scores = entry.get("scores", {})
    total = sum_scores(scores)
    level = level_from_score(total, scores)
    tags = build_reason_tags(scores)
    return {
        **entry,
        "totalScore": total,
        "level": level,
        "reasonTags": tags,
    }


# ---------- 每日 OHLC 构建 ----------

def enumerate_dates(start_date: str, end_date: str) -> list:
    """枚举 start 到 end 之间的所有日期"""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    dates = []
    current = start
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


def build_daily_candles(entries: list) -> list:
    """构建每日 OHLC 数据（与前端 buildDailyCandles 逻辑一致）"""
    if not entries:
        return []

    # 确保每条记录都有正确的 score/level/reasonTags
    entries = [score_entry(e) for e in entries]

    # 按日期时间排序
    sorted_entries = sorted(entries, key=lambda e: f"{e['date']}T{e['time']}")

    # 按日期分组
    grouped = defaultdict(list)
    for e in sorted_entries:
        grouped[e["date"]].append(e)

    dates = enumerate_dates(sorted_entries[0]["date"], sorted_entries[-1]["date"])
    candles = []
    previous_close = None

    for date in dates:
        day_entries = grouped.get(date)

        if not day_entries or len(day_entries) == 0:
            if previous_close is None:
                continue
            candles.append({
                "date": date,
                "open": previous_close,
                "high": previous_close,
                "low": previous_close,
                "close": previous_close,
                "entryCount": 0,
                "isImputed": True,
                "annotation": None,
                "dayEntries": [],
            })
            continue

        ordered = sorted(day_entries, key=lambda e: f"{e['date']}T{e['time']}")
        levels = [LEVEL_TO_NUMBER[e["level"]] for e in ordered]
        close_entry = ordered[-1]
        close_level = close_entry["level"]

        candles.append({
            "date": date,
            "open": ordered[0]["level"],
            "high": f"N{max(levels)}",
            "low": f"N{min(levels)}",
            "close": close_level,
            "entryCount": len(ordered),
            "isImputed": False,
            "annotation": " + ".join(close_entry["reasonTags"]) if LEVEL_TO_NUMBER[close_level] > 5 else None,
            "dayEntries": ordered,
        })

        previous_close = close_level

    return candles


# ---------- RGBA 字符串转 (r,g,b,a) ----------

def parse_rgba(rgba_str: str) -> tuple:
    """解析 'rgba(r,g,b,a)' 字符串"""
    nums = re.findall(r"[\d.]+", rgba_str)
    r, g, b = float(nums[0]) / 255, float(nums[1]) / 255, float(nums[2]) / 255
    a = float(nums[3]) if len(nums) > 3 else 1.0
    return (r, g, b, a)


# ---------- 图表绘制 ----------

def draw_chart(candles: list, entries: list, output_path: str):
    """绘制倒置疲劳病程图"""

    # 设置中文字体
    plt.rcParams["font.sans-serif"] = [
        "PingFang SC", "Heiti SC", "STHeiti",
        "Microsoft YaHei", "SimHei", "Arial Unicode MS", "DejaVu Sans"
    ]
    plt.rcParams["axes.unicode_minus"] = False

    # 确定实际可用的中文字体
    available_fonts = {f.name for f in matplotlib.font_manager.fontManager.ttflist}
    chinese_font = None
    for f in plt.rcParams["font.sans-serif"]:
        if f in available_fonts:
            chinese_font = f
            break
    if chinese_font:
        plt.rcParams["font.family"] = chinese_font

    fig, ax = plt.subplots(figsize=(16, 8))
    fig.patch.set_facecolor("#1a1a2e")
    ax.set_facecolor("#16213e")

    # ---------- 背景区域 ----------
    x_min, x_max = -0.5, len(candles) - 0.5
    for y_low, y_high, rgba_str, _ in ZONES:
        r, g, b, a = parse_rgba(rgba_str)
        ax.fill_between(
            [x_min, x_max], y_low, y_high,
            color=(r, g, b), alpha=a, linewidth=0,
        )

    # 分隔线
    for y_pos, label in [(3.5, "相对稳定区"), (6.5, "明显受影响区")]:
        ax.axhline(y=y_pos, color="#ffffff", linewidth=0.6, linestyle="--", alpha=0.3)
        ax.text(
            x_max + 0.1, y_pos, label,
            color="#ffffff", fontsize=9, alpha=0.5,
            va="center", ha="left",
        )

    # ---------- 收集所有日内记录散点 ----------
    # 按 (date_index, level_number) 聚合，统计次数
    date_to_index = {c["date"]: i for i, c in enumerate(candles)}

    intraday_points = defaultdict(int)  # (x, y) -> count
    intraday_detail = defaultdict(list)  # (x, y) -> [entries...]

    for candle in candles:
        if candle["isImputed"]:
            continue
        x = date_to_index[candle["date"]]
        for entry in candle["dayEntries"]:
            y = LEVEL_TO_NUMBER[entry["level"]]
            intraday_points[(x, y)] += 1
            intraday_detail[(x, y)].append(entry)

    # 绘制日内记录散点
    for (x, y), count in intraday_points.items():
        # 同一天同一等级叠加显示
        sizes = np.linspace(80, 200, min(count, 5))
        for j in range(min(count, 5)):
            offset = j * 0.06 if count > 1 else 0
            ax.scatter(
                x, y + offset,
                s=sizes[j], c="#4fc3f7", edgecolors="white",
                linewidths=0.8, zorder=5, alpha=0.9,
            )

    # 多重记录用数字标注
    for (x, y), count in intraday_points.items():
        if count >= 2:
            ax.annotate(
                str(count), (x, y + 0.22),
                color="#ffffff", fontsize=7, ha="center", va="bottom",
                alpha=0.8,
            )

    # ---------- 每日汇总点（收盘等级）+ 高低范围线 ----------
    for i, candle in enumerate(candles):
        close_num = LEVEL_TO_NUMBER[candle["close"]]
        high_num = LEVEL_TO_NUMBER[candle["high"]]
        low_num = LEVEL_TO_NUMBER[candle["low"]]

        # 高低范围竖线
        ax.plot(
            [i, i], [low_num, high_num],
            color="#ffffff", linewidth=1.2, alpha=0.6, zorder=3,
        )

        # 每日汇总圆点
        if candle["isImputed"]:
            # 补全日：空心圆
            ax.scatter(
                i, close_num,
                s=60, facecolors="none", edgecolors="#888888",
                linewidths=1.5, zorder=6, alpha=0.6,
            )
        else:
            ax.scatter(
                i, close_num,
                s=100, c="#ffd54f", edgecolors="#b8860b",
                linewidths=1.5, zorder=6, marker="o",
            )

        # 注释文本（收盘等级 > N5 时显示）
        if candle["annotation"] and not candle["isImputed"]:
            ax.annotate(
                candle["annotation"],
                (i, close_num + 0.35),
                color="#ff8a65", fontsize=7,
                ha="center", va="bottom",
                alpha=0.9,
            )

    # ---------- 他评散点 ----------
    observer_points = []
    for candle in candles:
        if candle["isImputed"]:
            continue
        x = date_to_index[candle["date"]]
        for entry in candle["dayEntries"]:
            if entry.get("observerLevel"):
                try:
                    obs_num = LEVEL_TO_NUMBER[entry["observerLevel"]]
                except KeyError:
                    continue
                observer_points.append((x, obs_num, entry))

    if observer_points:
        ox, oy, _ = zip(*observer_points)
        ax.scatter(
            ox, oy,
            s=120, c="#ff7043", marker="D", edgecolors="white",
            linewidths=1.2, zorder=8, alpha=0.95,
            label="他评记录",
        )

    # ---------- 坐标轴设置 ----------
    ax.set_ylim(9.5, 0.5)  # 倒置 Y 轴：疲劳越重越靠下
    ax.set_xlim(-0.5, len(candles) - 0.5)

    # Y 轴刻度
    y_ticks = list(range(1, 10))
    y_labels = [f"N{i}" for i in y_ticks]
    ax.set_yticks(y_ticks)
    ax.set_yticklabels(y_labels, color="#b0bec5", fontsize=10)
    ax.set_ylabel("疲劳等级（越小越好）", color="#b0bec5", fontsize=11)

    # X 轴刻度
    x_ticks = list(range(len(candles)))
    x_labels = []
    for c in candles:
        dt = datetime.strptime(c["date"], "%Y-%m-%d")
        x_labels.append(f"{dt.month}/{dt.day}")
    ax.set_xticks(x_ticks)
    ax.set_xticklabels(x_labels, color="#b0bec5", fontsize=8, rotation=45, ha="right")
    ax.set_xlabel("日期", color="#b0bec5", fontsize=11)

    # 标题
    ax.set_title(
        "抑郁症疲劳病程记录图",
        color="#ffffff", fontsize=16, fontweight="bold", pad=15,
    )

    # 边框样式
    for spine in ax.spines.values():
        spine.set_color("#4a5568")
        spine.set_linewidth(0.8)
    ax.tick_params(colors="#b0bec5", which="both")

    # ---------- 图例 ----------
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], marker="o", color="w", markerfacecolor="#ffd54f",
               markeredgecolor="#b8860b", markersize=10, label="每日汇总点"),
        Line2D([0], [0], marker="o", color="w", markerfacecolor="#4fc3f7",
               markeredgecolor="white", markersize=10, label="日内自评记录"),
        Line2D([0], [0], marker="o", color="w", markerfacecolor="none",
               markeredgecolor="#888888", markersize=10, label="补全日（无记录）"),
        Line2D([0], [0], marker="D", color="w", markerfacecolor="#ff7043",
               markeredgecolor="white", markersize=10, label="他评记录"),
    ]
    ax.legend(
        handles=legend_elements, loc="upper right",
        facecolor="#16213e", edgecolor="#4a5568",
        labelcolor="#b0bec5", fontsize=9,
    )

    # ---------- 统计信息 ----------
    real_candles = [c for c in candles if not c["isImputed"]]
    total_entries = len(entries)
    total_days = len(real_candles)
    avg_score = np.mean([sum(e["scores"].values()) for e in entries]) if entries else 0

    stats_text = (
        f"记录天数: {total_days} 天 | 总记录数: {total_entries} 条 | "
        f"日均分: {avg_score:.1f} | "
        f"日期范围: {candles[0]['date'] if candles else '-'} ~ {candles[-1]['date'] if candles else '-'}"
    )
    fig.text(
        0.5, 0.01, stats_text,
        ha="center", va="bottom", color="#78909c", fontsize=9,
    )

    plt.tight_layout(rect=[0, 0.04, 1, 1])

    # 保存
    fig.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)

    print(f"图表已保存至: {output_path}")


# ---------- 主入口 ----------

def main():
    # 查找 records.json
    script_dir = Path(__file__).parent
    data_path = script_dir / "data" / "records.json"

    if not data_path.exists():
        print(f"错误: 找不到数据文件 {data_path}", file=sys.stderr)
        sys.exit(1)

    # 读取数据
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", [])
    if not entries:
        print("没有记录数据，无法生成图表。", file=sys.stderr)
        sys.exit(1)

    print(f"读取到 {len(entries)} 条记录")

    # 构建每日 OHLC
    candles = build_daily_candles(entries)
    print(f"覆盖 {len(candles)} 天（含 {sum(1 for c in candles if c['isImputed'])} 天补全）")

    # 生成图表
    output_path = script_dir / "fatigue_chart.png"
    draw_chart(candles, entries, str(output_path))

    # 打印每日摘要
    print("\n" + "=" * 60)
    print("每日疲劳摘要:")
    print("-" * 60)
    for candle in candles:
        flag = "[补] " if candle["isImputed"] else "     "
        ann = f"  ({candle['annotation']})" if candle["annotation"] else ""
        print(
            f"{flag}{candle['date']} | "
            f"开:{candle['open']:<3} 高:{candle['high']:<3} "
            f"低:{candle['low']:<3} 收:{candle['close']:<3} | "
            f"记录{candle['entryCount']}次{ann}"
        )
    print("=" * 60)


if __name__ == "__main__":
    main()
