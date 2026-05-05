import { useEffect, useState } from "react";
import FullscreenLoader from "../components/FullscreenLoader";
import InlineError from "../components/InlineError";
import { api } from "../lib/api";
import { formatDate } from "../lib/date";
import { minMax, required, type FieldErrors } from "../lib/validation";
import { useAuth } from "../state/auth";

type PwdFields = "old" | "next" | "confirm";

export default function AccountPage() {
  const { user, refreshMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdErrors, setPwdErrors] = useState<FieldErrors<PwdFields>>({});
  const [pwdOk, setPwdOk] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    refreshMe().catch(setError).finally(() => setLoading(false));
  }, [refreshMe]);

  const validatePwd = () => {
    const next: FieldErrors<PwdFields> = {};
    if (!required(oldPwd)) next.old = "Введите текущий пароль";
    if (!required(newPwd) || !minMax(newPwd, 8, 16)) next.next = "Новый пароль: 8–16 символов";
    if (newPwd !== confirmPwd) next.confirm = "Пароли не совпадают";
    setPwdErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <>
      <div className="topbar">
        <h1>Профиль</h1>
        {user && (
          <div className="pill">
            {user.email} • {user.role ?? "role?"}
          </div>
        )}
      </div>

      <FullscreenLoader show={loading} />
      <InlineError error={error} />

      {user && (
        <div className="card">
          <div className="row-2">
            <div>
              <label>Фамилия</label>
              <div className="static-field">{user.last_name ?? ""}</div>
            </div>
            <div>
              <label>Имя</label>
              <div className="static-field">{user.first_name ?? ""}</div>
            </div>
            <div>
              <label>Отчество</label>
              <div className="static-field">{user.middle_name ?? ""}</div>
            </div>
            <div>
              <label>Телефон</label>
              <div className="static-field">{user.phone ?? ""}</div>
            </div>
            <div>
              <label>Дата рождения</label>
              <div className="static-field">{formatDate(user.date_of_birth)}</div>
            </div>
            <div>
              <label>ID</label>
              <div className="static-field">{String(user.id ?? "")}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Смена пароля</h3>
        <div className="row-3">
          <div>
            <label>Текущий пароль</label>
            <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
            {pwdErrors.old && <div className="error">{pwdErrors.old}</div>}
          </div>
          <div>
            <label>Новый пароль</label>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            {pwdErrors.next && <div className="error">{pwdErrors.next}</div>}
          </div>
          <div>
            <label>Подтверждение</label>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
            {pwdErrors.confirm && <div className="error">{pwdErrors.confirm}</div>}
          </div>
        </div>
        <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={async () => {
              setPwdOk(null);
              setError(null);
              if (!validatePwd()) return;
              setLoading(true);
              try {
                await api.changePassword(oldPwd, newPwd, confirmPwd);
                setOldPwd("");
                setNewPwd("");
                setConfirmPwd("");
                setPwdOk("Пароль обновлён");
              } catch (err) {
                setError(err);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Обновить пароль
          </button>
          {pwdOk && <span className="muted">{pwdOk}</span>}
        </div>
      </div>
    </>
  );
}
