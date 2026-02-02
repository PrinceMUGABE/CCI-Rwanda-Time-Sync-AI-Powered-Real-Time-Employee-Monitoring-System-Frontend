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
  ShieldCheck, ShieldAlert, ShieldOff,
  Send, Ban, UserX
} from 'lucide-react';

//updates added

const REQUEST_BASE_URL = 'http://127.0.0.1:8000/request';

export default function ShiftChangeRequestManagement() {
  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  // Data states
  const [requests, setRequests] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);

  // UI states
  const [activeView, setActiveView] = useState('my-requests');

  // Modal states
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Selected items
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);

  // Form states
  const [createRequestForm, setCreateRequestForm] = useState({
    change_type: 'shift_only',
    reason: '',
    new_shift: '',
    new_day_off: '',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [updateRequestForm, setUpdateRequestForm] = useState({
    reason: '',
    new_shift: '',
    new_day_off: '',
    start_date: ''
  });

  const [cancelForm, setCancelForm] = useState({
    cancellation_reason: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [changeTypeFilter, setChangeTypeFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    cancelledRequests: 0
  });

  // Constants
  const DAY_CHOICES = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
    { value: 'none', label: 'No Day Off' }
  ];

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    accepted: 'bg-green-100 text-green-800 border border-green-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200'
  };

  const STATUS_ICONS = {
    pending: Clock,
    accepted: CheckCircle,
    cancelled: XCircle
  };

  const CHANGE_TYPE_COLORS = {
    shift_only: 'bg-blue-100 text-blue-800 border border-blue-200',
    day_off_only: 'bg-purple-100 text-purple-800 border border-purple-200',
    both: 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  };

  // API Service
  const apiService = {
    requests: {
      getMyRequests: async (status = null) => {
        try {
          console.log('[GET MY REQUESTS] Fetching my requests...');
          const params = new URLSearchParams();
          if (status) params.append('status', status);

          const response = await fetch(`${REQUEST_BASE_URL}/my-requests/?${params}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('[GET MY REQUESTS] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[GET MY REQUESTS] Error Response:', errorData);
            throw new Error(errorData.detail || 'Failed to fetch my requests');
          }

          const data = await response.json();
          console.log('[GET MY REQUESTS] Success! Retrieved data:', data);
          return data;
        } catch (error) {
          console.error('[GET MY REQUESTS] Exception:', error);
          throw error;
        }
      },

      getSupervisedRequests: async (status = null) => {
        try {
          console.log('[GET SUPERVISED REQUESTS] Fetching supervised requests...');
          const params = new URLSearchParams();
          if (status) params.append('status', status);

          const response = await fetch(`${REQUEST_BASE_URL}/supervised/?${params}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('[GET SUPERVISED REQUESTS] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[GET SUPERVISED REQUESTS] Error Response:', errorData);
            throw new Error(errorData.detail || 'Failed to fetch supervised requests');
          }

          const data = await response.json();
          console.log('[GET SUPERVISED REQUESTS] Success! Retrieved data:', data);
          return data;
        } catch (error) {
          console.error('[GET SUPERVISED REQUESTS] Exception:', error);
          throw error;
        }
      },

      getAllRequests: async (status = null) => {
        try {
          console.log('[GET ALL REQUESTS] Fetching all requests...');
          const params = new URLSearchParams();
          if (status) params.append('status', status);

          const response = await fetch(`${REQUEST_BASE_URL}/all/?${params}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('[GET ALL REQUESTS] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[GET ALL REQUESTS] Error Response:', errorData);
            throw new Error(errorData.detail || 'Failed to fetch all requests');
          }

          const data = await response.json();
          console.log('[GET ALL REQUESTS] Success! Retrieved data:', data);
          return data;
        } catch (error) {
          console.error('[GET ALL REQUESTS] Exception:', error);
          throw error;
        }
      },

      getRequestById: async (requestId) => {
        try {
          console.log('[GET REQUEST BY ID] Fetching request...', requestId);
          const response = await fetch(`${REQUEST_BASE_URL}/${requestId}/`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('[GET REQUEST BY ID] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[GET REQUEST BY ID] Error Response:', errorData);
            throw new Error(errorData.detail || 'Failed to fetch request');
          }

          const data = await response.json();
          console.log('[GET REQUEST BY ID] Success! Retrieved data:', data);
          return data;
        } catch (error) {
          console.error('[GET REQUEST BY ID] Exception:', error);
          throw error;
        }
      },

      createRequest: async (requestData) => {
        try {
          console.log('[CREATE REQUEST] Creating new request...');
          console.log('[CREATE REQUEST] Request Data:', requestData);

          const response = await fetch(`${REQUEST_BASE_URL}/create/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
          });

          console.log('[CREATE REQUEST] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[CREATE REQUEST] Error Response:', errorData);
            throw new Error(errorData.detail || errorData.error || 'Failed to create request');
          }

          const data = await response.json();
          console.log('[CREATE REQUEST] Success! Created request:', data);
          return data;
        } catch (error) {
          console.error('[CREATE REQUEST] Exception:', error);
          throw error;
        }
      },

      updateRequest: async (requestId, requestData) => {
        try {
          console.log('[UPDATE REQUEST] Updating request...', requestId);
          console.log('[UPDATE REQUEST] Request Data:', requestData);

          const response = await fetch(`${REQUEST_BASE_URL}/${requestId}/update/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
          });

          console.log('[UPDATE REQUEST] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[UPDATE REQUEST] Error Response:', errorData);
            throw new Error(errorData.detail || errorData.error || 'Failed to update request');
          }

          const data = await response.json();
          console.log('[UPDATE REQUEST] Success! Updated request:', data);
          return data;
        } catch (error) {
          console.error('[UPDATE REQUEST] Exception:', error);
          throw error;
        }
      },

      approveRequest: async (requestId) => {
        try {
          console.log('[APPROVE REQUEST] Approving request...', requestId);

          const response = await fetch(`${REQUEST_BASE_URL}/${requestId}/accept/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('[APPROVE REQUEST] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[APPROVE REQUEST] Error Response:', errorData);
            throw new Error(errorData.detail || errorData.error || 'Failed to approve request');
          }

          const data = await response.json();
          console.log('[APPROVE REQUEST] Success! Approved request:', data);
          return data;
        } catch (error) {
          console.error('[APPROVE REQUEST] Exception:', error);
          throw error;
        }
      },

      cancelRequest: async (requestId, cancellationReason) => {
        try {
          console.log('[CANCEL REQUEST] Cancelling request...', requestId);
          console.log('[CANCEL REQUEST] Reason:', cancellationReason);

          const response = await fetch(`${REQUEST_BASE_URL}/${requestId}/cancel/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ cancellation_reason: cancellationReason })
          });

          console.log('[CANCEL REQUEST] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[CANCEL REQUEST] Error Response:', errorData);
            throw new Error(errorData.detail || errorData.error || 'Failed to cancel request');
          }

          const data = await response.json();
          console.log('[CANCEL REQUEST] Success! Cancelled request:', data);
          return data;
        } catch (error) {
          console.error('[CANCEL REQUEST] Exception:', error);
          throw error;
        }
      },

      deleteRequest: async (requestId) => {
        try {
          console.log('[DELETE REQUEST] Deleting request...', requestId);

          const response = await fetch(`${REQUEST_BASE_URL}/${requestId}/delete/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('[DELETE REQUEST] Response Status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[DELETE REQUEST] Error Response:', errorData);
            throw new Error(errorData.detail || errorData.error || 'Failed to delete request');
          }

          const data = await response.json();
          console.log('[DELETE REQUEST] Success! Deleted request:', data);
          return data;
        } catch (error) {
          console.error('[DELETE REQUEST] Exception:', error);
          throw error;
        }
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

      // Load shifts
      await loadShifts();

      // Load requests based on user role
      if (currentUser.role === 'employee') {
        await loadMyRequests();
      } else if (currentUser.role === 'supervisor') {
        await loadSupervisedRequests();
      } else if (currentUser.role === 'admin') {
        await loadAllRequests();
        await loadUsers();
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async (status = null) => {
    try {
      const response = await apiService.requests.getMyRequests(status);
      if (response.requests) {
        setRequests(response.requests);
        calculateDashboardStats(response.requests);
      }
    } catch (error) {
      throw error;
    }
  };

  const loadSupervisedRequests = async (status = null) => {
    try {
      const response = await apiService.requests.getSupervisedRequests(status);
      if (response.requests) {
        setRequests(response.requests);
        calculateDashboardStats(response.requests);
      }
    } catch (error) {
      throw error;
    }
  };

  const loadAllRequests = async (status = null) => {
    try {
      const response = await apiService.requests.getAllRequests(status);
      if (response.requests) {
        setRequests(response.requests);
        calculateDashboardStats(response.requests);
      }
    } catch (error) {
      throw error;
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

  const loadUsers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/users/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const calculateDashboardStats = (requestsData) => {
    const total = requestsData.length;
    const pending = requestsData.filter(r => r.status === 'pending').length;
    const accepted = requestsData.filter(r => r.status === 'accepted').length;
    const cancelled = requestsData.filter(r => r.status === 'cancelled').length;

    setDashboardStats({
      totalRequests: total,
      pendingRequests: pending,
      acceptedRequests: accepted,
      cancelledRequests: cancelled
    });
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.user?.names?.toLowerCase().includes(term) ||
        request.user?.emp_number?.toLowerCase().includes(term) ||
        request.reason?.toLowerCase().includes(term) ||
        request.new_shift?.name?.toLowerCase().includes(term) ||
        request.current_shift?.name?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Change type filter
    if (changeTypeFilter !== 'all') {
      filtered = filtered.filter(request => request.change_type === changeTypeFilter);
    }

    // Employee filter (for admin)
    if (employeeFilter && currentUser.role === 'admin') {
      filtered = filtered.filter(request => request.user?.id.toString() === employeeFilter);
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested values
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
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
  }, [requests, searchTerm, statusFilter, changeTypeFilter, employeeFilter, sortConfig, currentUser.role]);

  // Pagination
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailsModal(true);
  };

  const handleUpdateRequest = (request) => {
    setSelectedRequest(request);
    setUpdateRequestForm({
      reason: request.reason || '',
      new_shift: request.new_shift?.id || '',
      new_day_off: request.new_day_off || '',
      start_date: request.start_date || ''
    });
    setShowUpdateModal(true);
  };

  const handleApproveRequest = (request) => {
    setRequestToApprove(request);
    setShowApproveModal(true);
  };

  const handleCancelRequest = (request) => {
    setRequestToCancel(request);
    setCancelForm({ cancellation_reason: '' });
    setShowCancelModal(true);
  };

  const handleDeleteRequest = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const confirmApproveRequest = async () => {
    if (!requestToApprove) return;

    try {
      setSubmitting(true);
      const response = await apiService.requests.approveRequest(requestToApprove.id);

      if (response.message) {
        setSuccessMessage(response.message);
        setShowApproveModal(false);
        setRequestToApprove(null);

        // Reload requests
        await refreshData();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setError(error.message || 'Failed to approve request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;

    try {
      setSubmitting(true);
      const response = await apiService.requests.cancelRequest(
        requestToCancel.id,
        cancelForm.cancellation_reason
      );

      if (response.message) {
        setSuccessMessage(response.message);
        setShowCancelModal(false);
        setRequestToCancel(null);
        setCancelForm({ cancellation_reason: '' });

        // Reload requests
        await refreshData();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      setError(error.message || 'Failed to cancel request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      setSubmitting(true);
      const response = await apiService.requests.deleteRequest(requestToDelete.id);

      if (response.message) {
        setSuccessMessage(response.message);
        setShowDeleteModal(false);
        setRequestToDelete(null);

        // Reload requests
        await refreshData();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      setError(error.message || 'Failed to delete request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const requestData = {
        change_type: createRequestForm.change_type,
        reason: createRequestForm.reason,
        start_date: createRequestForm.start_date
      };

      // Add optional fields based on change type
      if (createRequestForm.change_type === 'shift_only' || createRequestForm.change_type === 'both') {
        if (createRequestForm.new_shift) {
          requestData.new_shift = parseInt(createRequestForm.new_shift);
        }
      }

      if (createRequestForm.change_type === 'day_off_only' || createRequestForm.change_type === 'both') {
        if (createRequestForm.new_day_off) {
          requestData.new_day_off = createRequestForm.new_day_off;
        }
      }

      const response = await apiService.requests.createRequest(requestData);

      if (response.request) {
        setSuccessMessage(response.message || 'Request created successfully');
        setShowCreateRequestModal(false);
        setCreateRequestForm({
          change_type: 'shift_only',
          reason: '',
          new_shift: '',
          new_day_off: '',
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        // Reload requests
        await refreshData();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      setError(error.message || 'Failed to create request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    setFormErrors({});

    try {
      const requestData = {};
      
      if (updateRequestForm.reason) {
        requestData.reason = updateRequestForm.reason;
      }
      
      if (updateRequestForm.new_shift) {
        requestData.new_shift = parseInt(updateRequestForm.new_shift);
      }
      
      if (updateRequestForm.new_day_off) {
        requestData.new_day_off = updateRequestForm.new_day_off;
      }
      
      if (updateRequestForm.start_date) {
        requestData.start_date = updateRequestForm.start_date;
      }

      const response = await apiService.requests.updateRequest(selectedRequest.id, requestData);

      if (response.request) {
        setSuccessMessage(response.message || 'Request updated successfully');
        setShowUpdateModal(false);
        setSelectedRequest(null);
        setUpdateRequestForm({
          reason: '',
          new_shift: '',
          new_day_off: '',
          start_date: ''
        });

        // Reload requests
        await refreshData();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      setError(error.message || 'Failed to update request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentUser.role === 'employee') {
        await loadMyRequests(statusFilter !== 'all' ? statusFilter : null);
      } else if (currentUser.role === 'supervisor') {
        await loadSupervisedRequests(statusFilter !== 'all' ? statusFilter : null);
      } else if (currentUser.role === 'admin') {
        await loadAllRequests(statusFilter !== 'all' ? statusFilter : null);
      }

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

  const ChangeTypeBadge = ({ changeType }) => {
    const colorClass = CHANGE_TYPE_COLORS[changeType] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const labels = {
      shift_only: 'Shift Only',
      day_off_only: 'Day Off Only',
      both: 'Both'
    };
    const label = labels[changeType] || 'Unknown';

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shift Change Requests</h1>
            <p className="mt-1 text-gray-600">
              Manage shift and day-off change requests
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                currentUser.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {currentUser.role?.charAt(0).toUpperCase() + currentUser.role?.slice(1)}
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-gray-600">{currentUser.names}</span>
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

            {/* Employee can create requests */}
            {currentUser.role !== 'admin' && (
              <button
                onClick={() => {
                  setCreateRequestForm({
                    change_type: 'shift_only',
                    reason: '',
                    new_shift: '',
                    new_day_off: '',
                    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  });
                  setShowCreateRequestModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </button>
            )}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Requests"
          value={dashboardStats.totalRequests}
          icon={FileText}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending"
          value={dashboardStats.pendingRequests}
          icon={Clock}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
        <StatCard
          title="Accepted"
          value={dashboardStats.acceptedRequests}
          icon={CheckCircle}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard
          title="Cancelled"
          value={dashboardStats.cancelledRequests}
          icon={XCircle}
          color="bg-gradient-to-r from-red-500 to-red-600"
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by employee name, employee number, or reason..."
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
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={changeTypeFilter}
                onChange={(e) => setChangeTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Types</option>
                <option value="shift_only">Shift Only</option>
                <option value="day_off_only">Day Off Only</option>
                <option value="both">Both</option>
              </select>

              {currentUser.role === 'admin' && (
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                >
                  <option value="">All Employees</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.emp_number} - {user.names}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentUser.role === 'employee' ? 'My Requests' :
                 currentUser.role === 'supervisor' ? 'Supervised Employee Requests' :
                 'All Requests'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {Math.min(filteredRequests.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('user.names')}>
                        Employee
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('change_type')}>
                        Change Type
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Changes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('status')}>
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('start_date')}>
                        Start Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No shift change requests found. Try adjusting your filters or create a new request.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.user?.names || request?.user_name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{request.user?.emp_number || request?.user_emp_number || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ChangeTypeBadge changeType={request.change_type} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            {(request.change_type === 'shift_only' || request.change_type === 'both') && (
                              <div>
                                <span className="font-medium text-gray-700">Shift:</span>
                                <span className="text-gray-600"> {request.current_shift?.name || request?.current_shift_name || 'None'} → {request.new_shift?.name || request?.new_shift_name}</span>
                              </div>
                            )}
                            {(request.change_type === 'day_off_only' || request.change_type === 'both') && (
                              <div>
                                <span className="font-medium text-gray-700">Day Off:</span>
                                <span className="text-gray-600"> {request.current_day_off || 'None'} → {request.new_day_off}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <div>{new Date(request.start_date).toLocaleDateString()}</div>
                          {request.days_until_effective !== null && request.days_until_effective !== undefined && (
                            <div className="text-xs text-gray-500">
                              {request.days_until_effective > 0 
                                ? `In ${request.days_until_effective} days`
                                : request.days_until_effective === 0
                                ? 'Today'
                                : `${Math.abs(request.days_until_effective)} days ago`}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewRequest(request)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Employee actions - can only modify/cancel their own pending requests */}
                            {currentUser.role === 'employee' && request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateRequest(request)}
                                  className="p-1.5 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                                  title="Update Request"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelRequest(request)}
                                  className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                  title="Cancel Request"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Supervisor/Admin actions */}
                            {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(request)}
                                  className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                  title="Approve Request"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelRequest(request)}
                                  className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                  title="Cancel Request"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Admin can delete non-accepted requests */}
                            {currentUser.role === 'admin' && request.status !== 'accepted' && (
                              <button
                                onClick={() => handleDeleteRequest(request)}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                title="Delete Request"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}

                            {/* Employee can delete their own cancelled/pending requests */}
                            {currentUser.role === 'employee' && (request.status === 'cancelled') && (
                              <button
                                onClick={() => handleDeleteRequest(request)}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                title="Delete Request"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
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

      {/* Modals */}

      {/* Create Request Modal */}
      {showCreateRequestModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create Shift Change Request</h3>
                <button
                  onClick={() => setShowCreateRequestModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would you like to change? *
                    </label>
                    <select
                      value={createRequestForm.change_type}
                      onChange={(e) => setCreateRequestForm({ 
                        ...createRequestForm, 
                        change_type: e.target.value,
                        new_shift: '',
                        new_day_off: ''
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    >
                      <option value="shift_only">Shift Only</option>
                      <option value="day_off_only">Day Off Only</option>
                      <option value="both">Both Shift and Day Off</option>
                    </select>
                  </div>

                  {(createRequestForm.change_type === 'shift_only' || createRequestForm.change_type === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Shift *
                      </label>
                      <select
                        value={createRequestForm.new_shift}
                        onChange={(e) => setCreateRequestForm({ ...createRequestForm, new_shift: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                      >
                        <option value="">Select a shift</option>
                        {shifts.map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_at} - {shift.end_at})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(createRequestForm.change_type === 'day_off_only' || createRequestForm.change_type === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Day Off *
                      </label>
                      <select
                        value={createRequestForm.new_day_off}
                        onChange={(e) => setCreateRequestForm({ ...createRequestForm, new_day_off: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                      >
                        <option value="">Select a day</option>
                        {DAY_CHOICES.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={createRequestForm.start_date}
                      onChange={(e) => setCreateRequestForm({ ...createRequestForm, start_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When should this change take effect?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Change *
                    </label>
                    <textarea
                      value={createRequestForm.reason}
                      onChange={(e) => setCreateRequestForm({ ...createRequestForm, reason: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Please explain why you need this change..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showRequestDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <button
                  onClick={() => setShowRequestDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Request Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={selectedRequest.status} />
                      <ChangeTypeBadge changeType={selectedRequest.change_type} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedRequest.change_type === 'shift_only' ? 'Shift Change Request' :
                       selectedRequest.change_type === 'day_off_only' ? 'Day Off Change Request' :
                       'Shift and Day Off Change Request'}
                    </h4>
                  </div>
                </div>

                {/* Employee Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h5 className="text-sm font-medium text-blue-700">Employee</h5>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900">{selectedRequest.user?.names || selectedRequest?.user_name || 'Unknown'}</p>
                    <p className="text-xs text-blue-700">ID: {selectedRequest.user?.emp_number || selectedRequest?.user_emp_number || 'Unknown'}</p>
                    <p className="text-xs text-blue-700">Email: {selectedRequest.user_details?.email || selectedRequest?.user_email || 'Unknown'}</p>
                  </div>
                </div>

                {/* Change Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedRequest.change_type === 'shift_only' || selectedRequest.change_type === 'both') && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <h5 className="text-sm font-medium text-purple-700">Shift Change</h5>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-purple-600">Current Shift:</p>
                          <p className="text-sm font-semibold text-purple-900">
                            {selectedRequest.current_shift?.name || selectedRequest?.current_shift_name || 'None'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center text-purple-600">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600">New Shift:</p>
                          <p className="text-sm font-semibold text-purple-900">
                            {selectedRequest.new_shift?.name || selectedRequest?.new_shift_name || 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedRequest.change_type === 'day_off_only' || selectedRequest.change_type === 'both') && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-5 w-5 text-green-600" />
                        <h5 className="text-sm font-medium text-green-700">Day Off Change</h5>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-green-600">Current Day Off:</p>
                          <p className="text-sm font-semibold text-green-900">
                            {selectedRequest.current_day_off || 'None'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center text-green-600">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-green-600">New Day Off:</p>
                          <p className="text-sm font-semibold text-green-900">
                            {selectedRequest.new_day_off}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                      <h5 className="text-sm font-medium text-yellow-700">Effective Date</h5>
                    </div>
                    <p className="text-sm font-semibold text-yellow-900">
                      {new Date(selectedRequest.start_date).toLocaleDateString()}
                    </p>
                    {selectedRequest.days_until_effective !== null && (
                      <p className="text-xs text-yellow-700 mt-1">
                        {selectedRequest.days_until_effective > 0 
                          ? `In ${selectedRequest.days_until_effective} days`
                          : selectedRequest.days_until_effective === 0
                          ? 'Today'
                          : `${Math.abs(selectedRequest.days_until_effective)} days ago`}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <h5 className="text-sm font-medium text-gray-700">Created</h5>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedRequest.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(selectedRequest.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h5 className="text-sm font-medium text-gray-700">Reason for Change</h5>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRequest.reason}</p>
                </div>

                {/* Approval/Cancellation Information */}
                {selectedRequest.status === 'accepted' && selectedRequest.approved_by && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h5 className="text-sm font-medium text-green-700">Approval Information</h5>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-green-900">
                        <span className="font-medium">Approved by:</span> {selectedRequest.approved_by?.names}
                      </p>
                      <p className="text-sm text-green-900">
                        <span className="font-medium">Approved on:</span>{' '}
                        {new Date(selectedRequest.approved_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'cancelled' && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h5 className="text-sm font-medium text-red-700">Cancellation Information</h5>
                    </div>
                    <div className="space-y-1">
                      {selectedRequest.cancelled_by && (
                        <p className="text-sm text-red-900">
                          <span className="font-medium">Cancelled by:</span> {selectedRequest.cancelled_by?.names}
                        </p>
                      )}
                      {selectedRequest.cancelled_at && (
                        <p className="text-sm text-red-900">
                          <span className="font-medium">Cancelled on:</span>{' '}
                          {new Date(selectedRequest.cancelled_at).toLocaleString()}
                        </p>
                      )}
                      {selectedRequest.cancellation_reason && (
                        <p className="text-sm text-red-900 mt-2">
                          <span className="font-medium">Reason:</span> {selectedRequest.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowRequestDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Close
              </button>
              
              {/* Employee can update pending requests */}
              {currentUser.role === 'employee' && selectedRequest.status === 'pending' && (
                <button
                  onClick={() => {
                    setShowRequestDetailsModal(false);
                    handleUpdateRequest(selectedRequest);
                  }}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 shadow-md hover:shadow-lg transition-all"
                >
                  Update Request
                </button>
              )}

              {/* Supervisor/Admin can approve pending requests */}
              {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && selectedRequest.status === 'pending' && (
                <button
                  onClick={() => {
                    setShowRequestDetailsModal(false);
                    handleApproveRequest(selectedRequest);
                  }}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all"
                >
                  Approve Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Request Modal */}
      {showUpdateModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Update Request</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateRequestSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h5 className="text-sm font-medium text-yellow-700">Current Request</h5>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Type:</span> {selectedRequest.change_type}</p>
                      <p><span className="font-medium">Status:</span> {selectedRequest.status}</p>
                    </div>
                  </div>

                  {(selectedRequest.change_type === 'shift_only' || selectedRequest.change_type === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Shift
                      </label>
                      <select
                        value={updateRequestForm.new_shift}
                        onChange={(e) => setUpdateRequestForm({ ...updateRequestForm, new_shift: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="">Keep current selection ({selectedRequest?.new_shift_name})</option>
                        {shifts.map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_at} - {shift.end_at})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedRequest.change_type === 'day_off_only' || selectedRequest.change_type === 'both') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Day Off
                      </label>
                      <select
                        value={updateRequestForm.new_day_off}
                        onChange={(e) => setUpdateRequestForm({ ...updateRequestForm, new_day_off: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="">Keep current selection ({selectedRequest.new_day_off})</option>
                        {DAY_CHOICES.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={updateRequestForm.start_date}
                      onChange={(e) => setUpdateRequestForm({ ...updateRequestForm, start_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {new Date(selectedRequest.start_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Change
                    </label>
                    <textarea
                      value={updateRequestForm.reason}
                      onChange={(e) => setUpdateRequestForm({ ...updateRequestForm, reason: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Leave blank to keep current reason..."
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Updating...' : 'Update Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Request Modal */}
      {showApproveModal && requestToApprove && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Approve Request</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to approve this request from{' '}
                    <strong>{requestToApprove.user?.names}</strong>?
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                    <p className="text-xs font-medium text-blue-800 mb-2">Request Details:</p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <p><span className="font-medium">Type:</span> {requestToApprove.change_type}</p>
                      {requestToApprove.new_shift && (
                        <p><span className="font-medium">New Shift:</span> {requestToApprove.new_shift.name}</p>
                      )}
                      {requestToApprove.new_day_off && (
                        <p><span className="font-medium">New Day Off:</span> {requestToApprove.new_day_off}</p>
                      )}
                      <p><span className="font-medium">Effective:</span> {new Date(requestToApprove.start_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    This will update the employee's shift and/or day off immediately.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmApproveRequest}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Approving...' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelModal && requestToCancel && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Cancel Request</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to cancel this request?
                  </p>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Cancellation Reason (Optional)
                    </label>
                    <textarea
                      value={cancelForm.cancellation_reason}
                      onChange={(e) => setCancelForm({ cancellation_reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Explain why you're cancelling this request..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Go Back
              </button>
              <button
                onClick={confirmCancelRequest}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Modal */}
      {showDeleteModal && requestToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Delete Request</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to permanently delete this request?
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
                onClick={confirmDeleteRequest}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Deleting...' : 'Delete Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}