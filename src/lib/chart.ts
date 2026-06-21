import { DailyCandle, Entry, FatigueLevel } from "../types";

function levelToNumber(level: FatigueLevel): number {
  return Number(level.replace("N", ""));
}

function annotationPosition(value: number): "top" | "bottom" {
  return value >= 6 ? "top" : "bottom";
}

interface GroupedPoint {
  value: [number, number];
  count: number;
  entries: Entry[];
  levelLabel: FatigueLevel;
  duringMenstruation: boolean;
}

function groupIntradayEntries(entries: Entry[], dayIndexMap: Map<string, number>): GroupedPoint[] {
  const grouped = new Map<string, GroupedPoint>();

  for (const entry of entries) {
    const dayIndex = dayIndexMap.get(entry.date);
    if (dayIndex == null) {
      continue;
    }

    const numericLevel = levelToNumber(entry.level);
    const key = `${dayIndex}-${numericLevel}`;
    const current = grouped.get(key);

    if (current) {
      current.entries.push(entry);
      current.count += 1;
      current.duringMenstruation = current.duringMenstruation || Boolean(entry.duringMenstruation);
      continue;
    }

    grouped.set(key, {
      value: [dayIndex, numericLevel],
      count: 1,
      entries: [entry],
      levelLabel: entry.level,
      duringMenstruation: Boolean(entry.duringMenstruation),
    });
  }

  return [...grouped.values()].sort((left, right) => left.value[0] - right.value[0] || left.value[1] - right.value[1]);
}

export function createCourseChartOption(candles: DailyCandle[], entries: Entry[]) {
  const dates = candles.map((candle) => candle.date);
  const dayIndexMap = new Map(dates.map((date, index) => [date, index]));
  const menstrualDates = new Set(entries.filter((entry) => entry.duringMenstruation).map((entry) => entry.date));
  const intradayEntries = [...entries]
    .filter((entry) => dayIndexMap.has(entry.date))
    .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
  const groupedIntraday = groupIntradayEntries(intradayEntries, dayIndexMap);

  const dailyCloseSeries = candles.map((candle, index) => [index, levelToNumber(candle.close)]);
  const intradaySeries = groupedIntraday;
  const observerSeries = intradayEntries
    .filter((entry) => entry.observerLevel)
    .map((entry) => ({
      value: [dayIndexMap.get(entry.date) ?? 0, levelToNumber(entry.observerLevel!)],
      entry,
    }));
  const imputedSeries = candles
    .map((candle, index) => (candle.isImputed ? [index, levelToNumber(candle.close)] : null))
    .filter(Boolean);

  const rangeSegments = candles.flatMap((candle) => {
    const low = levelToNumber(candle.low);
    const high = levelToNumber(candle.high);
    if (low === high) {
      return [];
    }

    const dayTime = dayIndexMap.get(candle.date) ?? 0;
    return [
      [
        { coord: [dayTime, low] },
        { coord: [dayTime, high] },
      ],
    ];
  });

  const annotations = candles
    .map((candle) => {
      if (!candle.annotation) {
        return null;
      }

      const dayIndex = dayIndexMap.get(candle.date) ?? 0;
      const closeLevel = levelToNumber(candle.close);
      const placeRight = dayIndex % 2 === 0;
      return {
        value: candle.annotation,
        coord: [dayIndex, closeLevel],
        label: {
          position: placeRight ? "right" : "left",
          offset: placeRight
            ? [26, closeLevel >= 6 ? -10 : 10]
            : [-26, closeLevel >= 6 ? -10 : 10],
        },
      };
    })
    .filter(Boolean);

  return {
    animation: false,
    grid: {
      top: 28,
      right: 40,
      bottom: 56,
      left: 64,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "rgba(37, 62, 87, 0.3)",
        },
      },
      formatter: (
        params: Array<{
          axisValueLabel?: string;
          seriesName: string;
          data:
            | number[]
            | { value: number[]; count?: number; levelLabel?: string }
            | null;
        }>,
      ) => {
        const date = params[0]?.axisValueLabel ?? "";
        const lines = params
          .map((item) => {
            if (Array.isArray(item.data) && typeof item.data[1] === "number") {
              return `${item.seriesName}：N${item.data[1]}`;
            }
            if (item.data && typeof item.data === "object" && "value" in item.data && Array.isArray(item.data.value)) {
              const countSuffix = item.data.count && item.data.count > 1 ? `（${item.data.count}次）` : "";
              return `${item.seriesName}：N${item.data.value[1]}${countSuffix}`;
            }
            return null;
          })
          .filter(Boolean);
        return [date, ...lines].join("<br/>");
      },
    },
    xAxis: {
      type: "value",
      min: -0.5,
      max: Math.max(dates.length - 0.5, 0.5),
      axisLine: {
        lineStyle: {
          color: "#4e5f74",
        },
      },
      axisLabel: {
        color: "#4e5f74",
        formatter: (value: number) => dates[Math.round(value)] ?? "",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(78, 95, 116, 0.08)",
        },
      },
      interval: 1,
    },
    yAxis: {
      type: "value",
      min: 1,
      max: 9,
      interval: 1,
      inverse: true,
      axisLine: {
        show: true,
        lineStyle: {
          color: "#4e5f74",
        },
      },
      splitLine: {
        lineStyle: {
          color: "rgba(78, 95, 116, 0.12)",
        },
      },
      axisLabel: {
        formatter: (value: number) => `N${value}`,
        color: "#4e5f74",
      },
    },
    series: [
      {
        type: "line",
        name: "阶段参考",
        data: dailyCloseSeries,
        symbol: "none",
        z: 3,
        lineStyle: {
          opacity: 0,
        },
        markArea: {
          silent: true,
          itemStyle: {
            opacity: 0.18,
          },
          data: [
            [
              { yAxis: 1, itemStyle: { color: "rgba(111, 168, 123, 0.18)" } },
              { yAxis: 3.5 },
            ],
            [
              { yAxis: 3.5, itemStyle: { color: "rgba(230, 183, 84, 0.16)" } },
              { yAxis: 6.5 },
            ],
            [
              { yAxis: 6.5, itemStyle: { color: "rgba(193, 87, 87, 0.14)" } },
              { yAxis: 9 },
            ],
          ],
        },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: {
            color: "rgba(61, 78, 98, 0.4)",
            type: "solid",
          },
          label: {
            color: "#536173",
            fontSize: 12,
          },
          data: [
            { yAxis: 3.5, label: { formatter: "相对稳定区" } },
            { yAxis: 6.5, label: { formatter: "明显受影响区" } },
          ],
        },
      },
      {
        type: "scatter",
        name: "每日汇总点",
        data: candles.map((candle, index) => ({
          value: [index, levelToNumber(candle.close)],
          duringMenstruation: menstrualDates.has(candle.date),
        })),
        symbol: "circle",
        symbolSize: 11,
        z: 4,
        itemStyle: {
          color: (params: { data: { duringMenstruation?: boolean } }) =>
            params.data?.duringMenstruation ? "#c74a5a" : "#27384b",
        },
      },
      {
        type: "scatter",
        name: "日内记录点",
        data: intradaySeries,
        symbol: "circle",
        symbolSize: (value: number[], params: { data: GroupedPoint }) =>
          params.data.count > 1 ? 10 + Math.min(params.data.count, 4) * 2 : 8,
        z: 5,
        itemStyle: {
          color: (params: { data: GroupedPoint }) => (params.data.duringMenstruation ? "#f8d9dd" : "#f7f3ec"),
          borderColor: (params: { data: GroupedPoint }) => (params.data.duringMenstruation ? "#c74a5a" : "#576e85"),
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: (params: { data: GroupedPoint }) => (params.data.count > 1 ? String(params.data.count) : ""),
          color: "#334252",
          fontSize: 11,
          fontWeight: 700,
        },
      },
      {
        type: "line",
        name: "日内波动",
        data: dailyCloseSeries,
        symbol: "none",
        silent: true,
        z: 1,
        lineStyle: {
          opacity: 0,
        },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: {
            color: "rgba(96, 110, 128, 0.26)",
            width: 1.2,
          },
          data: rangeSegments,
        },
      },
      {
        type: "line",
        name: "补全记录",
        data: imputedSeries,
        connectNulls: false,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 10,
        z: 5,
        lineStyle: {
          opacity: 0,
        },
        itemStyle: {
          color: "#f7f3ec",
          borderColor: "#5c7084",
          borderWidth: 2,
        },
      },
      {
        type: "scatter",
        name: "关键事件",
        data: candles
          .map((candle) => {
            if (!candle.annotation) {
              return null;
            }

            const dayIndex = dayIndexMap.get(candle.date) ?? 0;
            const closeLevel = levelToNumber(candle.close);
            const placeRight = dayIndex % 2 === 0;

            return {
              value: [dayIndex, closeLevel],
              labelText: candle.annotation,
              label: {
                position: placeRight ? "right" : "left",
                offset: placeRight
                  ? [26, closeLevel >= 6 ? -10 : 10]
                  : [-26, closeLevel >= 6 ? -10 : 10],
              },
            };
          })
          .filter(Boolean),
        symbolSize: 1,
        itemStyle: {
          color: "rgba(169, 72, 95, 0.01)",
        },
        label: {
          show: true,
          formatter: (params: { data: { labelText: string } }) => params.data.labelText,
          color: "#3f4d60",
          backgroundColor: "rgba(255, 251, 247, 0.94)",
          borderColor: "rgba(169, 72, 95, 0.35)",
          borderWidth: 1,
          borderRadius: 10,
          padding: [6, 8],
          width: 84,
          overflow: "break",
          fontSize: 12,
          lineHeight: 16,
        },
        labelLayout: {
          hideOverlap: true,
          moveOverlap: "shiftY",
        },
        emphasis: {
          scale: false,
        },
        z: 6,
      },
      {
        type: "scatter",
        name: "身边人他评",
        data: observerSeries,
        symbol: "diamond",
        symbolSize: 10,
        itemStyle: {
          color: (params: { data: { entry?: Entry } }) =>
            params.data?.entry?.duringMenstruation ? "#c74a5a" : "#d07f39",
        },
        z: 6,
      },
    ],
  };
}
