import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogFood from './pages/LogFood';
import LogActivity from './pages/LogActivity';
import Profile from './pages/Profile';
import History from './pages/History';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/food" element={<ProtectedRoute><Layout><LogFood /></Layout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><Layout><LogActivity /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
