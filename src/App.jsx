import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Public Pages
import RulesButton from './components/common/RulesButton';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ResetPasswordPage from './components/auth/ResetPassword';
import ProtectedRoute from './components/common/ProtectedRoute';

// Layouts
import AdminLayout from './components/admin/AdminLayout';
import SupervisorLayout from './components/supervisor/SupervisorLayout';


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
import UserProfile from './components/employee/UserProfile';
import MyTaskAssignmentManagement from './components/employee/TaskAssignments';
import MyShiftChangeRequestManagement from './components/employee/ShiftChangeRequestManagement';
import EmployeeDashboard from './components/employee/Dashboard';

// Supervisor Pages
import SupervisorDashboard from './components/supervisor/Dashboard';
import SupervisorProfile from './components/supervisor/UserProfile';
import SupervisorTaskManagement from './components/supervisor/Tasks';
import SupervisorShiftChangeRequestManagement from './components/supervisor/ShiftChangeRequestManagement';
import SupervisorReport from './components/supervisor/ReportPage';
import SupervisorTaskAssignments from './components/supervisor/TaskAssignment';




// Context Providers
import { AuthProvider } from './context/AuthContext';
import EmployeeLayout from './components/employee/EmployeeLayout';
import SupervisorUserManagement from './components/supervisor/UserManagement';

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


// Updated RulesButtonController component
const RulesButtonController = () => {
  const location = useLocation();
  const [showButton, setShowButton] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('access_token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    const isAuthenticated = !!token;
    const currentUserRole = userData.role;
    setUserRole(currentUserRole);

    // Public pages where we want to show the rules button
    const publicPages = ['/', '/login', '/register', '/reset-password'];
    const isPublicPage = publicPages.includes(location.pathname);

    // Show rules button for:
    // 1. Non-authenticated users on public pages
    // 2. Employee users on all pages
    // 3. Supervisor users on all pages
    // 4. NOT for Admin users (they have full interface)
    
    if (!isAuthenticated && isPublicPage) {
      setShowButton(true); // Public users on public pages
    } else if (isAuthenticated && (currentUserRole === 'employee' || currentUserRole === 'supervisor')) {
      setShowButton(true); // Employees and supervisors
    } else {
      setShowButton(false); // Admin users or authenticated users in wrong place
    }

  }, [location.pathname]);

  return showButton ? <RulesButton /> : null;
};

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
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/help" element={<LandingPage />} />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route path="/admin" element={
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
            <Route path="/supervisor" element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorLayout />
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
            <Route path="/employee" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeLayout />
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
          
          {/* Rules Button - Only shown for non-authenticated users on public pages */}
          <RulesButtonController />
          
          <Toaster />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;