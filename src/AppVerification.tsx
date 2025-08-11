import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/store';
import { authService } from './api/apiclient';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import ResendVerification from './pages/ResendVerification';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  // Check auth status on app load
  useEffect(() => {
    // Verify tokens are still valid on app startup
    const hasValidToken = authService.isAuthenticated();
    if (!hasValidToken && isAuthenticated) {
      // Clear invalid auth state
      console.log('🔍 Invalid tokens detected, clearing auth state');
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes with auth redirect */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            } 
          />
          
          {/* Email verification routes (accessible without auth) */}
          <Route 
            path="/verify-email" 
            element={<EmailVerification />} 
          />
          <Route 
            path="/resend-verification" 
            element={<ResendVerification />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect based on auth status */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={authService.isAuthenticated() ? "/dashboard" : "/login"} 
                replace 
              />
            } 
          />
          
          {/* Catch all route */}
          <Route 
            path="*" 
            element={
              <Navigate 
                to={authService.isAuthenticated() ? "/dashboard" : "/login"} 
                replace 
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;