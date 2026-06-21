import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { createCourseChartOption } from "../lib/chart";
import { DailyCandle } from "../types";

interface CandlestickChartProps {
  candles: DailyCandle[];
}

export function CandlestickChart({ candles }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) {
      return;
    }

    const chart = echarts.init(containerRef.current);
    chart.setOption(createCourseChartOption(candles));

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [candles]);

  if (candles.length === 0) {
    return (
      <div className="chart-empty">
        <strong>还没有病程数据</strong>
        <span>录入至少一天的记录后，这里会显示倒置的疲劳波动图。</span>
      </div>
    );
  }

  return <div ref={containerRef} className="chart-panel" />;
}
