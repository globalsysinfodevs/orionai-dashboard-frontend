import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { TenantProvider } from "@/contexts/TenantContext";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardOverviewPage } from "@/pages/DashboardOverviewPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { UsersPage } from "@/pages/UsersPage";
import { UserDetailPage } from "@/pages/UserDetailPage";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { ConversationDetailPage } from "@/pages/ConversationDetailPage";
import { TenantsPage } from "@/pages/TenantsPage";
import { TenantDetailPage } from "@/pages/TenantDetailPage";
import { ApiKeysPage } from "@/pages/ApiKeysPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <TenantProvider>
              <AppShell />
            </TenantProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardOverviewPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserDetailPage />} />
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route path="/conversations/:chatbotId" element={<ConversationDetailPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
        <Route path="/api-keys" element={<ApiKeysPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
