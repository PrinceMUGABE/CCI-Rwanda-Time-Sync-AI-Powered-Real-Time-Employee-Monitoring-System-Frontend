import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, RefreshCw, X, Save, Plus, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, Clock, Activity,
  ChevronLeft, ChevronRight, ArrowUpDown, Filter,
  FileText, Calendar, User, BarChart3, TrendingUp,
  ListTodo, CheckSquare, Square, AlertTriangle,
  Eye, MoreVertical, Download, Upload,
  Play, StopCircle, Pause, Users, RotateCcw,
  Zap, Shield, Target, CalendarDays, UserCheck,
  Briefcase, Building, Mail, Phone, MapPin,
  Check, ExternalLink, Calendar as CalendarIcon,
  Clock as ClockIcon, AlertOctagon, Info,
  Loader2, ArrowRight, ArrowLeft, Hash,
  Crown, Star, TrendingDown, EyeOff,
  ShieldCheck, ShieldAlert, ShieldOff
} from 'lucide-react';

const TASK_ASSIGNMENT_URL = 'http://127.0.0.1:8000/task-assignment';

export default function SupervisorTaskAssignmentManagement() {
  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  // Data states - Supervisor can only see assignments for supervised employees
  const [assignments, setAssignments] = useState([]);
  const [supervisedUsers, setSupervisedUsers] = useState([]);
  const [overloads, setOverloads] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);

  // UI states
  const [activeView, setActiveView] = useState('assignments'); // Supervisor only has two views
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Modal states - Supervisor has limited modals
  const [showModifyAssignmentModal, setShowModifyAssignmentModal] = useState(false);
  const [showAssignmentDetailsModal, setShowAssignmentDetailsModal] = useState(false);
  const [showOverloadModal, setShowOverloadModal] = useState(false);

  // Selected items
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedOverload, setSelectedOverload] = useState(null);

  // Form states - Supervisor can only modify assignments and create overloads
  const [modifyAssignmentForm, setModifyAssignmentForm] = useState({
    assignment_id: '',
    new_task_id: '',
    new_start_time: '',
    new_end_time: '',
    reason: ''
  });

  const [overloadForm, setOverloadForm] = useState({
    task_id: '',
    shift_id: '',
    overload_date: new Date().toISOString().split('T')[0],
    additional_employees_needed: 1,
    time_slot_start: '',
    time_slot_end: '',
    reason: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'start_time',
    direction: 'asc'
  });

  // Dashboard stats - Supervisor only sees stats for supervised employees
  const [dashboardStats, setDashboardStats] = useState({
    totalAssignments: 0,
    scheduledAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    missedAssignments: 0,
  });

  // Colors and icons for status badges
  const STATUS_COLORS = {
    scheduled: 'bg-blue-100 text-blue-800 border border-blue-200',
    active: 'bg-green-100 text-green-800 border border-green-200',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    missed: 'bg-red-100 text-red-800 border border-red-200',
    reassigned: 'bg-purple-100 text-purple-800 border border-purple-200'
  };

  const STATUS_ICONS = {
    scheduled: Clock,
    active: Play,
    completed: CheckCircle,
    missed: XCircle,
    reassigned: RotateCcw
  };

  const PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800 border border-gray-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border border-orange-200',
    urgent: 'bg-red-100 text-red-800 border border-red-200'
  };

  // API Service - Supervisor has limited endpoints
  const apiService = {
    assignments: {
      // Supervisor can see assignments for supervised employees
      getSupervisedAssignments: async (date, userId, shiftId, status) => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (userId) params.append('user_id', userId);
        if (shiftId) params.append('shift_id', shiftId);
        if (status) params.append('status', status);

        const response = await fetch(`${TASK_ASSIGNMENT_URL}/all/?${params}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch assignments');
        return response.json();
      },

      // Supervisor can modify assignments
      modifyAssignment: async (assignmentId, modificationData) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/modify/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            assignment_id: assignmentId,
            ...modificationData
          })
        });
        if (!response.ok) throw new Error('Failed to modify assignment');
        return response.json();
      }
    },

    // Supervisor can manage overloads for their supervised shifts
    overloads: {
      getOverloads: async () => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/overloads/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch overloads');
        return response.json();
      },

      createOverload: async (overloadData) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/overloads/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(overloadData)
        });
        if (!response.ok) throw new Error('Failed to create overload');
        return response.json();
      },

      resolveOverload: async (overloadId) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/overloads/${overloadId}/resolve/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to resolve overload');
        return response.json();
      }
    }
  };

  // Load all data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load supervised users first
      await loadSupervisedUsers();
      
      // Load assignments for supervised employees
      await loadSupervisedAssignments(dateFilter);
      
      // Load additional data needed for supervisor
      await loadOverloads();
      await loadShifts();
      await loadTasks();

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load employees supervised by the current supervisor
  const loadSupervisedUsers = async () => {
    try {
      // Fetch supervised employees
      const response = await fetch('http://127.0.0.1:8000/users/supervised/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          setSupervisedUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error loading supervised users:', error);
    }
  };

  const loadSupervisedAssignments = async (date, userId, shiftId, status) => {
    try {
      const response = await apiService.assignments.getSupervisedAssignments(date, userId, shiftId, status);
      if (response.assignments) {
        setAssignments(response.assignments);
        calculateDashboardStats(response.assignments);
      }
    } catch (error) {
      throw error;
    }
  };

  const loadOverloads = async () => {
    try {
      const response = await apiService.overloads.getOverloads();
      if (response.overloads) {
        setOverloads(response.overloads);
      }
    } catch (error) {
      console.error('Error loading overloads:', error);
    }
  };

  const loadShifts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/shift/shifts/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          setShifts(data.results);
        } else if (Array.isArray(data)) {
          setShifts(data);
        }
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/task/all/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setTasks(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const calculateDashboardStats = (assignmentsData) => {
    const total = assignmentsData.length;
    const scheduled = assignmentsData.filter(a => a.status === 'scheduled').length;
    const active = assignmentsData.filter(a => a.status === 'active').length;
    const completed = assignmentsData.filter(a => a.status === 'completed').length;
    const missed = assignmentsData.filter(a => a.status === 'missed').length;

    setDashboardStats({
      totalAssignments: total,
      scheduledAssignments: scheduled,
      activeAssignments: active,
      completedAssignments: completed,
      missedAssignments: missed
    });
  };

  // Filter assignments for supervised employees
  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.task_name?.toLowerCase().includes(term) ||
        assignment.user_name?.toLowerCase().includes(term) ||
        assignment.shift_name?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // User filter (only show supervised employees)
    if (userFilter) {
      filtered = filtered.filter(assignment => assignment.user.toString() === userFilter);
    }

    // Shift filter
    if (shiftFilter) {
      filtered = filtered.filter(assignment => assignment.shift.toString() === shiftFilter);
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

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
  }, [assignments, searchTerm, statusFilter, userFilter, shiftFilter, sortConfig]);

  // Pagination
  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAssignments.slice(startIndex, endIndex);
  }, [filteredAssignments, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAssignments.length / rowsPerPage);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentDetailsModal(true);
  };

  const handleModifyAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setModifyAssignmentForm({
      assignment_id: assignment.id,
      new_task_id: assignment.task,
      new_start_time: assignment.start_time ? assignment.start_time.slice(0, 16) : '',
      new_end_time: assignment.end_time ? assignment.end_time.slice(0, 16) : '',
      reason: ''
    });
    setShowModifyAssignmentModal(true);
  };

  const handleCreateOverload = () => {
    setOverloadForm({
      task_id: '',
      shift_id: '',
      overload_date: new Date().toISOString().split('T')[0],
      additional_employees_needed: 1,
      time_slot_start: '',
      time_slot_end: '',
      reason: ''
    });
    setShowOverloadModal(true);
  };

  const handleResolveOverload = async (overload) => {
    try {
      setSubmitting(true);
      const response = await apiService.overloads.resolveOverload(overload.id);

      if (response.message) {
        setSuccessMessage('Task overload resolved successfully');
        loadOverloads();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error resolving overload:', error);
      setError('Failed to resolve overload');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModifyAssignmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const modificationData = {};
      if (modifyAssignmentForm.new_task_id) modificationData.new_task_id = modifyAssignmentForm.new_task_id;
      if (modifyAssignmentForm.new_start_time) modificationData.new_start_time = modifyAssignmentForm.new_start_time;
      if (modifyAssignmentForm.new_end_time) modificationData.new_end_time = modifyAssignmentForm.new_end_time;
      if (modifyAssignmentForm.reason) modificationData.reason = modifyAssignmentForm.reason;

      const response = await apiService.assignments.modifyAssignment(
        modifyAssignmentForm.assignment_id,
        modificationData
      );

      if (response.message) {
        setSuccessMessage('Assignment modified successfully');
        setShowModifyAssignmentModal(false);
        setSelectedAssignment(null);
        setModifyAssignmentForm({
          assignment_id: '',
          new_task_id: '',
          new_start_time: '',
          new_end_time: '',
          reason: ''
        });

        // Reload assignments
        await loadSupervisedAssignments(dateFilter);

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error modifying assignment:', error);
      setError(error.message || 'Failed to modify assignment');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverloadFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = await apiService.overloads.createOverload(overloadForm);

      if (response.overload) {
        setSuccessMessage('Task overload created successfully');
        setShowOverloadModal(false);
        setOverloadForm({
          task_id: '',
          shift_id: '',
          overload_date: new Date().toISOString().split('T')[0],
          additional_employees_needed: 1,
          time_slot_start: '',
          time_slot_end: '',
          reason: ''
        });

        loadOverloads();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating overload:', error);
      setError(error.message || 'Failed to create overload');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      await loadSupervisedAssignments(dateFilter);
      await loadOverloads();

      setSuccessMessage('Data refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Date change handler
  const handleDateChange = async (newDate) => {
    setDateFilter(newDate);

    try {
      setLoading(true);
      await loadSupervisedAssignments(newDate);
    } catch (error) {
      console.error('Error loading assignments for date:', error);
      setError('Failed to load assignments for selected date');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Components
  const StatCard = ({ title, value, icon: Icon, color, description }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
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
    const Icon = STATUS_ICONS[status] || AlertCircle;
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colorClass}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const colorClass = PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Main render
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Supervisor Task Management</h1>
            <p className="mt-1 text-gray-600">
              Manage task assignments and workload distribution for your team
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Supervisor
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-600">{currentUser.names}</span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-600">
                Supervising {supervisedUsers.length} employee(s)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow transition-all"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>

            {/* Supervisor specific buttons */}
            <button
              onClick={handleCreateOverload}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-md hover:shadow-lg transition-all"
            >
              <Zap className="mr-2 h-4 w-4" />
              Report Overload
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* View Tabs - Supervisor only has two views */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveView('assignments')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeView === 'assignments'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Users className="inline mr-2 h-4 w-4" />
            Team Assignments
          </button>

          <button
            onClick={() => setActiveView('overloads')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeView === 'overloads'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Zap className="inline mr-2 h-4 w-4" />
            Task Overloads
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      {activeView === 'assignments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Assignments"
            value={dashboardStats.totalAssignments}
            icon={ListTodo}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            title="Scheduled"
            value={dashboardStats.scheduledAssignments}
            icon={Clock}
            color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          />
          <StatCard
            title="Active"
            value={dashboardStats.activeAssignments}
            icon={Activity}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Completed"
            value={dashboardStats.completedAssignments}
            icon={CheckCircle}
            color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          />
        </div>
      )}

      {/* Date Selector */}
      <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activeView === 'assignments' ? 'Team Assignments' : 'Task Overloads'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeView === 'assignments' ? 'Task assignments for your supervised employees' : 'Task overload situations requiring attention'}
            </p>
          </div>

          {activeView === 'assignments' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters for Assignments View */}
        {activeView === 'assignments' && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search assignments by task name, employee, or shift..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                  <option value="reassigned">Reassigned</option>
                </select>

                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                >
                  <option value="">All Employees</option>
                  {supervisedUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.emp_number} - {user.names}
                    </option>
                  ))}
                </select>

                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                >
                  <option value="">All Shifts</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4">
          {/* Assignments Table */}
          {activeView === 'assignments' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Team Task Assignments</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {Math.min(filteredAssignments.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('user_name')}>
                          Employee
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('task_name')}>
                          Task
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
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('priority')}>
                          Priority
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('start_time')}>
                          Scheduled Time
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No assignments found. Try adjusting your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedAssignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{assignment.user_name}</div>
                                <div className="text-xs text-gray-500">{assignment.user_emp_number}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{assignment.task_name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {assignment.task_description?.substring(0, 80)}...
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={assignment.status} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <PriorityBadge priority={assignment.priority} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <div>{new Date(assignment.start_time).toLocaleTimeString()}</div>
                            <div className="text-xs text-gray-500">
                              to {new Date(assignment.end_time).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleViewAssignment(assignment)}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Supervisor can modify assignments */}
                              <button
                                onClick={() => handleModifyAssignment(assignment)}
                                className="p-1.5 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                                title="Modify Assignment"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
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
          )}

          {/* Overloads Table */}
          {activeView === 'overloads' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Task Overloads</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track and manage task overload situations for your team
                  </p>
                </div>
                <button
                  onClick={handleCreateOverload}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-md hover:shadow-lg transition-all"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Report Overload
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Additional Staff Needed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {overloads.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <Zap className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No task overloads reported. Everything is running smoothly!</p>
                        </td>
                      </tr>
                    ) : (
                      overloads.map((overload) => (
                        <tr key={overload.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{overload.task_name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {overload.shift_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(overload.overload_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              +{overload.additional_employees_needed}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${overload.is_resolved
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                              {overload.is_resolved ? 'Resolved' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {!overload.is_resolved && (
                                <button
                                  onClick={() => handleResolveOverload(overload)}
                                  className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedOverload(overload);
                                  // You can create a view details modal for overloads if needed
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Assignment Details Modal */}
      {showAssignmentDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
                <button
                  onClick={() => setShowAssignmentDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Assignment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedAssignment.task_name}</h4>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedAssignment.status} />
                      <PriorityBadge priority={selectedAssignment.priority} />
                    </div>
                  </div>
                </div>

                {/* Assignment Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description */}
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h5 className="text-sm font-medium text-gray-700">Task Description</h5>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedAssignment.task_description}</p>
                  </div>

                  {/* Employee Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h5 className="text-sm font-medium text-blue-700">Assigned Employee</h5>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-900">{selectedAssignment.user_name}</p>
                      <p className="text-xs text-blue-700">ID: {selectedAssignment.user_emp_number}</p>
                    </div>
                  </div>

                  {/* Shift Information */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ClockIcon className="h-5 w-5 text-green-600" />
                      <h5 className="text-sm font-medium text-green-700">Shift</h5>
                    </div>
                    <p className="text-sm font-semibold text-green-900">{selectedAssignment.shift_name}</p>
                  </div>

                  {/* Scheduled Time */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                      <h5 className="text-sm font-medium text-purple-700">Scheduled Time</h5>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-purple-900">
                        Start: {new Date(selectedAssignment.start_time).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-purple-900">
                        End: {new Date(selectedAssignment.end_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignmentDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAssignmentDetailsModal(false);
                  handleModifyAssignment(selectedAssignment);
                }}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                Modify Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Assignment Modal */}
      {showModifyAssignmentModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Modify Assignment</h3>
                <button
                  onClick={() => setShowModifyAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleModifyAssignmentSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h5 className="text-sm font-medium text-yellow-700">Original Assignment Details</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Task:</span>{' '}
                        <span className="text-gray-900">{selectedAssignment?.task_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Employee:</span>{' '}
                        <span className="text-gray-900">{selectedAssignment?.user_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Original Start:</span>{' '}
                        <span className="text-gray-900">
                          {new Date(selectedAssignment?.start_time).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Original End:</span>{' '}
                        <span className="text-gray-900">
                          {new Date(selectedAssignment?.end_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Task (Optional)
                    </label>
                    <select
                      value={modifyAssignmentForm.new_task_id}
                      onChange={(e) => setModifyAssignmentForm({ ...modifyAssignmentForm, new_task_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    >
                      <option value="">Keep current task</option>
                      {tasks.map(task => (
                        <option key={task.id} value={task.id}>{task.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Start Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={modifyAssignmentForm.new_start_time}
                        onChange={(e) => setModifyAssignmentForm({ ...modifyAssignmentForm, new_start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New End Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={modifyAssignmentForm.new_end_time}
                        onChange={(e) => setModifyAssignmentForm({ ...modifyAssignmentForm, new_end_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Modification (Required)
                    </label>
                    <textarea
                      value={modifyAssignmentForm.reason}
                      onChange={(e) => setModifyAssignmentForm({ ...modifyAssignmentForm, reason: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Explain why this assignment needs modification..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModifyAssignmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Modifying...' : 'Modify Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overload Modal */}
      {showOverloadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Report Task Overload</h3>
                <button
                  onClick={() => setShowOverloadModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleOverloadFormSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task *
                      </label>
                      <select
                        value={overloadForm.task_id}
                        onChange={(e) => setOverloadForm({ ...overloadForm, task_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                      >
                        <option value="">Select a task</option>
                        {tasks.map(task => (
                          <option key={task.id} value={task.id}>{task.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shift *
                      </label>
                      <select
                        value={overloadForm.shift_id}
                        onChange={(e) => setOverloadForm({ ...overloadForm, shift_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                      >
                        <option value="">Select a shift</option>
                        {shifts.map(shift => (
                          <option key={shift.id} value={shift.id}>{shift.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overload Date *
                      </label>
                      <input
                        type="date"
                        value={overloadForm.overload_date}
                        onChange={(e) => setOverloadForm({ ...overloadForm, overload_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Employees Needed *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={overloadForm.additional_employees_needed}
                        onChange={(e) => setOverloadForm({ ...overloadForm, additional_employees_needed: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Slot Start (Optional)
                      </label>
                      <input
                        type="time"
                        value={overloadForm.time_slot_start}
                        onChange={(e) => setOverloadForm({ ...overloadForm, time_slot_start: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Slot End (Optional)
                      </label>
                      <input
                        type="time"
                        value={overloadForm.time_slot_end}
                        onChange={(e) => setOverloadForm({ ...overloadForm, time_slot_end: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Overload *
                    </label>
                    <textarea
                      value={overloadForm.reason}
                      onChange={(e) => setOverloadForm({ ...overloadForm, reason: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Explain why additional staff is needed for this task..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOverloadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Reporting...' : 'Report Overload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}