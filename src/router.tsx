import { createBrowserRouter, Navigate } from 'react-router-dom';
import { authService } from './api/apiclient';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import EmailVerification from './pages/EmailVerification';
import ResendVerification from './pages/ResendVerification';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'about',
        element: <About />
      },
      {
        path: 'contact',
        element: <Contact />
      },
      {
        path: 'login',
        element: (
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        )
      },
      {
        path: 'register',
        element: (
          <ProtectedRoute requireAuth={false}>
            <Register />
          </ProtectedRoute>
        )
      },
      {
        path: 'verify-email',
        element: <EmailVerification />
      },
      {
        path: 'resend-verification',
        element: <ResendVerification />
      }
    ]
  },
  // Protected routes outside of Layout for authenticated users
  {
    path: 'dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: 'profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    )
  },
  {
    path: 'settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    )
  },
  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to={authService.isAuthenticated() ? "/dashboard" : "/"} replace />
  }
]);

export default router;