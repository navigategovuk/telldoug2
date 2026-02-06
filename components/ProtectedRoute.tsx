import React from "react";
import { Navigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { AuthLoadingState } from "./AuthLoadingState";
import { AuthErrorPage } from "./AuthErrorPage";

type AllowedRole = "applicant" | "caseworker" | "platform_admin";

const makeProtectedRoute = (allowedRoles: AllowedRole[]) => {
  return function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { authState } = useAuth();

    if (authState.type === "loading") {
      return <AuthLoadingState title="Checking Session" />;
    }

    if (authState.type === "mfa_required") {
      return <Navigate to="/login?mfa=required" replace />;
    }

    if (authState.type === "unauthenticated") {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(authState.context.user.role)) {
      return (
        <AuthErrorPage
          title="Access Denied"
          message="You do not have permission to access this area."
          icon={<ShieldOff size={64} />}
        />
      );
    }

    return <>{children}</>;
  };
};

export const ApplicantRoute = makeProtectedRoute(["applicant"]);
export const CaseworkerRoute = makeProtectedRoute(["caseworker", "platform_admin"]);
export const PlatformAdminRoute = makeProtectedRoute(["platform_admin"]);
