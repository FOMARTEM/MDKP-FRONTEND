import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api, type Status, type Task } from "../lib/api";
import { formatDate } from "../lib/date";

function statusBadge(statusTitle?: string) {
  const s = (statusTitle ?? "").toLowerCase();
  if (s.includes("закры") || s.includes("done")) return "status status-done";
  return "status status-process";
}

export default function TasksPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Защита: если statuses придет как null, map не упадет
  const statusById = useMemo(() => {
    const safeStatuses = statuses || [];
    return new Map(safeStatuses.map((s) => [s.id, s.title]));
  }, [statuses]);

  const [sort, setSort] = useState<{ key: "status" | "deadline" | "priority"; dir: "asc" | "desc" }>({
    key: "deadline",
    dir: "asc"
  });

  const sortedTasks = useMemo(() => {
    // Защита: если tasks придет как null, создаем пустой массив
    const copy = [...(tasks || [])];
    if (copy.length === 0) return [];

    const dir = sort.dir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      if (sort.key === "priority") return (a.priority - b.priority) * dir;
      if (sort.key === "deadline") return String(a.date_deadline ?? "").localeCompare(String(b.date_deadline ?? "")) * dir;
      const sa = statusById.get(a.id_status) ?? "";
      const sb = statusById.get(b.id_status) ?? "";
      return sa.localeCompare(sb) * dir;
    });
    return copy;
  }, [tasks, sort, statusById]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s] = await Promise.all([api.taskList(), api.statuses()]);
      // Защита: принудительно устанавливаем пустые массивы, если бэкенд вернул null
      setTasks(t || []);
      setStatuses(s || []);
    } catch (err) {
      console.error("Ошибка загрузки задач:", err);
      setError(err);
      setTasks([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className="topbar">
        <h1>Задачи</h1>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          Обновить
        </button>
      </div>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      <div className="card">
        <div className="topbar">
          <h3 style={{ margin: 0 }}>Список</h3>
          <div className="muted">
            Сортировка:{" "}
            <button
              className="btn btn-outline"
              style={{ padding: "6px 10px" }}
              onClick={() => setSort((s) => ({ key: "status", dir: s.key === "status" && s.dir === "asc" ? "desc" : "asc" }))}
            >
              Статус
            </button>{" "}
            <button
              className="btn btn-outline"
              style={{ padding: "6px 10px" }}
              onClick={() =>
                setSort((s) => ({ key: "deadline", dir: s.key === "deadline" && s.dir === "asc" ? "desc" : "asc" }))
              }
            >
              Дедлайн
            </button>{" "}
            <button
              className="btn btn-outline"
              style={{ padding: "6px 10px" }}
              onClick={() =>
                setSort((s) => ({ key: "priority", dir: s.key === "priority" && s.dir === "asc" ? "desc" : "asc" }))
              }
            >
              Приоритет
            </button>
          </div>
        </div>

        {/* Проверка на пустой список задач */}
        {!sortedTasks || sortedTasks.length === 0 ? (
          <div className="muted" style={{ marginTop: 20, textAlign: "center", padding: "20px" }}>
            Задач пока нет
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Задача</th>
                <th>Срок</th>
                <th>Статус</th>
                <th>Приоритет</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((t) => (
                <tr
                  key={t.id}
                  className="clickable-row"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{t.id}</td>
                  <td>
                    <span style={{ color: "var(--primary)" }}>{t.title}</span>
                    <div className="muted">{t.description}</div>
                  </td>
                  <td>{formatDate(t.date_deadline)}</td>
                  <td>
                    <span className={statusBadge(statusById.get(t.id_status))}>
                      {statusById.get(t.id_status) ?? `status#${t.id_status}`}
                    </span>
                  </td>
                  <td>{t.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}