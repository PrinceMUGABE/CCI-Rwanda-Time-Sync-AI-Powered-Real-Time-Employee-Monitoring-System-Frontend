// components/admin/EnhancedUserManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, Download, ChevronDown, UserPlus,
  Edit, Trash2, Users, Eye, Mail, Phone, Calendar,
  Award, ArrowUpDown, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, UserCheck, UserX, RefreshCw,
  X, Save, User, Lock, Briefcase, Shield, FileText,
  Clock, BarChart3, TrendingUp, TrendingDown, AlertCircle,
  Activity, Target, Check, Plus, Minus, Star,
  UserCog, ShieldCheck, UserMinus, UserPlus as UserAdd,
  AlertTriangle, Info, Calendar as CalendarIcon,
  Clock as ClockIcon, BarChart2, MoreVertical,
  ExternalLink, FileBarChart, UserCheck as UserVerified,
  Image, Key, Coffee, PlayCircle, StopCircle, List,
  Settings, Loader, CheckSquare, XSquare
} from 'lucide-react';
import { FaMars, FaVenus, FaTransgender } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = 'http://127.0.0.1:8000';

export default function SupervisorUserManagement() {
  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token') || '');

  // Data states
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('users');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showSupervisionModal, setShowSupervisionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  // Selected items
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [detailedUserData, setDetailedUserData] = useState(null);
  const [userBreaks, setUserBreaks] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [userLogs, setUserLogs] = useState([]);

  const [userPerformance, setUserPerformance] = useState({
    weekly: null,
    allTime: null,
    dashboard: null
  });

  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [selectedPerformanceTab, setSelectedPerformanceTab] = useState('summary');
  const [performanceWeekOffset, setPerformanceWeekOffset] = useState(0);

  // Form states
  const [userForm, setUserForm] = useState({
    emp_number: '',
    names: '',
    email: '',
    phone_number: '',
    role: 'employee',
    status: 'active',
    salary: '',
    day_off: 'none',
    current_shift: '',
    supervisors: [],
    gender: 'prefer_not_to_say',
    send_credentials: true
  });

  const [passwordResetForm, setPasswordResetForm] = useState({
    userId: null,
    sendEmail: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0,
    adminCount: 0,
    supervisorCount: 0,
    employeeCount: 0,
    maleCount: 0,
    femaleCount: 0,
    otherGenderCount: 0
  });

  // Colors for status badges
  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-red-100 text-red-800 border border-red-200',
    suspended: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    scheduled: 'bg-blue-100 text-blue-800 border border-blue-200',
    started: 'bg-purple-100 text-purple-800 border border-purple-200',
    completed: 'bg-green-100 text-green-800 border border-green-200',
    missed: 'bg-red-100 text-red-800 border border-red-200',
    extended: 'bg-orange-100 text-orange-800 border border-orange-200',
    on_time: 'bg-green-100 text-green-800 border border-green-200',
    late: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    early: 'bg-blue-100 text-blue-800 border border-blue-200',
    very_late: 'bg-red-100 text-red-800 border border-red-200'
  };

  // Gender configuration
  const GENDER_CONFIG = {
    male: {
      label: 'Male',
      icon: FaMars,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    female: {
      label: 'Female',
      icon: FaVenus,
      color: 'text-pink-600 bg-pink-50 border-pink-200'
    },
    other: {
      label: 'Other',
      icon: FaTransgender,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    prefer_not_to_say: {
      label: 'Prefer not to say',
      icon: User,
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    }
  };

  // API Service
  const apiService = {
    users: {
      getUsers: async () => {
        const response = await fetch(`${BASE_URL}/users/supervised/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data;
      },

      getUser: async (userId) => {
        const response = await fetch(`${BASE_URL}/users/${userId}/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      },

      createUser: async (userData) => {
        const response = await fetch(`${BASE_URL}/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(userData)
        });
        return response.json();
      },

      updateUser: async (userId, userData) => {
        const response = await fetch(`${BASE_URL}/users/${userId}/update/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(userData)
        });
        return response.json();
      },

      deleteUser: async (userId) => {
        const response = await fetch(`${BASE_URL}/users/${userId}/delete/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      },

      assignSupervisors: async (userId, supervisorIds) => {
        const response = await fetch(`${BASE_URL}/users/${userId}/assign-supervisors/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ supervisor_ids: supervisorIds })
        });
        return response.json();
      },

      resetPassword: async (userId) => {
        const response = await fetch(`${BASE_URL}/users/${userId}/reset-password/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({})
        });
        return response.json();
      }
    },

    performance: {
      getUserPerformance: async (userId) => {
        const response = await fetch(`${BASE_URL}/performance/user/${userId}/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      },

      getUserWeeklyPerformance: async (userId, weekOffset = 0) => {
        const params = new URLSearchParams({ week: weekOffset });
        const response = await fetch(`${BASE_URL}/report/employee/performance/weekly/?${params}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      },

      getUserAllTimePerformance: async (userId) => {
        const response = await fetch(`${BASE_URL}/report/employee/performance/all-time/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      },

      getUserDashboard: async (userId) => {
        const response = await fetch(`${BASE_URL}/report/employee/dashboard/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      }
    },

    breaks: {
      getUserBreaks: async (userId) => {
        const response = await fetch(`${BASE_URL}/performance/breaks/user/${userId}/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      }
    },

    tasks: {
      getUserTasks: async (userId) => {
        const response = await fetch(`${BASE_URL}/task-assignment/all/?user_id=${userId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      }
    },

    shifts: {
      getShifts: async () => {
        const response = await fetch(`${BASE_URL}/shift/shifts/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.json();
      }
    }
  };

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users
      const usersResponse = await apiService.users.getUsers();
      if (usersResponse.users) {
        const usersData = usersResponse.users;
        setUsers(usersData);
        calculateDashboardStats(usersData);

        const supervisorsList = usersData.filter(u => u.role === 'supervisor');
        setSupervisors(supervisorsList);
      }

      // Load shifts
      const shiftsResponse = await apiService.shifts.getShifts();
      if (shiftsResponse.results || shiftsResponse.shifts) {
        setShifts(shiftsResponse.results || shiftsResponse.shifts || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');
      toast.error('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (usersData) => {
    const stats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(u => u.status === 'active').length,
      inactiveUsers: usersData.filter(u => u.status === 'inactive').length,
      suspendedUsers: usersData.filter(u => u.status === 'suspended').length,
      adminCount: usersData.filter(u => u.role === 'admin').length,
      supervisorCount: usersData.filter(u => u.role === 'supervisor').length,
      employeeCount: usersData.filter(u => u.role === 'employee').length,
      maleCount: usersData.filter(u => u.gender === 'male' || u.gender === 'Male').length,
      femaleCount: usersData.filter(u => u.gender === 'female' || u.gender === 'Female').length,
      otherGenderCount: usersData.filter(u =>
        ['other', 'Other', 'prefer_not_to_say', 'Prefer not to say'].includes(u.gender)
      ).length
    };

    setDashboardStats(stats);
  };

  // Load detailed user data for specific date (today by default)
  const loadDetailedUserData = async (user, selectedDate = new Date().toISOString().split('T')[0]) => {
    try {
      setLoading(true);
      setPerformanceLoading(true);

      // Load user details
      const userDetails = await apiService.users.getUser(user.id);

      // Load performance data in parallel
      const [weeklyPerf, allTimePerf, dashboard, breaksData, tasksData] = await Promise.all([
        apiService.performance.getUserWeeklyPerformance(user.id, performanceWeekOffset),
        apiService.performance.getUserAllTimePerformance(user.id),
        apiService.performance.getUserDashboard(),
        apiService.breaks.getUserBreaks(user.id),
        apiService.tasks.getUserTasks(user.id)
      ]);

      // Filter breaks for today
      const todayBreaks = (breaksData.breaks || []).filter(breakItem => {
        const breakDate = new Date(breakItem.scheduled_start).toISOString().split('T')[0];
        return breakDate === selectedDate;
      });

      // Filter tasks for today
      const todayTasks = (tasksData.assignments || []).filter(task => {
        const taskDate = new Date(task.start_time).toISOString().split('T')[0];
        return taskDate === selectedDate;
      });

      // Get logs from weekly performance
      const todayLogs = weeklyPerf.summary?.daily_performance
        ?.find(day => new Date(day.date).toISOString().split('T')[0] === selectedDate)
        ?.logs || [];

      setDetailedUserData({
        ...userDetails.user,
        performance: weeklyPerf,
        allTimePerformance: allTimePerf,
        dashboard: dashboard,
        breaks: todayBreaks,
        tasks: todayTasks,
        logs: todayLogs,
        selectedDate: selectedDate
      });

      setUserPerformance({
        weekly: weeklyPerf,
        allTime: allTimePerf,
        dashboard: dashboard
      });

      setUserBreaks(todayBreaks);
      setUserTasks(todayTasks);
      setUserLogs(todayLogs);

      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading detailed user data:', error);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
      setPerformanceLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.names?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.emp_number?.toLowerCase().includes(term) ||
        user.phone_number?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (genderFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userGender = user.gender?.toLowerCase();
        if (genderFilter === 'male') return userGender === 'male' || userGender === 'm';
        if (genderFilter === 'female') return userGender === 'female' || userGender === 'f';
        if (genderFilter === 'other') return ['other', 'o'].includes(userGender);
        return true;
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'current_shift') {
          aValue = a.current_shift?.name || '';
          bValue = b.current_shift?.name || '';
        }

        if (sortConfig.key === 'gender') {
          const genderOrder = { 'male': 1, 'female': 2, 'other': 3, 'prefer_not_to_say': 4 };
          aValue = genderOrder[a.gender?.toLowerCase()] || 5;
          bValue = genderOrder[b.gender?.toLowerCase()] || 5;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewUser = async (user) => {
    try {
      const response = await apiService.users.getUser(user.id);
      if (response.user) {
        const userData = response.user;
        setSelectedUser(userData);

        // Convert gender from backend format to frontend format
        const backendGender = userData.gender?.toLowerCase();
        let frontendGender = 'prefer_not_to_say';

        if (backendGender === 'male' || backendGender === 'm') {
          frontendGender = 'male';
        } else if (backendGender === 'female' || backendGender === 'f') {
          frontendGender = 'female';
        } else if (backendGender === 'other') {
          frontendGender = 'other';
        } else if (backendGender === 'prefer_not_to_say') {
          frontendGender = 'prefer_not_to_say';
        }

        // Extract shift ID
        let shiftId = '';
        if (userData.current_shift) {
          if (typeof userData.current_shift === 'object' && userData.current_shift.id) {
            shiftId = userData.current_shift.id;
          } else if (typeof userData.current_shift === 'number') {
            shiftId = userData.current_shift;
          } else if (typeof userData.current_shift === 'string') {
            shiftId = userData.current_shift;
          }
        }

        // Extract supervisor IDs
        const supervisorIds = userData.supervisors?.map(s => s.id) || [];

        setUserForm({
          emp_number: userData.emp_number,
          names: userData.names,
          email: userData.email,
          phone_number: userData.phone_number,
          role: userData.role,
          status: userData.status,
          salary: userData.salary,
          day_off: userData.day_off || 'none',
          current_shift: shiftId,
          supervisors: supervisorIds,
          gender: frontendGender,
          send_credentials: false
        });

        // Clear form errors
        setFormErrors({});
        setFormErrorMessage('');

        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const handlePasswordReset = (user) => {
    setPasswordResetForm({
      userId: user.id,
      sendEmail: true
    });
    setSelectedUser(user);
    setShowPasswordResetModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await apiService.users.deleteUser(userToDelete.id);
      if (response.message) {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadAllData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const confirmPasswordReset = async () => {
    if (!passwordResetForm.userId) return;

    try {
      setSubmitting(true);
      const response = await apiService.users.resetPassword(passwordResetForm.userId);

      if (response.message) {
        toast.success('Password reset successfully. User has been notified via email.');
        setShowPasswordResetModal(false);
        setPasswordResetForm({ userId: null, sendEmail: true });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const validateUserForm = () => {
    const errors = {};

    if (!userForm.emp_number) errors.emp_number = 'Employee number is required';
    if (!userForm.names) errors.names = 'Name is required';
    if (!userForm.email) errors.email = 'Email is required';
    if (!userForm.phone_number) errors.phone_number = 'Phone number is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userForm.email && !emailRegex.test(userForm.email)) {
      errors.email = 'Invalid email format';
    }

    // Role-specific validations
    if (userForm.role === 'employee' && userForm.supervisors.length === 0) {
      errors.supervisors = 'At least one supervisor is required for employees';
    }

    // Salary validation
    if (userForm.salary && parseFloat(userForm.salary) < 0) {
      errors.salary = 'Salary cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) {
      return;
    }

    setSubmitting(true);
    setFormErrorMessage('');
    setFormErrors({});

    try {
      const userData = {
        emp_number: userForm.emp_number,
        names: userForm.names,
        email: userForm.email,
        phone_number: userForm.phone_number,
        role: userForm.role,
        status: userForm.status,
        salary: userForm.salary,
        day_off: userForm.day_off,
        current_shift: userForm.current_shift,
        supervisor_ids: userForm.supervisors,
        gender: userForm.gender,
        send_credentials: userForm.send_credentials
      };

      let response;
      if (selectedUser) {
        response = await apiService.users.updateUser(selectedUser.id, userData);
      } else {
        response = await apiService.users.createUser(userData);
      }

      if (response.message || response.user) {
        toast.success(`User ${selectedUser ? 'updated' : 'created'} successfully`);
        setShowUserModal(false);
        resetUserForm();
        loadAllData();
      } else if (response.error || response.errors) {
        // Handle backend validation errors
        const errorMsg = response.error ||
          Object.values(response.errors || {}).join(', ');
        setFormErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setFormErrorMessage('Failed to save user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      emp_number: '',
      names: '',
      email: '',
      phone_number: '',
      role: 'employee',
      status: 'active',
      salary: '',
      day_off: 'none',
      current_shift: '',
      supervisors: [],
      gender: 'prefer_not_to_say',
      send_credentials: true
    });
    setSelectedUser(null);
    setFormErrors({});
    setFormErrorMessage('');
  };

  const handleAddNewUser = () => {
    resetUserForm();
    setShowUserModal(true);
  };

  const handleSupervisorSelection = (supervisorId) => {
    setUserForm(prev => {
      const isSelected = prev.supervisors.includes(supervisorId);
      const updatedSupervisors = isSelected
        ? prev.supervisors.filter(id => id !== supervisorId)
        : [...prev.supervisors, supervisorId];

      // Clear supervisor error if at least one is selected
      if (updatedSupervisors.length > 0) {
        const newErrors = { ...formErrors };
        delete newErrors.supervisors;
        setFormErrors(newErrors);
      }

      return { ...prev, supervisors: updatedSupervisors };
    });
  };

  // Custom components
  const StatCard = ({ title, value, icon: Icon, trend, color }) => {
    const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
    const trendIcon = trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : null;

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend !== undefined && trend !== 0 && (
              <div className={`flex items-center mt-2 text-sm ${trendColor}`}>
                {trendIcon}
                <span className="ml-1 font-medium">{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'Unknown';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const RoleBadge = ({ role }) => {
    const config = {
      admin: { color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white', icon: ShieldCheck },
      supervisor: { color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', icon: UserCog },
      employee: { color: 'bg-gradient-to-r from-green-500 to-green-600 text-white', icon: User }
    };

    const { color, icon: Icon } = config[role] || { color: 'bg-gray-100 text-gray-800', icon: User };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${color}`}>
        <Icon size={12} />
        {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown'}
      </span>
    );
  };

  const GenderBadge = ({ gender }) => {
    if (!gender || gender === '' || gender === 'null' || gender === 'undefined') {
      const config = GENDER_CONFIG['prefer_not_to_say'];
      const Icon = config.icon;
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${config.color}`}>
          <Icon size={12} />
          {config.label}
        </span>
      );
    }

    const normalizedGender = String(gender).toLowerCase().trim();
    const genderMap = {
      'male': 'male',
      'female': 'female',
      'other': 'other',
      'prefer_not_to_say': 'prefer_not_to_say',
      'male (m)': 'male',
      'female (f)': 'female',
      'other (o)': 'other',
      'prefer not to say': 'prefer_not_to_say',
      'm': 'male',
      'f': 'female',
      'o': 'other',
      'man': 'male',
      'woman': 'female',
      'non-binary': 'other',
      'not specified': 'prefer_not_to_say',
      'n/a': 'prefer_not_to_say',
    };

    const genderKey = genderMap[normalizedGender];

    if (!genderKey) {
      const config = GENDER_CONFIG['prefer_not_to_say'];
      const Icon = config.icon;
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border bg-orange-50 text-orange-800 border-orange-200`}>
          <AlertCircle size={12} />
          Unknown: {String(gender)}
        </span>
      );
    }

    const config = GENDER_CONFIG[genderKey];
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const UserAvatar = ({ user, size = "md" }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-16 w-16 text-xl",
      xl: "h-24 w-24 text-3xl"
    };

    if (user.profile_picture) {
      return (
        <img
          src={`data:image/jpeg;base64,${user.profile_picture}`}
          alt={user.names}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-sm border-2 border-white`}
        />
      );
    }

    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm`}>
        {user.names?.charAt(0) || 'U'}
      </div>
    );
  };

  const calculatePerformanceMetrics = (performanceData) => {
    if (!performanceData?.summary) return null;

    const summary = performanceData.summary;
    return {
      weeklyScore: summary.overall_score || 0,
      weeklyRating: summary.performance_rating || 'N/A',
      attendanceRate: summary.attendance_rate || 0,
      breakCompletion: summary.break_completion_rate || 0,
      taskCompletion: summary.task_completion_rate || 0,
      punctuality: summary.overall_punctuality || 0,
      avgHoursPerDay: summary.average_hours_per_day || 0,
      totalHours: summary.total_hours_worked || 0,
      daysPresent: summary.days_present || 0,
      daysAbsent: summary.days_absent || 0,
      dailyPerformance: summary.daily_performance || []
    };
  };

  const calculateAllTimeMetrics = (allTimeData) => {
    if (!allTimeData?.summary) return null;

    const summary = allTimeData.summary;
    return {
      overallScore: summary.overall_performance_score || 0,
      overallRating: summary.performance_rating || 'N/A',
      attendanceRate: summary.overall_attendance_rate || 0,
      breakCompletion: summary.overall_break_completion_rate || 0,
      taskCompletion: summary.overall_task_completion_rate || 0,
      breakPunctuality: summary.break_punctuality_score || 0,
      loginPunctuality: summary.login_punctuality_rate || 0,
      totalDays: summary.total_days_employed || 0,
      presentDays: summary.total_present_days || 0,
      totalBreaks: summary.total_breaks_assigned || 0,
      completedBreaks: summary.total_breaks_completed || 0,
      totalTasks: summary.total_tasks_assigned || 0,
      completedTasks: summary.total_tasks_completed || 0,
      totalLogins: summary.total_logins || 0,
      onTimeLogins: summary.on_time_logins || 0
    };
  };


  const PerformanceBadge = ({ rating, score }) => {
    const getBadgeConfig = (rating) => {
      switch (rating?.toLowerCase()) {
        case 'excellent':
          return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Award };
        case 'good':
          return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp };
        case 'average':
          return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: BarChart2 };
        case 'needs improvement':
          return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle };
        case 'poor':
          return { color: 'bg-red-100 text-red-800 border-red-200', icon: TrendingDown };
        default:
          return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: BarChart3 };
      }
    };

    const { color, icon: Icon } = getBadgeConfig(rating);

    return (
      <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" />
        <div>
          <div className="font-semibold">{rating}</div>
          {score && <div className="text-xs opacity-80">Score: {score}/100</div>}
        </div>
      </div>
    );
  };

  // Main render
  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-gray-600">
              Comprehensive employee management and monitoring system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow transition-all"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleAddNewUser}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers}
          icon={Users}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Users"
          value={dashboardStats.activeUsers}
          icon={UserCheck}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard
          title="Male"
          value={dashboardStats.maleCount}
          icon={FaMars}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Female"
          value={dashboardStats.femaleCount}
          icon={FaVenus}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="employee">Employee</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Users Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Users List</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {Math.min(filteredUsers.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </p>
              </div>

              {/* Scrollable Table Container */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('emp_number')}>
                          ID
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        User Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('gender')}>
                          Gender
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('role')}>
                          Role
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('status')}>
                          Status
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Shift
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky right-0 bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                          <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No users found. Try adjusting your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {user.emp_number}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} size="sm" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.names}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.email}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {user.phone_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <GenderBadge gender={user.gender} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <span className="bg-blue-50 px-2 py-1 rounded text-xs">
                              {user?.current_shift_name || 'Not assigned'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">
                            {user.salary ? `${parseInt(user.salary).toLocaleString()} frw` : '0 frw'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap sticky right-0 bg-white">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => loadDetailedUserData(user)}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                title="View Full Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {/* <button
                                onClick={() => handleViewUser(user)}
                                className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </button> */}
                              {/* <button
                                onClick={() => handlePasswordReset(user)}
                                className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </button> */}
                              {/* <button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded text-sm font-medium ${currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* DETAILED USER MODAL - Comprehensive Employee Information */}
      {showDetailModal && detailedUserData && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full my-8">
            {/* Modal Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setPerformanceLoading(true);
                  try {
                    const [weeklyPerf, allTimePerf] = await Promise.all([
                      apiService.performance.getUserWeeklyPerformance(detailedUserData.id, performanceWeekOffset),
                      apiService.performance.getUserAllTimePerformance(detailedUserData.id)
                    ]);
                    setUserPerformance({ weekly: weeklyPerf, allTime: allTimePerf });
                    toast.success('Performance data refreshed');
                  } catch (error) {
                    toast.error('Failed to refresh performance data');
                  } finally {
                    setPerformanceLoading(false);
                  }
                }}
                disabled={performanceLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${performanceLoading ? 'animate-spin' : ''}`} />
                Refresh Performance
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Date Selector */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Viewing Data For:</h3>
                    <input
                      type="date"
                      value={detailedUserData.selectedDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        loadDetailedUserData(detailedUserData, newDate);
                      }}
                      className="ml-2 px-3 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(detailedUserData.selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Contact Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Email</p>
                      <p className="text-sm text-blue-900">{detailedUserData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Phone</p>
                      <p className="text-sm text-blue-900">{detailedUserData.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Status</p>
                      <StatusBadge status={detailedUserData.status} />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Gender</p>
                      <GenderBadge gender={detailedUserData.gender} />
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Work Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Current Shift</p>
                      <p className="text-sm text-green-900">{detailedUserData.current_shift_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Day Off</p>
                      <p className="text-sm text-green-900">{detailedUserData.day_off || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Salary</p>
                      <p className="text-sm text-green-900 font-semibold">
                        {detailedUserData.salary ? `${parseInt(detailedUserData.salary).toLocaleString()} frw` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Role</p>
                      <RoleBadge role={detailedUserData.role} />
                    </div>
                  </div>
                </div>

                {/* Supervision */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Supervision
                  </h3>
                  <div className="space-y-2">
                    {detailedUserData.supervisors && detailedUserData.supervisors.length > 0 ? (
                      detailedUserData.supervisors.map((supervisor) => (
                        <div key={supervisor.id} className="flex items-center gap-2 bg-white p-2 rounded">
                          <UserAvatar user={supervisor} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-purple-900">{supervisor.names}</p>
                            <p className="text-xs text-purple-600">{supervisor.emp_number}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-purple-600">No supervisors assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Logs Summary */}
              {userLogs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Today's Activity Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Total Logs</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {userLogs.length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">On Time</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {userLogs.filter(log => log.status === 'on_time').length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <p className="text-xs text-yellow-600 font-medium">Late</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">
                        {userLogs.filter(log => log.status === 'late').length}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-xs text-red-600 font-medium">Very Late</p>
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        {userLogs.filter(log => log.status === 'very_late').length}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Early</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {userLogs.filter(log => log.status === 'early').length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <p className="text-xs text-purple-600 font-medium">Day Off</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {userLogs.filter(log => log.status === 'day_off').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs for Additional Information */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex overflow-x-auto">
                    {[
                      {
                        id: 'performance',
                        label: "Performance",
                        icon: BarChart3,
                        badge: userPerformance.weekly?.summary?.performance_rating
                      },
                      {
                        id: 'breaks',
                        label: "Today's Breaks",
                        icon: Coffee,
                        count: userBreaks.length
                      },
                      {
                        id: 'tasks',
                        label: "Today's Tasks",
                        icon: List,
                        count: userTasks.length
                      },
                      {
                        id: 'logs',
                        label: "Activity Logs",
                        icon: FileText,
                        count: userLogs.length
                      },
                      {
                        id: 'analytics',
                        label: "Analytics",
                        icon: TrendingUp,
                        badge: "Stats"
                      }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <tab.icon className="h-4 w-4" />
                          {tab.label}
                          {tab.count !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                              {tab.count}
                            </span>
                          )}
                          {tab.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                              {tab.badge}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                  {/* Performance Tab */}
                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      {performanceLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="h-8 w-8 animate-spin text-blue-600" />
                          <span className="ml-2 text-gray-600">Loading performance data...</span>
                        </div>
                      ) : userPerformance.weekly ? (
                        <>
                          {/* Performance Week Selector */}
                          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                Week: {userPerformance.weekly.summary?.week_start_date
                                  ? `${new Date(userPerformance.weekly.summary.week_start_date).toLocaleDateString()} - ${new Date(userPerformance.weekly.summary.week_end_date).toLocaleDateString()}`
                                  : 'Current Week'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  const newOffset = performanceWeekOffset - 1;
                                  setPerformanceWeekOffset(newOffset);
                                  const newPerf = await apiService.performance.getUserWeeklyPerformance(detailedUserData.id, newOffset);
                                  setUserPerformance(prev => ({ ...prev, weekly: newPerf }));
                                }}
                                className="p-1 hover:bg-blue-100 rounded"
                              >
                                <ChevronLeft className="h-4 w-4 text-blue-600" />
                              </button>
                              <button
                                onClick={async () => {
                                  const newOffset = performanceWeekOffset + 1;
                                  setPerformanceWeekOffset(newOffset);
                                  const newPerf = await apiService.performance.getUserWeeklyPerformance(detailedUserData.id, newOffset);
                                  setUserPerformance(prev => ({ ...prev, weekly: newPerf }));
                                }}
                                className="p-1 hover:bg-blue-100 rounded"
                              >
                                <ChevronRight className="h-4 w-4 text-blue-600" />
                              </button>
                            </div>
                          </div>

                          {/* Performance Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Overall Score</span>
                                    <Target className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="text-3xl font-bold text-gray-900">
                                    {calculatePerformanceMetrics(userPerformance.weekly)?.weeklyScore || 0}
                                    <span className="text-sm text-gray-500">/100</span>
                                  </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Rating</span>
                                    <Award className="h-4 w-4 text-yellow-600" />
                                  </div>
                                  <PerformanceBadge
                                    rating={calculatePerformanceMetrics(userPerformance.weekly)?.weeklyRating}
                                    score={calculatePerformanceMetrics(userPerformance.weekly)?.weeklyScore}
                                  />
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Attendance Rate</span>
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {calculatePerformanceMetrics(userPerformance.weekly)?.attendanceRate || 0}%
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {calculatePerformanceMetrics(userPerformance.weekly)?.daysPresent || 0} days present
                                  </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Task Completion</span>
                                    <CheckSquare className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {calculatePerformanceMetrics(userPerformance.weekly)?.taskCompletion || 0}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* All-time Performance */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">All-time Performance</h4>
                              <div className="space-y-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-blue-700">Overall Score</span>
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="text-2xl font-bold text-blue-900">
                                    {calculateAllTimeMetrics(userPerformance.allTime)?.overallScore || 0}
                                    <span className="text-sm text-blue-700">/100</span>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-green-700">All-time Rating</span>
                                    <Award className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div className="text-lg font-bold text-green-900">
                                    {calculateAllTimeMetrics(userPerformance.allTime)?.overallRating || 'N/A'}
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-purple-700">Break Punctuality</span>
                                    <Clock className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div className="text-xl font-bold text-purple-900">
                                    {calculateAllTimeMetrics(userPerformance.allTime)?.breakPunctuality || 0}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Daily Performance Breakdown */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Day</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Tasks</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Breaks</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Hours</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Score</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {calculatePerformanceMetrics(userPerformance.weekly)?.dailyPerformance?.map((day, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {day.day_of_week}
                                      </td>
                                      <td className="px-4 py-3">
                                        <StatusBadge status={day.attendance_status?.toLowerCase()} />
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900">
                                          {day.tasks?.completion_rate || 0}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ({day.tasks?.completed || 0}/{day.tasks?.scheduled || 0})
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900">
                                          {day.breaks?.completion_rate || 0}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ({day.breaks?.completed || 0}/{day.breaks?.scheduled || 0})
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {day.hours_worked || 0}h
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${(day.punctuality_score || 0) >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                          (day.punctuality_score || 0) >= 70 ? 'bg-blue-100 text-blue-800' :
                                            (day.punctuality_score || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                          }`}>
                                          {day.punctuality_score || 0}/100
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No performance data available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analytics Tab */}
                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      {performanceLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="h-8 w-8 animate-spin text-blue-600" />
                          <span className="ml-2 text-gray-600">Loading analytics...</span>
                        </div>
                      ) : (
                        <>
                          {/* Key Performance Indicators */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="h-5 w-5 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-900">Productivity Score</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-900">
                                  {Math.round(
                                    (calculatePerformanceMetrics(userPerformance.weekly)?.taskCompletion || 0) * 0.6 +
                                    (calculatePerformanceMetrics(userPerformance.weekly)?.breakCompletion || 0) * 0.4
                                  )}%
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-5 w-5 text-green-600" />
                                  <span className="text-sm font-medium text-green-900">Punctuality Score</span>
                                </div>
                                <div className="text-2xl font-bold text-green-900">
                                  {calculatePerformanceMetrics(userPerformance.weekly)?.punctuality || 0}%
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="h-5 w-5 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-900">Engagement</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-900">
                                  {Math.round(
                                    (calculatePerformanceMetrics(userPerformance.weekly)?.attendanceRate || 0) * 0.7 +
                                    (calculatePerformanceMetrics(userPerformance.weekly)?.avgHoursPerDay || 0) * 3
                                  )}%
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Award className="h-5 w-5 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-900">Consistency</span>
                                </div>
                                <div className="text-2xl font-bold text-orange-900">
                                  {Math.round(
                                    ((calculateAllTimeMetrics(userPerformance.allTime)?.presentDays || 0) /
                                      (calculateAllTimeMetrics(userPerformance.allTime)?.totalDays || 1)) * 100
                                  )}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Performance Statistics */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <BarChart2 className="h-4 w-4 text-blue-600" />
                                  Weekly Performance Breakdown
                                </h5>
                                <div className="space-y-3">
                                  {[
                                    { label: 'Task Completion Rate', value: calculatePerformanceMetrics(userPerformance.weekly)?.taskCompletion || 0, color: 'text-blue-600' },
                                    { label: 'Break Completion Rate', value: calculatePerformanceMetrics(userPerformance.weekly)?.breakCompletion || 0, color: 'text-green-600' },
                                    { label: 'Attendance Rate', value: calculatePerformanceMetrics(userPerformance.weekly)?.attendanceRate || 0, color: 'text-purple-600' },
                                    { label: 'Punctuality Score', value: calculatePerformanceMetrics(userPerformance.weekly)?.punctuality || 0, color: 'text-orange-600' },
                                  ].map((metric, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">{metric.label}</span>
                                      <span className={`font-semibold ${metric.color}`}>{metric.value}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  All-time Performance Metrics
                                </h5>
                                <div className="space-y-3">
                                  {[
                                    { label: 'Overall Attendance', value: calculateAllTimeMetrics(userPerformance.allTime)?.attendanceRate || 0 },
                                    { label: 'Task Success Rate', value: calculateAllTimeMetrics(userPerformance.allTime)?.taskCompletion || 0 },
                                    { label: 'Break Success Rate', value: calculateAllTimeMetrics(userPerformance.allTime)?.breakCompletion || 0 },
                                    { label: 'Login Punctuality', value: calculateAllTimeMetrics(userPerformance.allTime)?.loginPunctuality || 0 },
                                  ].map((metric, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">{metric.label}</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                            style={{ width: `${metric.value}%` }}
                                          />
                                        </div>
                                        <span className="font-semibold text-gray-900 text-sm">{metric.value}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Performance Insights */}
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              Performance Insights
                            </h5>
                            <div className="space-y-2">
                              {(() => {
                                const weeklyMetrics = calculatePerformanceMetrics(userPerformance.weekly);
                                const allTimeMetrics = calculateAllTimeMetrics(userPerformance.allTime);
                                const insights = [];

                                if (weeklyMetrics?.attendanceRate < 60) {
                                  insights.push("Attendance rate is below target. Consider reviewing attendance patterns.");
                                }
                                if (weeklyMetrics?.taskCompletion < 50) {
                                  insights.push("Task completion rate is low. Additional support or training may be needed.");
                                }
                                if (weeklyMetrics?.breakCompletion < 40) {
                                  insights.push("Break compliance is low. Ensure scheduled breaks are being taken.");
                                }
                                if (allTimeMetrics?.loginPunctuality < 70) {
                                  insights.push("Login punctuality could be improved. Consider flexible start times.");
                                }
                                if (weeklyMetrics?.punctuality < 60) {
                                  insights.push("General punctuality needs improvement. Review schedule adherence.");
                                }

                                if (insights.length === 0) {
                                  insights.push("Performance metrics are within expected ranges. Good job!");
                                }

                                return insights.map((insight, index) => (
                                  <div key={index} className="flex items-start gap-2 text-sm text-blue-800">
                                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    {insight}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="p-4 max-h-96 overflow-y-auto">
                    {/* Breaks Tab */}
                    {activeTab === 'breaks' && (
                      <div className="space-y-3">
                        {userBreaks.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Coffee className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm">No breaks scheduled for today</p>
                          </div>
                        ) : (
                          userBreaks.map((breakItem) => (
                            <div key={breakItem.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Coffee className="h-4 w-4 text-gray-600" />
                                  <h4 className="font-medium text-gray-900">{breakItem.break_name}</h4>
                                </div>
                                <StatusBadge status={breakItem.status} />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Scheduled</p>
                                  <p className="text-gray-900">
                                    {new Date(breakItem.scheduled_start).toLocaleTimeString()} -
                                    {new Date(breakItem.scheduled_end).toLocaleTimeString()}
                                  </p>
                                </div>
                                {breakItem.actual_start && (
                                  <div>
                                    <p className="text-xs text-gray-500">Actual</p>
                                    <p className="text-gray-900">
                                      {new Date(breakItem.actual_start).toLocaleTimeString()}
                                      {breakItem.actual_end && ` - ${new Date(breakItem.actual_end).toLocaleTimeString()}`}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {/* <div className="mt-2 text-xs text-gray-500">
                                Duration: {breakItem.duration_minutes?.toFixed(0) || '0'} minutes
                              </div> */}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                      <div className="space-y-3">
                        {userTasks.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <List className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm">No tasks assigned for today</p>
                          </div>
                        ) : (
                          userTasks.map((task) => (
                            <div key={task.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <List className="h-4 w-4 text-gray-600" />
                                  <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                                </div>
                                <StatusBadge status={task.status} />
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.task_description}</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Scheduled Start</p>
                                  <p className="text-gray-900">{new Date(task.start_time).toLocaleTimeString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Scheduled End</p>
                                  <p className="text-gray-900">{new Date(task.end_time).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              {task.actual_start_time && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Actual: {new Date(task.actual_start_time).toLocaleTimeString()} -
                                  {task.actual_end_time ? ` ${new Date(task.actual_end_time).toLocaleTimeString()}` : ' Ongoing'}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Activity Logs Tab */}
                    {activeTab === 'logs' && (
                      <div className="space-y-2">
                        {userLogs.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm">No activity logs for today</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Time</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Type</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Activity</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Details</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {userLogs.slice(0, 10).map((log) => (
                                  <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-xs text-gray-900">
                                      {new Date(log.actual_time).toLocaleTimeString()}
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                                        {log.log_type.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <StatusBadge status={log.status} />
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-900">{log.activity}</td>
                                    <td className="px-3 py-2 text-xs text-gray-500">
                                      {log.notes && <div className="truncate max-w-[200px]">{log.notes}</div>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {userLogs.length > 10 && (
                              <div className="mt-2 text-center text-xs text-gray-500">
                                Showing 10 of {userLogs.length} logs
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between">
                <button
                  onClick={() => handlePasswordReset(detailedUserData)}
                  className="inline-flex items-center px-4 py-2 border border-purple-600 rounded-lg text-sm font-medium text-purple-600 bg-white hover:bg-purple-50 shadow-sm"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </button>
                <div className="flex gap-3">
                  {/* <button
                    onClick={() => handleViewUser(detailedUserData)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </button> */}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* USER FORM MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUserFormSubmit}>
              <div className="px-6 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Form Error Message */}
                {formErrorMessage && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{formErrorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Basic Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employee Number *
                      </label>
                      <input
                        type="text"
                        value={userForm.emp_number}
                        onChange={(e) => {
                          setUserForm({ ...userForm, emp_number: e.target.value });
                          if (formErrors.emp_number) {
                            setFormErrors({ ...formErrors, emp_number: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm ${formErrors.emp_number ? 'border-red-500' : 'border-gray-300'
                          }`}
                        required
                        disabled={!!selectedUser}
                      />
                      {formErrors.emp_number && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.emp_number}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={userForm.names}
                        onChange={(e) => {
                          setUserForm({ ...userForm, names: e.target.value });
                          if (formErrors.names) {
                            setFormErrors({ ...formErrors, names: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm ${formErrors.names ? 'border-red-500' : 'border-gray-300'
                          }`}
                        required
                      />
                      {formErrors.names && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.names}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => {
                          setUserForm({ ...userForm, email: e.target.value });
                          if (formErrors.email) {
                            setFormErrors({ ...formErrors, email: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        required
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact and Role */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Contact & Role</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={userForm.phone_number}
                        onChange={(e) => {
                          setUserForm({ ...userForm, phone_number: e.target.value });
                          if (formErrors.phone_number) {
                            setFormErrors({ ...formErrors, phone_number: undefined });
                          }
                        }}
                        placeholder="+250XXXXXXXXX"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm ${formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                          }`}
                        required
                      />
                      {formErrors.phone_number && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.phone_number}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <select
                        value={userForm.gender}
                        onChange={(e) => setUserForm({ ...userForm, gender: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                      </label>
                      <select
                        value={userForm.role}
                        onChange={(e) => {
                          setUserForm({ ...userForm, role: e.target.value });
                          // Clear supervisors if role changes to non-employee
                          if (e.target.value !== 'employee') {
                            setUserForm(prev => ({ ...prev, supervisors: [] }));
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="employee">Employee</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Status and Additional Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Status & Additional Info</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={userForm.status}
                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salary (frw)
                      </label>
                      <input
                        type="number"
                        value={userForm.salary}
                        onChange={(e) => {
                          setUserForm({ ...userForm, salary: e.target.value });
                          if (formErrors.salary) {
                            setFormErrors({ ...formErrors, salary: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm ${formErrors.salary ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {formErrors.salary && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.salary}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Day Off
                      </label>
                      <select
                        value={userForm.day_off}
                        onChange={(e) => setUserForm({ ...userForm, day_off: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="none">No Day Off</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                  </div>

                  {/* Shift Assignment & Supervisors */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Shift Assignment</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Shift
                      </label>
                      <select
                        value={userForm.current_shift}
                        onChange={(e) => setUserForm({ ...userForm, current_shift: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="">Not Assigned</option>
                        {shifts.map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_at} - {shift.end_at})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Supervisors Selection - Only for Employees */}
                    {userForm.role === 'employee' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Supervisors *
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            (Select at least one)
                          </span>
                        </label>
                        <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${formErrors.supervisors ? 'border-red-500' : 'border-gray-300'
                          }`}>
                          {supervisors.length === 0 ? (
                            <p className="text-sm text-gray-500">No supervisors available</p>
                          ) : (
                            <div className="space-y-2">
                              {supervisors.map((supervisor) => (
                                <div key={supervisor.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`supervisor-${supervisor.id}`}
                                    checked={userForm.supervisors.includes(supervisor.id)}
                                    onChange={() => handleSupervisorSelection(supervisor.id)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`supervisor-${supervisor.id}`}
                                    className="ml-3 flex-1"
                                  >
                                    <div className="flex items-center gap-2">
                                      <UserAvatar user={supervisor} size="sm" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {supervisor.names}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {supervisor.emp_number}
                                        </p>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {formErrors.supervisors && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.supervisors}</p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          Selected: {userForm.supervisors.length} supervisor(s)
                        </div>
                      </div>
                    )}

                    {!selectedUser && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="send_credentials"
                          checked={userForm.send_credentials}
                          onChange={(e) => setUserForm({ ...userForm, send_credentials: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="send_credentials" className="text-sm text-gray-700">
                          Send login credentials via email
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin mr-2 h-4 w-4 inline" />
                      Saving...
                    </>
                  ) : (
                    selectedUser ? 'Update User' : 'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-purple-100 rounded-full mb-4">
                <Key className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Reset Password
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Reset password for <strong>{selectedUser.names}</strong>
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">What happens next:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>A new secure password will be generated</li>
                      <li>The user will receive an email with the new password</li>
                      <li>They should change it upon first login</li>
                      <li>The temporary password expires in 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p>The user's current password will be invalidated immediately.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setPasswordResetForm({ userId: null, sendEmail: true });
                }}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPasswordReset}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin mr-2 h-4 w-4" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete <strong>{userToDelete.names}</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Employee ID: {userToDelete.emp_number}
                  </p>
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    This action will deactivate the user account.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}