import { useEffect, useMemo, useState } from "react";
import { CandlestickChart } from "./components/CandlestickChart";
import { EntryForm } from "./components/EntryForm";
import { RecordTable } from "./components/RecordTable";
import { createDefaultScores, scoreEntry, sumScores, levelFromScore, buildReasonTags } from "./lib/scoring";
import { exportJsonBackup, fetchStorage, saveStorage, summarizeCandles } from "./lib/storage";
import { Entry, EntryInput, WorkbookData } from "./types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentTime(): string {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function makeEmptyDraft(): EntryInput {
  return {
    date: todayIso(),
    time: currentTime(),
    scores: createDefaultScores(),
    note: "",
    observerLevel: null,
    observerNote: "",
    duringMenstruation: false,
  };
}

export function App() {
  const [workbookData, setWorkbookData] = useState<WorkbookData>({ entries: [], dailyCandles: [] });
  const [draft, setDraft] = useState<EntryInput>(makeEmptyDraft());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [status, setStatus] = useState("正在连接程序目录中的 data/records.json …");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadRecords();
  }, []);

  const totalScore = useMemo(() => sumScores(draft.scores), [draft.scores]);
  const level = useMemo(() => levelFromScore(totalScore, draft.scores), [draft.scores, totalScore]);
  const reasonSummary = useMemo(() => buildReasonTags(draft.scores).join(" + "), [draft.scores]);

  async function loadRecords() {
    try {
      setBusy(true);
      setError(null);
      const parsed = await fetchStorage();
      setWorkbookData(parsed);
      setStatus(`已连接 data/records.json。${summarizeCandles(parsed)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "读取本地数据失败。");
      setStatus("未能连接到 data/records.json");
    } finally {
      setBusy(false);
    }
  }

  async function persistEntries(nextEntries: Entry[], successMessage: string) {
    const nextWorkbookData = await saveStorage(nextEntries);
    setWorkbookData(nextWorkbookData);
    setStatus(`${successMessage} ${summarizeCandles(nextWorkbookData)}`);
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const nextEntry = scoreEntry({
        ...draft,
        id: editingEntryId ?? undefined,
      });

      const nextEntries = editingEntryId
        ? workbookData.entries.map((entry) => (entry.id === editingEntryId ? nextEntry : entry))
        : [...workbookData.entries, nextEntry];

      await persistEntries(nextEntries, editingEntryId ? "已修改记录并写入 JSON。" : "已写入 JSON。");
      setDraft(makeEmptyDraft());
      setEditingEntryId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "写入 JSON 失败。");
    } finally {
      setBusy(false);
    }
  }

  function handleEdit(entry: Entry) {
    setEditingEntryId(entry.id);
    setDraft({
      id: entry.id,
      date: entry.date,
      time: entry.time,
      scores: entry.scores,
      note: entry.note ?? "",
      observerLevel: entry.observerLevel ?? null,
      observerNote: entry.observerNote ?? "",
      duringMenstruation: entry.duringMenstruation ?? false,
    });
    setStatus(`正在编辑 ${entry.date} ${entry.time} 的记录`);
  }

  async function handleDelete(entryId: string) {
    setBusy(true);
    setError(null);
    try {
      const nextEntries = workbookData.entries.filter((entry) => entry.id !== entryId);
      await persistEntries(nextEntries, "已删除记录并重算 JSON 汇总。");
      if (editingEntryId === entryId) {
        setEditingEntryId(null);
        setDraft(makeEmptyDraft());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除记录失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">本地 JSON 自动保存版</p>
          <h1>抑郁症疲劳记录表</h1>
          <p>
            按固定标准填写 6 个维度，程序会自动判定 `N1-N9` 疲劳等级，并把数据直接保存到程序目录中的 `data/records.json`，再同步重算每日汇总和蜡烛图。
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => void loadRecords()} disabled={busy}>
            重新读取本地数据
          </button>
          <button
            className="secondary-button"
            onClick={() => exportJsonBackup(workbookData.entries)}
            disabled={busy || workbookData.entries.length === 0}
          >
            导出 JSON 备份
          </button>
        </div>
      </section>

      <section className="status-strip">
        <span>{status}</span>
        {busy ? <strong>正在处理…</strong> : null}
      </section>

      {error ? <section className="error-banner">{error}</section> : null}

      <section className="layout-grid">
        <EntryForm
          draft={draft}
          totalScore={totalScore}
          level={level}
          reasonSummary={reasonSummary}
          editingEntryId={editingEntryId}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onCancelEdit={() => {
            setEditingEntryId(null);
            setDraft(makeEmptyDraft());
          }}
        />

        <div className="side-panel">
          <div className="card info-card">
            <p className="eyebrow">判定规则</p>
            <h2>N1-N9 九级疲劳</h2>
            <ul>
              <li>`0-2 = N1`, `3-4 = N2`, `5-6 = N3`</li>
              <li>`7-8 = N4`, `9-10 = N5`, `11-12 = N6`</li>
              <li>`13-14 = N7`, `15-16 = N8`, `17-18 = N9`</li>
              <li>此刻身体疲惫或行动启动难度达到 3 分，且总分位于升级边界时，上调 1 级。</li>
            </ul>
          </div>
          <div className="card info-card">
            <p className="eyebrow">记录原则</p>
            <h2>记录此刻，不做总结</h2>
            <p>这张表优先记录“现在这一刻”的身心状态。像睡眠、工作负荷、刚发生的事，建议写进备注，而不是混进主评分里。</p>
          </div>
          <div className="card info-card">
            <p className="eyebrow">补充视角</p>
            <h2>允许独立他评</h2>
            <p>如果当时有家人、伴侣或朋友在场，可以补一个独立的他评等级。它不会改动主评分，但会单独显示在记录表和图表里。</p>
          </div>
        </div>
      </section>

      <section className="card chart-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">每日汇总病程</p>
            <h2>倒置疲劳病程图</h2>
          </div>
          <p className="chart-caption">每天只占一个 X 轴点位；同一天的多次记录会在该点位垂直堆叠，点击点位可查看各项评分，橙色菱形表示身边人的他评，例假期间的点位会显示为红色。</p>
        </div>
        <CandlestickChart candles={workbookData.dailyCandles} entries={workbookData.entries} />
      </section>

      <RecordTable entries={workbookData.entries} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
}
