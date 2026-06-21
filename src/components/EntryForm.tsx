import { ChangeEvent, FormEvent } from "react";
import { DIMENSIONS } from "../constants";
import { Entry, EntryInput, FatigueLevel, ScoreMap } from "../types";

interface EntryFormProps {
  draft: EntryInput;
  totalScore: number;
  level: FatigueLevel;
  reasonSummary: string;
  editingEntryId: string | null;
  onChange: (draft: EntryInput) => void;
  onSubmit: () => Promise<void>;
  onCancelEdit: () => void;
}

export function EntryForm({
  draft,
  totalScore,
  level,
  reasonSummary,
  editingEntryId,
  onChange,
  onSubmit,
  onCancelEdit,
}: EntryFormProps) {
  function handleMetaChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    onChange({
      ...draft,
      [name]: value,
    });
  }

  function handleScoreChange(key: keyof ScoreMap, value: number) {
    onChange({
      ...draft,
      scores: {
        ...draft.scores,
        [key]: value,
      },
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit();
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <p className="eyebrow">即时填写</p>
          <h2>{editingEntryId ? "修改一条记录" : "新增一条记录"}</h2>
          <p className="form-helper">只记录你“现在这一刻”的状态，不需要回顾今天整体怎样。</p>
        </div>
        {editingEntryId ? (
          <button type="button" className="ghost-button" onClick={onCancelEdit}>
            取消编辑
          </button>
        ) : null}
      </div>

      <div className="meta-grid">
        <label>
          日期
          <input type="date" name="date" value={draft.date} onChange={handleMetaChange} required />
        </label>
        <label>
          时间
          <input type="time" name="time" value={draft.time} onChange={handleMetaChange} required />
        </label>
      </div>

      <div className="dimensions">
        {DIMENSIONS.map((dimension) => (
          <section key={dimension.key} className="dimension-card">
            <div className="dimension-heading">
              <h3>{dimension.label}</h3>
              <p>{dimension.weightLabel}</p>
            </div>
            <div className="option-grid">
              {dimension.options.map((option) => (
                <label key={option.value} className="option-card">
                  <input
                    type="radio"
                    name={dimension.key}
                    value={option.value}
                    checked={draft.scores[dimension.key] === option.value}
                    onChange={() => handleScoreChange(dimension.key, option.value)}
                  />
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <label>
        备注
        <textarea
          name="note"
          rows={3}
          value={draft.note ?? ""}
          onChange={handleMetaChange}
          placeholder="可选：补充此刻的触发因素、所在情境、刚发生的事或身体感觉"
        />
      </label>

      <div className="score-banner">
        <div>
          <p>总分</p>
          <strong>{totalScore}</strong>
        </div>
        <div>
          <p>疲劳等级</p>
          <strong>{level}</strong>
        </div>
        <div>
          <p>自动摘要</p>
          <strong>{reasonSummary}</strong>
        </div>
      </div>

      <button className="primary-button" type="submit">
        {editingEntryId ? "保存修改并写入 JSON" : "写入 JSON"}
      </button>
    </form>
  );
}
