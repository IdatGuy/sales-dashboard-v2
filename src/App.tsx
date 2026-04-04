import React from "react";
import { logger } from "./lib/logger";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('ErrorBoundary caught:', error, info);
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Something went wrong.</h1>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import PriceSheetPage from "./pages/PriceSheetPage";
import AdminPage from "./pages/AdminPage";
import InviteUserPage from "./pages/InviteUserPage";
import UsersPage from "./pages/UsersPage";
import SetPasswordPage from "./pages/SetPasswordPage";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse-slow">
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Main app component
const AppContent = () => {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              <DashboardPage />
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              <OrdersPage />
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prices"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              <PriceSheetPage />
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              {currentUser?.role === 'admin' ? <AdminPage /> : <Navigate to="/dashboard" />}
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            {(currentUser?.role === 'manager' || currentUser?.role === 'admin')
              ? <UsersPage />
              : <Navigate to="/dashboard" />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/invite"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              {(currentUser?.role === 'manager' || currentUser?.role === 'admin')
                ? <InviteUserPage />
                : <Navigate to="/dashboard" />}
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
      {/* Invite-only route — redirect already-authenticated users who lack an invite token.
          Use sessionStorage (captured in main.tsx) instead of window.location.hash,
          which Supabase clears before this check runs on re-renders. */}
      <Route
        path="/set-password"
        element={
          isAuthenticated && !sessionStorage.getItem('auth_token_type') ? (
            <Navigate to="/dashboard" />
          ) : (
            <SetPasswordPage />
          )
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
