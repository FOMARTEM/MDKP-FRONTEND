import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api, type Revision, type Status, type Task, type User, type Version } from "../lib/api";
import { formatDate } from "../lib/date";
import { required, type FieldErrors } from "../lib/validation";

type Fields = "title" | "description";

export default function VersionPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [version, setVersion] = useState<Version | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [edits, setEdits] = useState<Revision[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [form, setForm] = useState({ title: "", description: "" });
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [ok, setOk] = useState<string | null>(null);
  const [newStatusId, setNewStatusId] = useState<number>(0);

  const statusTitleById = useMemo(() => new Map(statuses.map((s) => [s.id, s.title])), [statuses]);

  const load = async () => {
    if (!Number.isInteger(id) || id <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const v = await api.version(id);
      const [e, s, t, u] = await Promise.all([api.edits(v.id), api.statuses(), api.task(v.task_id), api.users()]);
      setVersion(v);
      setTask(t);
      setEdits(e);
      setStatuses(s);
      setUsers(u);
      if (!newStatusId && s.length) setNewStatusId(s[0].id);
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

  const validate = () => {
    const next: FieldErrors<Fields> = {};
    if (!required(form.title)) next.title = "Обязательное поле";
    if (!required(form.description)) next.description = "Обязательное поле";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (!Number.isInteger(id) || id <= 0) return <div className="card">Некорректный ID версии</div>;

  const userById = new Map(users.map((u) => [u.id, u]));
  const creator = version?.creator_id ? userById.get(version.creator_id) : null;

  return (
    <>
      <div className="topbar">
        <h1>Версия #{id}</h1>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      {version && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{version.title}</h3>
          <div className="muted">{version.description}</div>
          <div className="row-3" style={{ marginTop: 12 }}>
            <div>
              <label>Задача</label>
              <div className="static-field">{task?.title ?? `#${version.task_id}`}</div>
            </div>
            <div>
              <label>Создатель</label>
              <div className="static-field">
                {creator ? `${creator.last_name} ${creator.first_name} (${creator.email})` : `#${version.creator_id}`}
              </div>
            </div>
            <div>
              <label>Дата</label>
              <div className="static-field">{formatDate(version.date_created)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="topbar">
          <h3 style={{ margin: 0 }}>Новая правка</h3>
          {ok && <span className="muted">{ok}</span>}
        </div>
        <div className="row-2">
          <div>
            <label>Заголовок</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <div className="error">{errors.title}</div>}
          </div>
          <div>
            <label>Описание</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {errors.description && <div className="error">{errors.description}</div>}
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label>Статус</label>
            <select value={String(newStatusId)} onChange={(e) => setNewStatusId(Number(e.target.value))}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={async () => {
              setOk(null);
              setError(null);
              if (!validate()) return;
              if (!newStatusId) return;
              setLoading(true);
              try {
                const date_created = new Date().toISOString();
                await api.createEdit(id, { ...form, status_id: newStatusId, date_created });
                setOk("Правка создана");
                setForm({ title: "", description: "" });
                await load();
              } catch (err) {
                setError(err);
              } finally {
                setLoading(false);
              }
            }}
          >
            Создать
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Правки</h3>
        {edits.length === 0 ? (
          <div className="muted">Правок нет</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Заголовок</th>
                <th>Описание</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {edits.map((e) => (
                <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/edits/${e.id}`)}>
                  <td>{e.id}</td>
                  <td>
                    <span style={{ color: "var(--primary)" }}>{e.title}</span>
                  </td>
                  <td>{e.description}</td>
                  <td>{statusTitleById.get(e.status_id) ?? `status#${e.status_id}`}</td>
                  <td onClick={(ev) => ev.stopPropagation()}>
                    <select
                      value={statusTitleById.get(e.status_id) ?? ""}
                      onChange={async (ev) => {
                        const nextStatus = ev.target.value;
                        setLoading(true);
                        setError(null);
                        try {
                          await api.updateEditStatus(e.id, nextStatus);
                          await load();
                        } catch (err) {
                          setError(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
