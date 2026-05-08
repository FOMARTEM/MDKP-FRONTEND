import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api, type Revision, type Status, type User, type Version } from "../lib/api";
import { formatDate } from "../lib/date";

export default function EditPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [edit, setEdit] = useState<Revision | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = async () => {
    if (!Number.isInteger(id) || id <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const [e, s, u] = await Promise.all([api.edit(id), api.statuses(), api.users()]);
      const v = await api.version(e.version_id);
      setEdit(e);
      setStatuses(s);
      setUsers(u);
      setVersion(v);
      const map = new Map(s.map((x) => [x.id, x.title]));
      setStatus(map.get(e.status_id) ?? "");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!Number.isInteger(id) || id <= 0) return <div className="card">Некорректный ID правки</div>;

  const userById = new Map(users.map((u) => [u.id, u]));
  const creator = edit?.creator_id ? userById.get(edit.creator_id) : null;

  return (
    <>
      <div className="topbar">
        <h1>Правка #{id}</h1>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      {edit && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{edit.title}</h3>
          <div className="muted">{edit.description}</div>
          <div className="row-3" style={{ marginTop: 12 }}>
            <div>
              <label>Версия</label>
              <div className="static-field">{version?.title ?? `#${edit.version_id}`}</div>
            </div>
            <div>
              <label>Создатель</label>
              <div className="static-field">
                {creator ? `${creator.last_name} ${creator.first_name} (${creator.email})` : `#${edit.creator_id}`}
              </div>
            </div>
            <div>
              <label>Дата</label>
              <div className="static-field">{formatDate(edit.date_created)}</div>
            </div>
          </div>
          <div className="row-2" style={{ marginTop: 12 }}>
            <div>
              <label>Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
              <button
                className="btn btn-primary"
                disabled={loading || !status}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    await api.updateEditStatus(id, status);
                    await load();
                  } catch (err) {
                    setError(err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Обновить статус
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
