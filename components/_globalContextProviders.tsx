import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./Tooltip";
import { ThemeModeProvider } from "../helpers/themeMode";
import { SonnerToaster } from "./SonnerToaster";
import { AuthProvider } from "../helpers/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export const GlobalContextProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <SonnerToaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
};
