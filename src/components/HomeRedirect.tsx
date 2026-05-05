import { Navigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { isAdmin } from "../lib/roles";

export default function HomeRedirect() {
  const { user } = useAuth();
  if (isAdmin(user?.role)) return <Navigate to="/users" replace />;
  return <Navigate to="/tasks" replace />;
}

