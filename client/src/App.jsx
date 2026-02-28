import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TestListPage from './pages/TestListPage';
import TestTakingPage from './pages/TestTakingPage';
import ResultPage from './pages/ResultPage';
import ProgressPage from './pages/ProgressPage';
import StudyMaterialPage from './pages/StudyMaterialPage';
import AIMentorPage from './pages/AIMentorPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminTestsPage from './pages/AdminTestsPage';
import AdminResultsPage from './pages/AdminResultsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PremiumPage from './pages/PremiumPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner" style={{ height: '100vh' }}><div className="spinner"></div></div>;
  }

  const defaultRoute = isAdmin ? '/admin' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultRoute} /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={defaultRoute} /> : <RegisterPage />} />
      
      {/* User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/tests" element={
        <ProtectedRoute><AppLayout><TestListPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/test/:testId" element={
        <ProtectedRoute><AppLayout><TestTakingPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/results/:attemptId" element={
        <ProtectedRoute><AppLayout><ResultPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute><AppLayout><ProgressPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/study" element={
        <ProtectedRoute><AppLayout><StudyMaterialPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/ai-mentor" element={
        <ProtectedRoute><AppLayout><AIMentorPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute><AppLayout><LeaderboardPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/premium" element={
        <ProtectedRoute><AppLayout><PremiumPage /></AppLayout></ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AppLayout><AdminDashboardPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin/tests" element={
        <ProtectedRoute adminOnly><AppLayout><AdminTestsPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin/questions" element={
        <ProtectedRoute adminOnly><AppLayout><AdminQuestionsPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin/results" element={
        <ProtectedRoute adminOnly><AppLayout><AdminResultsPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly><AppLayout><AdminUsersPage /></AppLayout></ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} />} />
    </Routes>
  );
}
