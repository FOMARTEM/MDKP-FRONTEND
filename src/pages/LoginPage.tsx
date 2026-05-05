import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { isEmail, minMax, required, type FieldErrors } from "../lib/validation";
import { useAuth } from "../state/auth";

type Fields = "email" | "password";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/tasks";
  }, [location.state]);

  const validate = (): boolean => {
    const next: FieldErrors<Fields> = {};
    if (!required(email) || !isEmail(email)) next.email = "Введите корректный email";
    if (!required(password)) next.password = "Введите пароль";
    else if (!minMax(password, 8, 16)) next.password = "Пароль: 8–16 символов";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="login-body">
      <div className="card login-card">
        <h1 style={{ textAlign: "center", color: "var(--primary)" }}>Система управления</h1>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setServerError(null);
            if (!validate()) return;
            setLoading(true);
            try {
              await login(email, password);
              navigate(from, { replace: true });
            } catch (err) {
              if (err instanceof ApiError) {
                const msg = typeof err.body === "string" ? err.body : JSON.stringify(err.body);
                setServerError(msg);
              } else {
                const msg = err instanceof Error ? err.message : String(err);
                setServerError(msg.includes("Failed to fetch") ? "Не удалось подключиться к API (проверь CORS и VITE_API_URL)" : msg);
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <div style={{ marginBottom: 15 }}>
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@platform.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <div className="error">{errors.password}</div>}
          </div>

          {serverError && <div className="error" style={{ marginBottom: 12 }}>{serverError}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
