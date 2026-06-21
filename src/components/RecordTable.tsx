import { Entry } from "../types";

interface RecordTableProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (entryId: string) => Promise<void>;
}

export function RecordTable({ entries, onEdit, onDelete }: RecordTableProps) {
  return (
    <div className="card table-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">历史记录</p>
          <h2>记录表</h2>
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>时间</th>
              <th>例假期</th>
              <th>总分</th>
              <th>等级</th>
              <th>他评</th>
              <th>摘要</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-row">
                  还没有记录。直接填写今天的状态，程序会自动保存到项目目录里的 data/records.json。
                </td>
              </tr>
            ) : (
              [...entries]
                .sort((left, right) => `${right.date}T${right.time}`.localeCompare(`${left.date}T${left.time}`))
                .map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.time}</td>
                    <td>{entry.duringMenstruation ? "是" : "否"}</td>
                    <td>{entry.totalScore}</td>
                    <td>{entry.level}</td>
                    <td>{entry.observerLevel ? `${entry.observerLevel}${entry.observerNote ? ` · ${entry.observerNote}` : ""}` : "—"}</td>
                    <td>{entry.reasonTags.join(" + ")}</td>
                    <td>{entry.note || "—"}</td>
                    <td className="actions-cell">
                      <button className="ghost-button" onClick={() => onEdit(entry)}>
                        编辑
                      </button>
                      <button className="danger-button" onClick={() => onDelete(entry.id)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
