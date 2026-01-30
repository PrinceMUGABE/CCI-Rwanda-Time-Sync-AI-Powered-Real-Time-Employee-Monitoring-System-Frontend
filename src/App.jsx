import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Public Pages
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ResetPasswordPage from './components/auth/ResetPassword';
import ProtectedRoute from './components/common/ProtectedRoute';

// Layouts
import AdminLayout from './components/admin/AdminLayout';
import SupervisorLayout from './components/supervisor/SupervisorLayout';
import EmployeeLayout from './components/employee/EmployeeLayout';

// Admin Pages
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/UserManagement';
import AdminProfile from './components/admin/UserProfile';
import AdminReports from './components/admin/ReportPage';
import TaskManagement from './components/admin/Tasks';
import TaskAssignmentManagement from './components/admin/TaskAssignment';
import ShiftChangeRequestManagement from './components/admin/ShiftChangeRequestManagement';
import ManageShifts from './components/admin/ManageShifts';
import RulesManagement from './components/admin/RulesAndRegulations';

// Employee Pages
import EmployeeDashboard from './components/employee/Dashboard';
import UserProfile from './components/employee/UserProfile';
import MyTaskAssignmentManagement from './components/employee/TaskAssignments';
import MyShiftChangeRequestManagement from './components/employee/ShiftChangeRequestManagement';

// Supervisor Pages
import SupervisorDashboard from './components/supervisor/Dashboard';
import SupervisorProfile from './components/supervisor/UserProfile';
import SupervisorTaskManagement from './components/supervisor/Tasks';
import SupervisorShiftChangeRequestManagement from './components/supervisor/ShiftChangeRequestManagement';
import SupervisorReport from './components/supervisor/ReportPage';
import SupervisorTaskAssignments from './components/supervisor/TaskAssignment';
import SupervisorUserManagement from './components/supervisor/UserManagement';

// Rules Button Component
import RulesButton from './components/common/RulesButton';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';

// Custom Toaster Component
const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : toast.type === 'warning'
              ? 'bg-yellow-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper component for public pages that need RulesButton
const PublicPageWrapper = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [showRulesButton, setShowRulesButton] = useState(false);

  useEffect(() => {
    // Only show RulesButton on public pages for non-authenticated users
    // Wait a moment for auth context to initialize
    const timer = setTimeout(() => {
      // Use the auth context to check if user is authenticated
      // Also check localStorage as fallback
      const token = localStorage.getItem('access_token');
      const userDataStr = localStorage.getItem('user');
      
      let hasValidAuth = false;
      
      // Check if token exists and is not expired
      if (token) {
        try {
          // Simple token validation (you might want to add JWT expiration check)
          const userData = userDataStr ? JSON.parse(userDataStr) : null;
          // Check if we have user data and a valid role
          if (userData && userData.role) {
            hasValidAuth = true;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      
      // If user is authenticated via context OR has valid token in localStorage,
      // don't show the rules button
      if (isAuthenticated || hasValidAuth) {
        setShowRulesButton(false);
      } else {
        setShowRulesButton(true);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <>
      {children}
      {showRulesButton && <RulesButton />}
    </>
  );
};

// Layout wrapper for employees and supervisors with RulesButton
const EmployeeLayoutWrapper = () => {
  const { user } = useAuth();
  
  // Check if user is actually an employee (not admin or supervisor)
  const shouldShowRulesButton = user?.role === 'employee';
  
  return (
    <>
      <EmployeeLayout />
      {shouldShowRulesButton && <RulesButton />}
    </>
  );
};

const SupervisorLayoutWrapper = () => {
  const { user } = useAuth();
  
  // Check if user is actually a supervisor (not admin or employee)
  const shouldShowRulesButton = user?.role === 'supervisor';
  
  return (
    <>
      <SupervisorLayout />
      {shouldShowRulesButton && <RulesButton />}
    </>
  );
};

// Main App Component
function App() {
  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in",
      delay: 100,
    });
    AOS.refresh();
  }, []);

  return (
    <div className="bg-white dark:bg-black dark:text-white text-black overflow-x-hidden">
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </div>
  );
}

// Separate component for routes that uses AuthProvider
const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/" element={
          <PublicPageWrapper>
            <LoginPage />
          </PublicPageWrapper>
        } />
        <Route path="/login" element={
          <PublicPageWrapper>
            <LoginPage />
          </PublicPageWrapper>
        } />
        <Route path="/register" element={
          <PublicPageWrapper>
            <RegisterPage />
          </PublicPageWrapper>
        } />
        <Route path="/reset-password" element={
          <PublicPageWrapper>
            <ResetPasswordPage />
          </PublicPageWrapper>
        } />
        <Route path="/help" element={
          <PublicPageWrapper>
            <LandingPage />
          </PublicPageWrapper>
        } />

        {/* ==================== ADMIN ROUTES ==================== */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="shifts" element={<ManageShifts />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="task-assignments" element={<TaskAssignmentManagement />} />
          <Route path="shift-change-requests" element={<ShiftChangeRequestManagement />} />
          <Route path="rules-and-regulations" element={<RulesManagement />} />
        </Route>

        {/* ==================== SUPERVISOR ROUTES ==================== */}
        <Route path="/supervisor/*" element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <SupervisorLayoutWrapper />
          </ProtectedRoute>
        }>
          <Route index element={<SupervisorDashboard />} />
          <Route path="dashboard" element={<SupervisorDashboard />} />
          <Route path="profile" element={<SupervisorProfile />} />
          <Route path="tasks" element={<SupervisorTaskManagement />} />
          <Route path="shift-change-requests" element={<SupervisorShiftChangeRequestManagement />} />
          <Route path="reports" element={<SupervisorReport />} />
          <Route path="task-assignments" element={<SupervisorTaskAssignments />} />
          <Route path="employees" element={<SupervisorUserManagement />} />
        </Route>

        {/* ==================== EMPLOYEE ROUTES ==================== */}
        <Route path="/employee/*" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeLayoutWrapper />
          </ProtectedRoute>
        }>
          <Route index element={<EmployeeDashboard />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="my-tasks" element={<EmployeeDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="task-assignments" element={<MyTaskAssignmentManagement />} />
          <Route path="shift-change-requests" element={<MyShiftChangeRequestManagement />} />
        </Route>
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster />
    </>
  );
};

export default App;