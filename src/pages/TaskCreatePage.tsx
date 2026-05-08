import { useEffect, useState } from "react";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api, type Role, type User } from "../lib/api";
import { isManager } from "../lib/roles";
import { isIntInRange, required, type FieldErrors } from "../lib/validation";
import { useAuth } from "../state/auth";

type Fields = "title" | "description" | "priority";

export default function TaskCreatePage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);

  const [roles, setRoles] = useState<Role[]>([]);
  const [authors, setAuthors] = useState<User[]>([]);
  const [editors, setEditors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date_deadline: "",
    priority: 2,
    id_author: 0,
    id_redactor: 0,
    file: null as File | null,
    fileDesc: ""
  });
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.roles();
      setRoles(r);
      if (manager) {
        const authorRole = r.find((x) => x.title.toLowerCase().includes("автор") || x.title.toLowerCase().includes("author"));
        const editorRole = r.find((x) => x.title.toLowerCase().includes("редакт") || x.title.toLowerCase().includes("editor"));
        const [a, e] = await Promise.all([
          authorRole ? api.findUsers({ role: authorRole.title }) : Promise.resolve([]),
          editorRole ? api.findUsers({ role: editorRole.title }) : Promise.resolve([])
        ]);
        setAuthors(a);
        setEditors(e);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const validate = () => {
    const next: FieldErrors<Fields> = {};
    if (!required(form.title)) next.title = "Обязательное поле";
    if (!required(form.description)) next.description = "Обязательное поле";
    if (!isIntInRange(form.priority, 1, 5)) next.priority = "Приоритет: 1–5";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (!manager) return <div className="card">Доступно только руководителю</div>;

  return (
    <>
      <h1>Создать задачу</h1>
      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      <div className="card">
        <div className="topbar">
          <h3 style={{ margin: 0 }}>Новая задача</h3>
          {ok && <span className="muted">{ok}</span>}
        </div>
        <div className="row-2">
          <div>
            <label>Название</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <div className="error">{errors.title}</div>}
          </div>
          <div>
            <label>Дедлайн</label>
            <input
              type="date"
              value={form.date_deadline}
              onChange={(e) => setForm({ ...form, date_deadline: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label>Описание</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {errors.description && <div className="error">{errors.description}</div>}
          </div>
          <div>
            <label>Приоритет (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
            {errors.priority && <div className="error">{errors.priority}</div>}
          </div>
          <div>
            <label>Автор</label>
            <select value={String(form.id_author)} onChange={(e) => setForm({ ...form, id_author: Number(e.target.value) })}>
              <option value="0">Выберите Автора из списка</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.last_name} {a.first_name} ({a.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Редактор</label>
            <select value={String(form.id_redactor)} onChange={(e) => setForm({ ...form, id_redactor: Number(e.target.value) })}>
              <option value="0">Выберите Редактора из списка</option>
              {editors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.last_name} {a.first_name} ({a.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Материал (файл)</label>
            <input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
          </div>
          <div>
            <label>Описание файла</label>
            <input value={form.fileDesc} onChange={(e) => setForm({ ...form, fileDesc: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={async () => {
                setOk(null);
                setError(null);
                if (!validate()) return;
                setLoading(true);
                try {
                  const created = await api.createTask({
                    title: form.title,
                    description: form.description,
                    date_deadline: form.date_deadline || undefined,
                    priority: form.priority,
                    id_author: form.id_author || undefined,
                    id_redactor: form.id_redactor || undefined
                  });
                  if (form.file) {
                    if (!required(form.fileDesc)) throw new Error("Введите описание файла");
                    await api.uploadMaterialToTask(created.id, form.file, form.fileDesc);
                  }
                  setOk("Задача создана");
                  setForm({
                    title: "",
                    description: "",
                    date_deadline: "",
                    priority: 2,
                    id_author: 0,
                    id_redactor: 0,
                    file: null,
                    fileDesc: ""
                  });
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
      </div>
    </>
  );
}

