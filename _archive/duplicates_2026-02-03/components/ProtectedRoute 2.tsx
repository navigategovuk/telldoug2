import { ShieldOff } from "lucide-react";
import React from "react";
import { Navigate } from "react-router-dom";

import { AuthErrorPage } from "./AuthErrorPage";
import { AuthLoadingState } from "./AuthLoadingState";
import styles from "./ProtectedRoute.module.css";
import { useAuth } from "../helpers/useAuth";

import type { User } from "../helpers/User";

// Inner component that uses the hook - valid because it's named like a component
function ProtectedRouteInner({ roles, children }: { roles: User["role"][]; children: React.ReactNode }) {
  const { authState } = useAuth();

  // Show loading state while checking authentication
  if (authState.type === "loading") {
    return <AuthLoadingState title="Authenticating" />;
  }

  // Redirect to login if not authenticated
  if (authState.type === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(authState.user.role)) {
    return (
      <AuthErrorPage
        title="Access Denied"
        message={`Access denied. Your role (${authState.user.role}) lacks required permissions.`}
        icon={<ShieldOff className={styles.accessDeniedIcon} size={64} />}
      />
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}

// Do not use this in pageLayout
// Factory function to create role-specific route components
function MakeProtectedRoute(roles: User["role"][]): React.FC<{ children: React.ReactNode }> {
  const RouteComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <ProtectedRouteInner roles={roles}>{children}</ProtectedRouteInner>;
  };
  RouteComponent.displayName = `ProtectedRoute(${roles.join(",")})`;
  return RouteComponent;
}

// Create protected routes here, then import them in pageLayout
export const AdminRoute = MakeProtectedRoute(["admin"]);
export const OwnerRoute = MakeProtectedRoute(["owner", "admin"]);
export const UserRoute = MakeProtectedRoute(["user", "admin"]);

// TellDoug: Also allow "owner" role access to UserRoute for backward compatibility
export const AuthenticatedRoute = MakeProtectedRoute(["user", "admin", "owner"]);
