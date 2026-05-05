import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth";

export default function ProtectedRoute(props: { children: React.ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{props.children}</>;
}

