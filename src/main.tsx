import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/i18n";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const e = error as { status?: number; response?: { status?: number } };
        const status = e?.status ?? e?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              gutter={10}
              toastOptions={{
                duration: 4500,
                className:
                  "!rounded-xl !bg-white !text-ink-900 !shadow-elevated !border !border-ink-100 dark:!bg-ink-900 dark:!text-ink-50 dark:!border-ink-800",
                success: {
                  iconTheme: { primary: "#10b981", secondary: "white" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "white" },
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
