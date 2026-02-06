import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../endpoints/auth/session_GET.schema";
import { postLogout } from "../endpoints/auth/logout_POST.schema";
import { postSwitchOrganization } from "../endpoints/orgs/switch_POST.schema";
import { SessionContext } from "./User";

export const AUTH_QUERY_KEY = ["auth", "session"] as const;

type AuthState =
  | { type: "loading" }
  | { type: "authenticated"; context: SessionContext }
  | { type: "mfa_required" }
  | { type: "unauthenticated"; errorMessage?: string };

type AuthContextType = {
  authState: AuthState;
  onLogin: (context: SessionContext) => void;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const data = await getSession();
      return data;
    },
    retry: 1,
    staleTime: Infinity,
  });

  const switchOrgMutation = useMutation({
    mutationFn: (organizationId: number) => postSwitchOrganization({ organizationId }),
    onSuccess: (result) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, result);
    },
  });

  const authState: AuthState = useMemo(() => {
    if (sessionQuery.status === "pending") {
      return { type: "loading" };
    }

    if (sessionQuery.status === "error") {
      const message = sessionQuery.error instanceof Error ? sessionQuery.error.message : "Not authenticated";
      if (message.toLowerCase().includes("mfa required")) {
        return { type: "mfa_required" };
      }
      return { type: "unauthenticated", errorMessage: message };
    }

    if (!sessionQuery.data?.user) {
      return { type: "unauthenticated" };
    }

    return {
      type: "authenticated",
      context: sessionQuery.data,
    };
  }, [sessionQuery.data, sessionQuery.error, sessionQuery.status]);

  const onLogin = useCallback(
    (context: SessionContext) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, context);
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    await postLogout();
    queryClient.resetQueries();
  }, [queryClient]);

  const switchOrganization = useCallback(
    async (organizationId: number) => {
      await switchOrgMutation.mutateAsync(organizationId);
    },
    [switchOrgMutation]
  );

  return (
    <AuthContext.Provider value={{ authState, onLogin, logout, switchOrganization }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
