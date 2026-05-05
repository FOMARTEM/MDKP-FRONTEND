import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import FileIcon from "../components/FileIcon";
import { api, type Material, type Status, type Task, type User, type Version } from "../lib/api";
import { formatDate } from "../lib/date";
import { isAuthor, isEditor, isManager } from "../lib/roles";
import { required, type FieldErrors } from "../lib/validation";
import { useAuth } from "../state/auth";

type VersionFields = "title" | "description";

export default function TaskPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? "";
  const manager = isManager(role);
  const canCreateVersion = isEditor(role) || isAuthor(role);

  const [task, setTask] = useState<Task | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileDesc, setFileDesc] = useState("");
  const [fileOk, setFileOk] = useState<string | null>(null);

  const [verForm, setVerForm] = useState({ title: "", description: "" });
  const [verErrors, setVerErrors] = useState<FieldErrors<VersionFields>>({});
  const [verOk, setVerOk] = useState<string | null>(null);

  const load = async () => {
    if (!Number.isInteger(id) || id <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const [t, vs, st, mats, us] = await Promise.all([
        api.task(id),
        api.versions(id),
        api.statuses(),
        api.materialsByTask(id),
        api.users()
      ]);
      setTask(t);
      setVersions(vs);
      setStatuses(st);
      setMaterials(mats);
      setUsers(us);
      const map = new Map(st.map((s) => [s.id, s.title]));
      setStatus(map.get(t.id_status) ?? "");
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

  const validateVersion = () => {
    const next: FieldErrors<VersionFields> = {};
    if (!required(verForm.title)) next.title = "Обязательное поле";
    if (!required(verForm.description)) next.description = "Обязательное поле";
    setVerErrors(next);
    return Object.keys(next).length === 0;
  };

  if (!Number.isInteger(id) || id <= 0) return <div className="card">Некорректный ID задачи</div>;

  const userById = new Map(users.map((u) => [u.id, u]));
  const author = task?.id_author ? userById.get(task.id_author) : null;
  const editor = task?.id_redactor ? userById.get(task.id_redactor) : null;

  return (
    <>
      <div className="topbar">
        <h1>Задача #{id}</h1>
        <button className="btn btn-outline" onClick={() => navigate("/tasks")}>
          Назад
        </button>
      </div>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      {task && (
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: "1.35rem" }}>{task.title}</h3>
          <div className="muted" style={{ fontSize: "1rem" }}>
            {task.description}
          </div>
          <div className="row-4" style={{ marginTop: 12 }}>
            <div>
              <label>Дедлайн</label>
              <div className="static-field">{formatDate(task.date_deadline)}</div>
            </div>
            <div>
              <label>Приоритет</label>
              <div className="static-field">{String(task.priority)}</div>
            </div>
            <div>
              <label>Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">—</option>
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
                    await api.updateTaskStatus(id, status);
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
              <button
                className="btn btn-danger"
                disabled={loading}
                onClick={async () => {
                  if (!confirm("Удалить задачу?")) return;
                  setLoading(true);
                  setError(null);
                  try {
                    await api.deleteTask(id);
                    navigate("/tasks");
                  } catch (err) {
                    setError(err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Удалить
              </button>
            </div>
          </div>

          <div className="row-2" style={{ marginTop: 12 }}>
            <div>
              <label>Автор</label>
              <div className="static-field">
                {author ? `${author.last_name} ${author.first_name} (${author.email})` : "Не назначен"}
              </div>
            </div>
            <div>
              <label>Редактор</label>
              <div className="static-field">
                {editor ? `${editor.last_name} ${editor.first_name} (${editor.email})` : "Не назначен"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Материалы задачи</h3>
        {materials.length === 0 ? (
          <div className="muted">Файлы ещё не прикреплены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Файл</th>
                <th>Описание</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>
                    <FileIcon ext={m.extension} />
                    {m.title}.{m.extension}
                  </td>
                  <td>{m.description}</td>
                  <td>
                    <button
                      className="btn btn-outline"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        setError(null);
                        try {
                          await api.downloadMaterial(m.id);
                        } catch (err) {
                          setError(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Скачать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Загрузить материал к задаче</h3>
        <div className="row-2">
          <div>
            <label>Файл</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label>Описание</label>
            <input value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} placeholder="Краткое описание" />
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn-primary"
            disabled={loading || !file || !required(fileDesc)}
            onClick={async () => {
              if (!file) return;
              setFileOk(null);
              setLoading(true);
              setError(null);
              try {
                await api.uploadMaterialToTask(id, file, fileDesc);
                setFile(null);
                setFileDesc("");
                setFileOk("Файл загружен");
                await load();
              } catch (err) {
                setError(err);
              } finally {
                setLoading(false);
              }
            }}
          >
            Загрузить
          </button>
          {fileOk && <span className="muted">{fileOk}</span>}
          {!required(fileDesc) && <span className="muted">Описание обязательно</span>}
        </div>
      </div>

      {canCreateVersion && !manager && (
        <div className="card">
          <h3>Новая версия</h3>
          <div className="row-2">
            <div>
              <label>Название</label>
              <input value={verForm.title} onChange={(e) => setVerForm({ ...verForm, title: e.target.value })} />
              {verErrors.title && <div className="error">{verErrors.title}</div>}
            </div>
            <div>
              <label>Описание</label>
              <input
                value={verForm.description}
                onChange={(e) => setVerForm({ ...verForm, description: e.target.value })}
              />
              {verErrors.description && <div className="error">{verErrors.description}</div>}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={async () => {
                setVerOk(null);
                setError(null);
                if (!validateVersion()) return;
                setLoading(true);
                try {
                  const number_version = versions.length + 1;
                  const date_created = new Date().toISOString();
                  await api.createVersion(id, { ...verForm, number_version, date_created });
                  setVerOk("Версия создана");
                  setVerForm({ title: "", description: "" });
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
            {verOk && <span className="muted">{verOk}</span>}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Версии</h3>
        {versions.length === 0 ? (
          <div className="muted">Версии ещё не созданы</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/versions/${v.id}`)}>
                  <td>{v.id}</td>
                  <td>
                    <span style={{ color: "var(--primary)" }}>{v.title}</span>
                  </td>
                  <td>{v.description}</td>
                  <td>{formatDate(v.date_created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
