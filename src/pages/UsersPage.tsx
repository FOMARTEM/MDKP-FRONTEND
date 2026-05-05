import { useEffect, useMemo, useState } from "react";
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

export default function UsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

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

  const [search, setSearch] = useState({ email: "", role: "", last_name: "", first_name: "" });
  const [found, setFound] = useState<User[]>([]);

  const roleOptions = useMemo(() => roles.map((r) => r.title), [roles]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, u] = await Promise.all([api.roles(), api.users()]);
      setRoles(r);
      setUsers(u);
      if (!form.role && r.length) setForm((f) => ({ ...f, role: r[0].title }));
      if (!search.role && r.length) setSearch((s) => ({ ...s, role: "" }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const validate = () => {
    const next: FieldErrors<Fields> = {};
    if (!required(form.last_name)) next.last_name = "Обязательное поле";
    if (!required(form.first_name)) next.first_name = "Обязательное поле";
    if (!required(form.email) || !isEmail(form.email)) next.email = "Введите корректный email";
    if (!required(form.password) || !minMax(form.password, 8, 16)) next.password = "Пароль: 8–16 символов";
    if (!required(form.role)) next.role = "Выберите роль";
    if (form.phone && !isPhone(form.phone)) next.phone = "Введите корректный телефон";
    if (form.date_of_birth && !isISODate(form.date_of_birth)) next.date_of_birth = "Дата: YYYY-MM-DD";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <>
      <h1>Управление сотрудниками</h1>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      <div className="card">
        <h3>Регистрация нового пользователя</h3>
        <div className="row-4" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
          <div>
            <label>Фамилия</label>
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            {errors.last_name && <div className="error">{errors.last_name}</div>}
          </div>
          <div>
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>
          <div>
            <label>Роль</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.role && <div className="error">{errors.role}</div>}
          </div>
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={async () => {
              setOk(null);
              setError(null);
              if (!validate()) return;
              setLoading(true);
              try {
                await api.createUser(form);
                setOk("Пользователь создан");
                setForm((f) => ({ ...f, password: "" }));
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
        <div className="row-4" style={{ marginTop: 12 }}>
          <div>
            <label>Имя</label>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            {errors.first_name && <div className="error">{errors.first_name}</div>}
          </div>
          <div>
            <label>Отчество</label>
            <input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
            {errors.middle_name && <div className="error">{errors.middle_name}</div>}
          </div>
          <div>
            <label>Телефон</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <div className="error">{errors.phone}</div>}
          </div>
          <div>
            <label>Дата рождения</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
            {errors.date_of_birth && <div className="error">{errors.date_of_birth}</div>}
          </div>
          <div style={{ gridColumn: "1 / span 4" }}>
            <label>Пароль (8–16 символов)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <div className="error">{errors.password}</div>}
          </div>
        </div>
        {ok && <div className="muted" style={{ marginTop: 10 }}>{ok}</div>}
      </div>

      <div className="card">
        <h3>Изменение прав / поиск</h3>
        <div className="row-4">
          <div>
            <label>Email</label>
            <input value={search.email} onChange={(e) => setSearch({ ...search, email: e.target.value })} />
          </div>
          <div>
            <label>Роль</label>
            <select value={search.role} onChange={(e) => setSearch({ ...search, role: e.target.value })}>
              <option value="">—</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
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
                setFound(data);
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
        {found.length === 0 ? (
          <div className="muted" style={{ marginTop: 12 }}>
            Ничего не найдено
          </div>
        ) : (
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
                        setError(null);
                        try {
                          await api.updateUserRole(u.email, role.id);
                          const data = await api.findUsers({
                            role: search.role || undefined,
                            email: search.email || undefined,
                            last_name: search.last_name || undefined,
                            first_name: search.first_name || undefined
                          });
                          setFound(data);
                        } catch (err) {
                          setError(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
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
                        setError(null);
                        try {
                          await api.toggleUserActive(u.email);
                          const data = await api.findUsers({
                            role: search.role || undefined,
                            email: search.email || undefined,
                            last_name: search.last_name || undefined,
                            first_name: search.first_name || undefined
                          });
                          setFound(data);
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
        <h3>Все пользователи</h3>
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
