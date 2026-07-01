import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import ProductsPage from "@/pages/ProductsPage";
import InvoicesPage from "@/pages/InvoicesPage";
import QuotationsPage from "@/pages/QuotationsPage";
import ChallansPage from "@/pages/ChallansPage";
import PurchaseOrdersPage from "@/pages/PurchaseOrdersPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import BackupsPage from "@/pages/BackupsPage";
import VerifyPage from "@/pages/VerifyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    // Keyed by path so navigating to a different page always clears a
    // previous page's crashed state instead of staying stuck on the fallback.
    return (
      <AppLayout>
        <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>
      </AppLayout>
    );
  };

  // Wait for the persisted session to be restored before resolving any route,
  // otherwise a refresh/deep-link renders while user is still null and bounces
  // the user away from the page they requested (e.g. /invoices/new -> /dashboard).
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/invoices/:action" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
      <Route path="/quotations/:action" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
      <Route path="/challans" element={<ProtectedRoute><ChallansPage /></ProtectedRoute>} />
      <Route path="/challans/:action" element={<ProtectedRoute><ChallansPage /></ProtectedRoute>} />
      <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrdersPage /></ProtectedRoute>} />
      <Route path="/purchase-orders/:action" element={<ProtectedRoute><PurchaseOrdersPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/backups" element={<ProtectedRoute><BackupsPage /></ProtectedRoute>} />
      <Route path="/verify/:type/:docId" element={<VerifyPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
