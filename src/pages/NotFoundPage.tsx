import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="login-body">
      <div className="card login-card">
        <h1 style={{ textAlign: "center" }}>404</h1>
        <p className="muted" style={{ textAlign: "center" }}>
          Страница не найдена
        </p>
        <Link className="btn btn-primary" style={{ width: "100%", textAlign: "center" }} to="/tasks">
          На главную
        </Link>
      </div>
    </div>
  );
}

