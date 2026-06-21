import { describe, expect, it } from "vitest";
import { createCourseChartOption } from "./chart";
import { DailyCandle } from "../types";

const candles: DailyCandle[] = [
  {
    date: "2026-06-20",
    open: "N3",
    high: "N5",
    low: "N2",
    close: "N4",
    entryCount: 2,
    isImputed: false,
    annotation: null,
  },
  {
    date: "2026-06-21",
    open: "N4",
    high: "N7",
    low: "N4",
    close: "N6",
    entryCount: 1,
    isImputed: false,
    annotation: "睡眠恢复差 + 活动耐受低",
  },
  {
    date: "2026-06-22",
    open: "N6",
    high: "N6",
    low: "N6",
    close: "N6",
    entryCount: 0,
    isImputed: true,
    annotation: null,
  },
];

describe("createCourseChartOption", () => {
  it("inverts fatigue levels so heavier fatigue sits lower on the chart", () => {
    const option = createCourseChartOption(candles);
    expect(option.yAxis.inverse).toBe(true);
    expect(option.yAxis.min).toBe(1);
    expect(option.yAxis.max).toBe(9);
  });

  it("uses a line-based course chart with phase layers and annotations", () => {
    const option = createCourseChartOption(candles);
    expect(option.series[0]?.type).toBe("line");
    expect(option.series[0]?.markArea?.data).toHaveLength(3);
    expect(option.series[3]?.type).toBe("scatter");
    expect(option.series[3]?.data).toHaveLength(1);
  });

  it("keeps dates in left-to-right order and marks imputed days separately", () => {
    const option = createCourseChartOption(candles);
    expect(option.xAxis.data).toEqual(["2026-06-20", "2026-06-21", "2026-06-22"]);
    expect(option.series[2]?.data).toEqual([null, null, 6]);
  });
});
