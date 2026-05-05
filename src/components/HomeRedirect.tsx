import { Navigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { isAdmin } from "../lib/roles";

export default function HomeRedirect() {
  const { user } = useAuth();

  // Если админ — отправляем на страницу активности (логи)
  if (isAdmin(user?.role)) {
    return <Navigate to="/activity" replace />;
  }

  // Всех остальных отправляем на задачи
  return <Navigate to="/tasks" replace />;
}
