import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SymptomTriagePage from './pages/SymptomTriagePage';
import WandaaChat from './components/WandaaChat';

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/symptoms" element={<SymptomTriagePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <WandaaChat />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
