import { useEffect, useState } from "react";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api, type Log } from "../lib/api";
import { formatDate } from "../lib/date";
import { isEmail, isISODate } from "../lib/validation";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState("32");
  const [offset, setOffset] = useState("0");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const q: { email?: string; user_id?: number; start_date?: string; end_date?: string } = {};
      if (email.trim()) {
        if (!isEmail(email)) throw new Error("Некорректный email в фильтре");
        q.email = email.trim();
      }
      if (userId.trim()) {
        const n = Number(userId);
        if (!Number.isInteger(n) || n <= 0) throw new Error("Некорректный user_id в фильтре");
        q.user_id = n;
      }
      if (startDate.trim()) {
        if (!isISODate(startDate)) throw new Error("start_date должен быть YYYY-MM-DD");
        q.start_date = startDate;
      }
      if (endDate.trim()) {
        if (!isISODate(endDate)) throw new Error("end_date должен быть YYYY-MM-DD");
        q.end_date = endDate;
      }
      const data = await api.activityLogs({
        ...q,
        limit: limit.trim() ? Number(limit) : undefined,
        offset: offset.trim() ? Number(offset) : undefined
      });
      setLogs(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1>Журнал действий</h1>
      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      <div className="card">
        <h3>Фильтры</h3>
        <div className="row-4">
          <div>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@mail.ru" />
          </div>
          <div>
            <label>User ID</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="123" />
          </div>
          <div>
            <label>Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="row-2" style={{ marginTop: 12 }}>
          <div>
            <label>Limit</label>
            <input value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
          <div>
            <label>Offset</label>
            <input value={offset} onChange={(e) => setOffset(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            Применить
          </button>
        </div>
      </div>

      <div className="card">
        <h3>События</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Время</th>
              <th>User ID</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{formatDate(l.date_created)}</td>
                <td>{l.user_id}</td>
                <td>{l.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
