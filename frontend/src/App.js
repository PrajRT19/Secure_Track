import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import useSocket from './hooks/useSocket';
import useNotifications from './hooks/useNotifications';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import IssueForm from './pages/IssueForm';
import AnalyzePage from './pages/AnalyzePage';
import AnalysisResults from './pages/AnalysisResults';
import HistoryPage from './pages/HistoryPage';
import AiFixPage from './pages/AiFixPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/theme.css';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // Socket connection — only when authenticated
  const socketHook = useSocket(user ? token : null);

  // Notification state — driven by socket + REST
  const notifHook = useNotifications(socketHook, !!user);

  return (
    <div className="st-app-wrapper">
      {user && (
        <Navbar
          notifHook={notifHook}
        />
      )}
      <main className="st-main">{children}</main>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/issues/new" element={<ProtectedRoute><IssueForm /></ProtectedRoute>} />
          <Route path="/issues/:id/edit" element={<ProtectedRoute><IssueForm /></ProtectedRoute>} />
          <Route path="/analyze" element={<ProtectedRoute><AnalyzePage /></ProtectedRoute>} />
          <Route path="/analyze/results" element={<ProtectedRoute><AnalysisResults /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/ai-fix" element={<ProtectedRoute><AiFixPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
