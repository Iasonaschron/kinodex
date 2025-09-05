import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;

  return <Outlet />;
}
