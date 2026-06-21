import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { createCourseChartOption } from "../lib/chart";
import { DailyCandle, Entry } from "../types";
import { DIMENSIONS } from "../constants";

interface CandlestickChartProps {
  candles: DailyCandle[];
  entries: Entry[];
}

export function CandlestickChart({ candles, entries }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Entry[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");

  const dimensionLabels = useMemo(
    () => Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, dimension.label])),
    [],
  );

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) {
      return;
    }

    const chart = echarts.init(containerRef.current);
    chart.setOption(createCourseChartOption(candles, entries));
    chart.on("click", (params) => {
      const data = params.data as { entries?: Entry[]; entry?: Entry } | null;

      if (params.seriesName === "日内记录点" && data?.entries) {
        const points = data.entries;
        const date = points[0]?.date ?? "";
        const level = points[0]?.level ?? "";
        setSelectedEntries(points);
        setSelectedTitle(`${date} · ${level} · ${points.length} 条记录`);
        return;
      }

      if (params.seriesName === "身边人他评" && data?.entry) {
        const point = data.entry;
        setSelectedEntries([point]);
        setSelectedTitle(`${point.date} ${point.time} · 他评 ${point.observerLevel ?? ""}`);
        return;
      }

      setSelectedEntries([]);
      setSelectedTitle("");
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [candles, entries]);

  if (candles.length === 0) {
    return (
      <div className="chart-empty">
        <strong>还没有病程数据</strong>
        <span>录入至少一天的记录后，这里会显示倒置的疲劳波动图。</span>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="chart-panel" />
      {selectedEntries.length > 0 ? (
        <section className="chart-detail-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">点位明细</p>
              <h3>{selectedTitle}</h3>
            </div>
          </div>
          <div className="chart-detail-list">
            {selectedEntries.map((entry) => (
              <article key={entry.id} className="chart-detail-item">
                <strong>
                  {entry.date} {entry.time} · {entry.level}
                </strong>
                {entry.duringMenstruation ? <p>例假期间：是</p> : null}
                <div className="chart-detail-scores">
                  {DIMENSIONS.map((dimension) => (
                    <span key={`${entry.id}-${dimension.key}`}>
                      {dimensionLabels[dimension.key]}：{entry.scores[dimension.key]}分
                    </span>
                  ))}
                </div>
                {entry.observerLevel ? <p>他评：{entry.observerLevel}{entry.observerNote ? ` · ${entry.observerNote}` : ""}</p> : null}
                {entry.note ? <p>备注：{entry.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
