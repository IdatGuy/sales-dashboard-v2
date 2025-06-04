import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PriceSheetPage from './pages/PriceSheetPage';
import DocumentsPage from './pages/DocumentsPage';

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
  const { isAuthenticated } = useAuth();
  
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
        path="/documents" 
        element={
          <ProtectedRoute>
            <DashboardProvider>
              <DocumentsPage />
            </DashboardProvider>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;