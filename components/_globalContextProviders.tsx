import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../helpers/useAuth";
import { ThemeModeProvider } from "../helpers/themeMode";
import { AppModeProvider } from "../helpers/useAppMode";
import { WorkspaceProvider } from "../helpers/WorkspaceContext";
import { AIChatStateProvider } from "../helpers/useAIChatState";
import { TooltipProvider } from "./Tooltip";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";
import { AIChatPanel } from "./AIChatPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute "fresh" window
    },
  },
});

/**
 * TellDoug Global Context Providers
 * 
 * Provider hierarchy (outer to inner):
 * 1. QueryClientProvider - TanStack Query state
 * 2. AuthProvider - Authentication state & session (from Helm)
 * 3. ThemeModeProvider - Dark/light theme
 * 4. WorkspaceProvider - Multi-tenant workspace context (from Helm)
 * 5. AppModeProvider - Edit/Review/Publish modes (from Helm)
 * 6. AIChatStateProvider - AI chat panel state (from CMOS)
 * 7. TooltipProvider - Tooltip context
 */
export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeModeProvider>
          <WorkspaceProvider>
            <AppModeProvider>
              <AIChatStateProvider>
                <ScrollToHashElement />
                <TooltipProvider>
                  {children}
                  <SonnerToaster />
                  <AIChatPanel />
                </TooltipProvider>
              </AIChatStateProvider>
            </AppModeProvider>
          </WorkspaceProvider>
        </ThemeModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
