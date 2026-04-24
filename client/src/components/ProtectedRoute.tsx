import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: string;
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}
