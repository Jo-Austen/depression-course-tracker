import { DailyCandle, FatigueLevel } from "../types";

function levelToNumber(level: FatigueLevel): number {
  return Number(level.replace("N", ""));
}

function annotationPosition(value: number): "top" | "bottom" {
  return value >= 6 ? "top" : "bottom";
}

export function createCourseChartOption(candles: DailyCandle[]) {
  const dates = candles.map((candle) => candle.date);
  const closeValues = candles.map((candle) => levelToNumber(candle.close));
  const imputedValues = candles.map((candle) => (candle.isImputed ? levelToNumber(candle.close) : null));
  const rangeSegments = candles.flatMap((candle, index) => {
    const low = levelToNumber(candle.low);
    const high = levelToNumber(candle.high);
    if (low === high) {
      return [];
    }

    return [
      [
        { coord: [index, low] },
        { coord: [index, high] },
      ],
    ];
  });

  const annotations = candles
    .map((candle, index) => {
      if (!candle.annotation) {
        return null;
      }

      const closeLevel = levelToNumber(candle.close);
      return {
        value: candle.annotation,
        xAxis: index,
        yAxis: closeLevel,
        label: {
          position: annotationPosition(closeLevel),
        },
      };
    })
    .filter(Boolean);

  return {
    animation: false,
    grid: {
      top: 28,
      right: 32,
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
      formatter: (params: Array<{ axisValue: string; seriesName: string; data: number | null }>) => {
        const date = params[0]?.axisValue ?? "";
        const closePoint = params.find((item) => item.seriesName === "疲劳病程");
        const closeValue = typeof closePoint?.data === "number" ? `N${closePoint.data}` : "无数据";
        return `${date}<br/>疲劳等级：${closeValue}`;
      },
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#4e5f74",
        },
      },
      axisLabel: {
        color: "#4e5f74",
      },
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
        name: "疲劳病程",
        data: closeValues,
        smooth: 0,
        symbol: "none",
        z: 3,
        lineStyle: {
          width: 3,
          color: "#27384b",
          join: "miter",
        },
        markArea: {
          silent: true,
          itemStyle: {
            opacity: 0.18,
          },
          data: [
            [
              {
                yAxis: 1,
                itemStyle: { color: "rgba(111, 168, 123, 0.18)" },
              },
              { yAxis: 3.5 },
            ],
            [
              {
                yAxis: 3.5,
                itemStyle: { color: "rgba(230, 183, 84, 0.16)" },
              },
              { yAxis: 6.5 },
            ],
            [
              {
                yAxis: 6.5,
                itemStyle: { color: "rgba(193, 87, 87, 0.14)" },
              },
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
            {
              yAxis: 3.5,
              label: { formatter: "相对稳定区" },
            },
            {
              yAxis: 6.5,
              label: { formatter: "明显受影响区" },
            },
          ],
        },
      },
      {
        type: "line",
        name: "日内波动",
        data: closeValues,
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
        data: imputedValues,
        connectNulls: false,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 10,
        z: 4,
        lineStyle: {
          width: 2,
          type: "dashed",
          color: "rgba(92, 112, 132, 0.72)",
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
          .map((candle, index) =>
            candle.annotation
              ? {
                  value: [index, levelToNumber(candle.close)],
                  labelText: candle.annotation,
                }
              : null,
          )
          .filter(Boolean),
        symbolSize: 8,
        itemStyle: {
          color: "#a9485f",
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
        },
        emphasis: {
          scale: false,
        },
        z: 5,
      },
    ],
  };
}
