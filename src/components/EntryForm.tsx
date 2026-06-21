import { ChangeEvent, FormEvent } from "react";
import { DIMENSIONS } from "../constants";
import { EntryInput, FatigueLevel, ScoreMap } from "../types";

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
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : value;
    onChange({
      ...draft,
      [name]: nextValue,
    });
  }

  function handleObserverChange(event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    onChange({
      ...draft,
      [name]: name === "observerLevel" ? (value ? (value as FatigueLevel) : null) : value,
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

      <label className="inline-toggle">
        <input
          type="checkbox"
          name="duringMenstruation"
          checked={draft.duringMenstruation ?? false}
          onChange={handleMetaChange}
        />
        <span>当前记录处于例假期间</span>
      </label>

      <div className="dimensions">
        <div className="scale-legend">
          <span>左侧更稳</span>
          <span>右侧更困难</span>
        </div>
        {DIMENSIONS.map((dimension) => (
          <section key={dimension.key} className="dimension-row">
            <div className="dimension-heading">
              <h3>{dimension.label}</h3>
              <p>{dimension.weightLabel}</p>
            </div>
            <div className="option-strip" role="radiogroup" aria-label={dimension.label}>
              {dimension.options.map((option, index) => (
                <label
                  key={option.value}
                  className={`option-chip option-chip-${index} ${
                    draft.scores[dimension.key] === option.value ? "is-selected" : ""
                  }`}
                  title={option.description}
                >
                  <input
                    type="radio"
                    name={dimension.key}
                    value={option.value}
                    checked={draft.scores[dimension.key] === option.value}
                    onChange={() => handleScoreChange(dimension.key, option.value)}
                  />
                  <strong>{option.label}</strong>
                  <span>{index === 0 ? "稳" : index === 1 ? "轻" : index === 2 ? "中" : "重"}</span>
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

      <section className="observer-section">
        <div className="dimension-heading">
          <h3>身边人的补充评价</h3>
          <p>可选：如果当时有人在场，可以补一个他评等级，和自评分开保存。</p>
        </div>
        <div className="meta-grid">
          <label>
            他评等级
            <select name="observerLevel" value={draft.observerLevel ?? ""} onChange={handleObserverChange}>
              <option value="">无</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
              <option value="N4">N4</option>
              <option value="N5">N5</option>
              <option value="N6">N6</option>
              <option value="N7">N7</option>
              <option value="N8">N8</option>
              <option value="N9">N9</option>
            </select>
          </label>
          <label>
            他评备注
            <textarea
              name="observerNote"
              rows={3}
              value={draft.observerNote ?? ""}
              onChange={handleObserverChange}
              placeholder="可选：比如“说话变慢”“看起来很累”“明显不想交流”"
            />
          </label>
        </div>
      </section>

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
