import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, X, Save, Plus, Edit, Trash2, 
  CheckCircle, XCircle, AlertCircle, Clock, Activity,
  ChevronLeft, ChevronRight, ArrowUpDown, Filter,
  FileText, Calendar, User, BarChart3, TrendingUp,
  ListTodo, CheckSquare, Square, AlertTriangle,
  Eye, MoreVertical, Download, Upload
} from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000/task';

export default function TaskManagement() {
  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token') || '');
  
  // Data states
  const [tasks, setTasks] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Selected items
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    status: 'pending'
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    activeTasks: 0,
    notActiveTasks: 0
  });

  // Colors for status badges
  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    active: 'bg-green-100 text-green-800 border border-green-200',
    'not-active': 'bg-red-100 text-red-800 border border-red-200'
  };

  const STATUS_ICONS = {
    pending: Clock,
    active: CheckCircle,
    'not-active': XCircle
  };

  // API Service
  const apiService = {
    tasks: {
      getAllTasks: async () => {
        const response = await fetch(`${BASE_URL}/all/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
      },
      
      getTaskById: async (taskId) => {
        const response = await fetch(`${BASE_URL}/${taskId}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch task');
        return response.json();
      },
      
      createTask: async (taskData) => {
        const response = await fetch(`${BASE_URL}/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return response.json();
      },
      
      updateTask: async (taskId, taskData) => {
        const response = await fetch(`${BASE_URL}/update/${taskId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
      },
      
      deleteTask: async (taskId) => {
        const response = await fetch(`${BASE_URL}/delete/${taskId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.json();
      }
    }
  };

  // Load all data on mount
  useEffect(() => {
    loadAllTasks();
  }, []);

  const loadAllTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.tasks.getAllTasks();
      
      if (response.success && response.data) {
        setTasks(response.data);
        calculateDashboardStats(response.data);
      }
      
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (tasksData) => {
    const total = tasksData.length;
    const pending = tasksData.filter(t => t.status === 'pending').length;
    const active = tasksData.filter(t => t.status === 'active').length;
    const notActive = tasksData.filter(t => t.status === 'not-active').length;
    
    
    setDashboardStats({
      totalTasks: total,
      pendingTasks: pending,
      activeTasks: active,
      notActiveTasks: notActive
    });
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.name?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.created_by_details?.names?.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
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
  }, [tasks, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewTask = (task) => {
    setViewTask(task);
    setShowViewModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskForm({
      name: task.name,
      description: task.description,
      status: task.status
    });
    setShowTaskModal(true);
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const response = await apiService.tasks.deleteTask(taskToDelete.id);
      if (response.success) {
        setSuccessMessage('Task deleted successfully');
        setShowDeleteModal(false);
        setTaskToDelete(null);
        loadAllTasks();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    
    try {
      let response;
      
      if (selectedTask) {
        response = await apiService.tasks.updateTask(selectedTask.id, taskForm);
      } else {
        response = await apiService.tasks.createTask(taskForm);
      }
      
      if (response.success) {
        setSuccessMessage(`Task ${selectedTask ? 'updated' : 'created'} successfully`);
        setShowTaskModal(false);
        setSelectedTask(null);
        setTaskForm({ name: '', description: '', status: 'pending' });
        loadAllTasks();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Components
  const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span>{trend}% of total</span>
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
    const Icon = STATUS_ICONS[status] || AlertCircle;
    const label = status === 'not-active' ? 'Not Active' : 
                  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colorClass}`}>
        <Icon size={12} />
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="mt-1 text-gray-600">
              Create, manage, and track all your tasks efficiently
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllTasks}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow transition-all"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setSelectedTask(null);
                setTaskForm({ name: '', description: '', status: 'pending' });
                setShowTaskModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
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

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Tasks"
          value={dashboardStats.totalTasks}
          icon={ListTodo}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Tasks"
          value={dashboardStats.pendingTasks}
          icon={Clock}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          trend={dashboardStats.totalTasks > 0 ? Math.round((dashboardStats.pendingTasks / dashboardStats.totalTasks) * 100) : 0}
        />
        <StatCard
          title="Active Tasks"
          value={dashboardStats.activeTasks}
          icon={CheckSquare}
          color="bg-gradient-to-r from-green-500 to-green-600"
          trend={dashboardStats.totalTasks > 0 ? Math.round((dashboardStats.activeTasks / dashboardStats.totalTasks) * 100) : 0}
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
                  placeholder="Search tasks by name, description, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="not-active">Not Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="p-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tasks List</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {Math.min(filteredTasks.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('name')}>
                        Task Name
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
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('created_at')}>
                        Created At
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No tasks found. Try adjusting your filters or create a new task.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{task.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={task.status} />
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(task.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewTask(task)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="h-4 w-4" />
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
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            currentPage === pageNum
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

      {/* Task Modal (Create/Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleTaskFormSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Name *
                    </label>
                    <input
                      type="text"
                      value={taskForm.name}
                      onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      minLength={3}
                      placeholder="Enter task name (min 3 characters)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      placeholder="Enter task description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="not-active">Not Active</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving...' : (selectedTask ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {showViewModal && viewTask && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Task Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{viewTask.name}</h4>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={viewTask.status} />
                    </div>
                  </div>
                </div>

                {/* Task Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description */}
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h5 className="text-sm font-medium text-gray-700">Description</h5>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewTask.description}</p>
                  </div>

                  {/* Created By */}
                  {viewTask.created_by_details && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <h5 className="text-sm font-medium text-blue-700">Created By</h5>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-blue-900">{viewTask.created_by_details.names}</p>
                        <p className="text-xs text-blue-700">{viewTask.created_by_details.email}</p>
                        <p className="text-xs text-blue-600">ID: {viewTask.created_by_details.emp_number}</p>
                        <p className="text-xs text-blue-600 capitalize">Role: {viewTask.created_by_details.role}</p>
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <h5 className="text-sm font-medium text-green-700">Created At</h5>
                    </div>
                    <p className="text-sm font-semibold text-green-900">
                      {new Date(viewTask.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {new Date(viewTask.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Updated Date */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <h5 className="text-sm font-medium text-purple-700">Last Updated</h5>
                    </div>
                    <p className="text-sm font-semibold text-purple-900">
                      {new Date(viewTask.updated_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {new Date(viewTask.updated_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Status Display */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-yellow-600" />
                      <h5 className="text-sm font-medium text-yellow-700">Current Status</h5>
                    </div>
                    <p className="text-sm font-semibold text-yellow-900 capitalize">
                      {viewTask.status_display || viewTask.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditTask(viewTask);
                }}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete <strong>{taskToDelete.name}</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This action cannot be undone.
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
                onClick={confirmDeleteTask}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}