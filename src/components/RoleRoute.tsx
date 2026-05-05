import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/auth";

export default function RoleRoute(props: { allow: (role?: string) => boolean; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!props.allow(user?.role)) return <Navigate to="/tasks" replace />;
  return <>{props.children}</>;
}

