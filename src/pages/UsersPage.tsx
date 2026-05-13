import { useEffect, useMemo, useState, useRef } from "react";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api, type Role, type User } from "../lib/api";
import { formatDate } from "../lib/date";
import { isEmail, isPhone, isISODate, minMax, required, type FieldErrors } from "../lib/validation";

type Fields =
  | "last_name"
  | "first_name"
  | "middle_name"
  | "phone"
  | "date_of_birth"
  | "email"
  | "password"
  | "role";

/**
 * Вспомогательный компонент для предотвращения сдвигов интерфейса.
 */
function FormField({ label, error, children, required, style }: any) {
  return (
    <div style={{ position: "relative", paddingBottom: "20px", ...style }}>
      <label style={{ display: "block", marginBottom: "4px" }}>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </label>
      {children}
      {error && (
        <div 
          className="error" 
          style={{ 
            position: "absolute", 
            bottom: "2px", 
            left: 0, 
            fontSize: "11px", 
            lineHeight: "1",
            margin: 0,
            whiteSpace: "nowrap"
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояния для формы
  const [form, setForm] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    phone: "",
    date_of_birth: "",
    email: "",
    password: "",
    role: ""
  });
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [ok, setOk] = useState<string | null>(null);
  
  // Ошибки массового импорта
  const [importErrors, setImportErrors] = useState<{ email: string; reason: string }[]>([]);

  // Состояния поиска
  const [search, setSearch] = useState({ email: "", role: "", last_name: "", first_name: "" });
  const [found, setFound] = useState<User[]>([]);

  const roleOptions = useMemo(() => roles.map((r) => r.title), [roles]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, u] = await Promise.all([api.roles(), api.users()]);
      setRoles(r);
      setUsers(u || []);
      if (!form.role && r.length) setForm((f) => ({ ...f, role: r[0].title }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const downloadData = (data: any[], fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const usersToImport = Array.isArray(json) ? json : [json];
        
        setLoading(true);
        setImportErrors([]);
        setOk(null);
        
        let successCount = 0;
        const failedUsers: { email: string; reason: string }[] = [];

        for (const u of usersToImport) {
          try {
            // 1. Проверка обязательных полей
            if (!u.email || !u.password || !u.phone || !u.last_name || !u.first_name || !u.middle_name) {
              throw new Error("Отсутствуют обязательные поля (ФИО, Email, Телефон, Пароль)");
            }

            // 2. Строгая проверка телефона (запрет +7, разрешено только 8XXXXXXXXXX)
            if (!isPhone(u.phone)) {
              throw new Error("Неверный формат телефона. Ожидается 11 цифр, начиная с 8");
            }

            // 3. Валидация Email
            if (!isEmail(u.email)) {
              throw new Error("Некорректный формат Email");
            }

            await api.createUser(u);
            successCount++;
          } catch (err: any) {
            failedUsers.push({
              email: u.email || "Unknown",
              reason: err?.response?.data?.error || err?.message || "Ошибка сервера"
            });
          }
        }
        
        if (successCount > 0) setOk(`Успешно импортировано: ${successCount}`);
        setImportErrors(failedUsers);
        await reload();
      } catch (err) {
        setError("Не удалось обработать JSON файл.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const validate = () => {
    const next: FieldErrors<Fields> = {};
    if (!required(form.last_name)) next.last_name = "Обязательное поле";
    if (!required(form.first_name)) next.first_name = "Обязательное поле";
    if (!required(form.middle_name)) next.middle_name = "Обязательное поле";
    if (!required(form.email) || !isEmail(form.email)) next.email = "Некорректный email";
    if (!required(form.password) || !minMax(form.password, 8, 16)) next.password = "Пароль: 8–16 символов";
    if (!required(form.role)) next.role = "Выберите роль";
    
    if (!required(form.phone)) {
      next.phone = "Обязательное поле";
    } else if (!isPhone(form.phone)) {
      next.phone = "Формат: 8XXXXXXXXXX";
    }

    if (form.date_of_birth && !isISODate(form.date_of_birth)) next.date_of_birth = "Формат: YYYY-MM-DD";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <>
      <div className="topbar">
        <h1>Управление сотрудниками</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            accept=".json" 
            onChange={handleFileUpload} 
          />
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
            Импорт JSON
          </button>
          <button className="btn btn-primary" onClick={reload} disabled={loading}>
            Обновить
          </button>
        </div>
      </div>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      <div className="card">
        <h3>Регистрация нового пользователя</h3>
        
        <div className="row-4" style={{ gridTemplateColumns: "1fr 1fr 1fr auto", alignItems: "start" }}>
          <FormField label="Фамилия" error={errors.last_name} required>
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </FormField>

          <FormField label="Email" error={errors.email} required>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>

          <FormField label="Роль" error={errors.role} required>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FormField>

          <div style={{ paddingTop: "26px" }}>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={async () => {
                setOk(null);
                setError(null);
                setImportErrors([]);
                if (!validate()) return;
                setLoading(true);
                try {
                  await api.createUser(form);
                  setOk("Пользователь создан");
                  setForm({
                    last_name: "", first_name: "", middle_name: "",
                    phone: "", date_of_birth: "", email: "",
                    password: "", role: roleOptions[0] || ""
                  });
                  setErrors({});
                  await reload();
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

        <div className="row-4" style={{ marginTop: 4, alignItems: "start" }}>
          <FormField label="Имя" error={errors.first_name} required>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </FormField>

          <FormField label="Отчество" error={errors.middle_name} required>
            <input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
          </FormField>

          <FormField label="Телефон" error={errors.phone} required>
            <input 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              placeholder="89001234567" 
            />
          </FormField>

          <FormField label="Дата рождения" error={errors.date_of_birth}>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </FormField>
        </div>

        <div style={{ marginTop: 4 }}>
          <FormField label="Временный пароль (8–16 символов)" error={errors.password} required>
            <input              
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
        </div>

        {ok && <div className="muted" style={{ marginTop: 10, color: "green", fontWeight: "bold" }}>{ok}</div>}

        {importErrors.length > 0 && (
          <div style={{ marginTop: 15, padding: "10px", border: "1px solid #ffcccb", borderRadius: "4px", backgroundColor: "#fff5f5" }}>
            <h4 style={{ color: "#d32f2f", margin: "0 0 8px 0" }}>Ошибки импорта ({importErrors.length}):</h4>
            <ul style={{ margin: 0, fontSize: "0.9em", color: "#333" }}>
              {importErrors.map((err, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  <span style={{ fontWeight: "bold" }}>{err.email}</span>: {err.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <div className="topbar">
          <h3 style={{ margin: 0 }}>Изменение прав / поиск</h3>
          {found.length > 0 && (
            <button className="btn btn-outline" onClick={() => downloadData(found, "search_results")}>
              Скачать результаты ({found.length})
            </button>
          )}
        </div>
        <div className="row-4" style={{ marginTop: 15 }}>
          <div>
            <label>Email</label>
            <input value={search.email} onChange={(e) => setSearch({ ...search, email: e.target.value })} />
          </div>
          <div>
            <label>Роль</label>
            <select value={search.role} onChange={(e) => setSearch({ ...search, role: e.target.value })}>
              <option value="">Все роли</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Фамилия</label>
            <input value={search.last_name} onChange={(e) => setSearch({ ...search, last_name: e.target.value })} />
          </div>
          <div>
            <label>Имя</label>
            <input value={search.first_name} onChange={(e) => setSearch({ ...search, first_name: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const data = await api.findUsers({
                  role: search.role || undefined,
                  email: search.email || undefined,
                  last_name: search.last_name || undefined,
                  first_name: search.first_name || undefined
                });
                setFound(data || []);
              } catch (err) {
                setError(err);
              } finally {
                setLoading(false);
              }
            }}
          >
            Найти
          </button>
          <button
            className="btn btn-outline"
            disabled={loading}
            onClick={() => {
              setFound([]);
              setSearch({ email: "", role: "", last_name: "", first_name: "" });
            }}
          >
            Сброс
          </button>
        </div>
        {found.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>ФИО</th>
                <th>Роль</th>
                <th>Active</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {found.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.last_name} {u.first_name} {u.middle_name}
                    <div className="muted">{formatDate(u.date_of_birth)}</div>
                  </td>
                  <td>
                    <select
                      value={u.role ?? ""}
                      onChange={async (e) => {
                        const roleTitle = e.target.value;
                        const role = roles.find((r) => r.title === roleTitle);
                        if (!role) return;
                        setLoading(true);
                        try {
                          await api.updateUserRole(u.email, role.id);
                          await reload();
                          setFound(prev => prev.map(item => item.id === u.id ? {...item, role: roleTitle} : item));
                        } catch (err) {
                          setError(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>{u.is_active ? "yes" : "no"}</td>
                  <td>
                    <button
                      className="btn btn-outline"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await api.toggleUserActive(u.email);
                          await reload();
                          setFound(prev => prev.map(item => item.id === u.id ? {...item, is_active: !item.is_active} : item));
                        } catch (err) {
                          setError(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {u.is_active ? "Выключить" : "Включить"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="topbar">
          <h3 style={{ margin: 0 }}>Все пользователи</h3>
          <button 
            className="btn btn-outline" 
            onClick={() => downloadData(users, "all_users")}
            disabled={users.length === 0}
          >
            Скачать всех ({users.length})
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>ФИО</th>
              <th>Роль</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  {u.last_name} {u.first_name} {u.middle_name}
                  <div className="muted">{formatDate(u.date_of_birth)}</div>
                </td>
                <td>{u.role}</td>
                <td>{u.is_active ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}