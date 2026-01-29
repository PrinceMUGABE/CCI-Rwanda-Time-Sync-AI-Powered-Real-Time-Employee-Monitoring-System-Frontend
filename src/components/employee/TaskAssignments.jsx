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

export default function TaskAssignmentManagement() {
  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  // Data states
  const [assignments, setAssignments] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [overloads, setOverloads] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // UI states
  const [activeView, setActiveView] = useState('my-assignments');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal states
  const [showCreateAssignmentsModal, setShowCreateAssignmentsModal] = useState(false);
  const [showModifyAssignmentModal, setShowModifyAssignmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignmentDetailsModal, setShowAssignmentDetailsModal] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [showOverloadModal, setShowOverloadModal] = useState(false);
  const [showStartAssignmentModal, setShowStartAssignmentModal] = useState(false);
  const [showCompleteAssignmentModal, setShowCompleteAssignmentModal] = useState(false);
  
  // Selected items
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [selectedRotation, setSelectedRotation] = useState(null);
  const [selectedOverload, setSelectedOverload] = useState(null);
  const [assignmentToStart, setAssignmentToStart] = useState(null);
  const [assignmentToComplete, setAssignmentToComplete] = useState(null);
  
  // Form states
  const [createAssignmentsForm, setCreateAssignmentsForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift_id: ''
  });
  
  const [modifyAssignmentForm, setModifyAssignmentForm] = useState({
    assignment_id: '',
    new_task_id: '',
    new_start_time: '',
    new_end_time: '',
    reason: ''
  });
  
  const [rotationForm, setRotationForm] = useState({
    shift: '',
    tasks: [],
    rotation_interval_minutes: 60,
    allow_multiple_employees_per_task: false
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
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalAssignments: 0,
    scheduledAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    missedAssignments: 0,
    currentAssignment: null,
    nextAssignment: null
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

  // API Service
  const apiService = {
    assignments: {
      getMyAssignments: async (date) => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/my-assignments/?${params}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch assignments');
        return response.json();
      },
      
      getAllAssignments: async (date, userId, shiftId, status) => {
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
        if (!response.ok) throw new Error('Failed to fetch all assignments');
        return response.json();
      },
      
      getCurrentAssignment: async () => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/current/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch current assignment');
        return response.json();
      },
      
      getNextAssignment: async () => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/next/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch next assignment');
        return response.json();
      },
      
      startAssignment: async (assignmentId) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/${assignmentId}/start/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to start assignment');
        return response.json();
      },
      
      completeAssignment: async (assignmentId) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/${assignmentId}/complete/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to complete assignment');
        return response.json();
      },
      
      createDailyAssignments: async (date, shiftId) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/create-daily/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ date, shift_id: shiftId })
        });
        if (!response.ok) throw new Error('Failed to create daily assignments');
        return response.json();
      },
      
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
      },
      
      deleteAssignment: async (assignmentId) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/${assignmentId}/delete/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete assignment');
        return response.json();
      }
    },
    
    rotations: {
      getRotations: async () => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/rotations/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch rotations');
        return response.json();
      },
      
      createRotation: async (rotationData) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/rotations/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(rotationData)
        });
        if (!response.ok) throw new Error('Failed to create rotation');
        return response.json();
      },
      
      updateRotation: async (rotationId, rotationData) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/rotations/${rotationId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(rotationData)
        });
        if (!response.ok) throw new Error('Failed to update rotation');
        return response.json();
      },
      
      deleteRotation: async (rotationId) => {
        const response = await fetch(`${TASK_ASSIGNMENT_URL}/rotations/${rotationId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete rotation');
        return response.json();
      }
    },
    
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
      
      // Load assignments based on user role
      if (currentUser.role === 'employee') {
        await loadMyAssignments(dateFilter);
        await loadCurrentAssignment();
        await loadNextAssignment();
      } else {
        await loadAllAssignments(dateFilter);
      }
      
      // Load additional data for admin/supervisor
      if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
        await loadRotations();
        await loadOverloads();
        await loadShifts();
        await loadUsers();
        await loadTasks();
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyAssignments = async (date) => {
    try {
      const response = await apiService.assignments.getMyAssignments(date);
      if (response.assignments) {
        setAssignments(response.assignments);
        calculateDashboardStats(response.assignments);
      }
    } catch (error) {
      throw error;
    }
  };

  const loadAllAssignments = async (date, userId, shiftId, status) => {
    try {
      const response = await apiService.assignments.getAllAssignments(date, userId, shiftId, status);
      if (response.assignments) {
        setAssignments(response.assignments);
        calculateDashboardStats(response.assignments);
      }
    } catch (error) {
      throw error;
    }
  };

  const loadCurrentAssignment = async () => {
    try {
      const response = await apiService.assignments.getCurrentAssignment();
      if (response.assignment) {
        setDashboardStats(prev => ({ ...prev, currentAssignment: response.assignment }));
      }
    } catch (error) {
      console.error('Error loading current assignment:', error);
    }
  };

  const loadNextAssignment = async () => {
    try {
      const response = await apiService.assignments.getNextAssignment();
      if (response.assignment) {
        setDashboardStats(prev => ({ ...prev, nextAssignment: response.assignment }));
      }
    } catch (error) {
      console.error('Error loading next assignment:', error);
    }
  };

  const loadRotations = async () => {
    try {
      const response = await apiService.rotations.getRotations();
      if (response.rotations) {
        setRotations(response.rotations);
      }
    } catch (error) {
      console.error('Error loading rotations:', error);
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
    
    setDashboardStats(prev => ({
      ...prev,
      totalAssignments: total,
      scheduledAssignments: scheduled,
      activeAssignments: active,
      completedAssignments: completed,
      missedAssignments: missed
    }));
  };

  // Filter assignments
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
    
    // User filter (for admin/supervisor)
    if (userFilter && currentUser.role !== 'employee') {
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
  }, [assignments, searchTerm, statusFilter, userFilter, shiftFilter, sortConfig, currentUser.role]);

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

  const handleDeleteAssignment = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const handleStartAssignment = (assignment) => {
    setAssignmentToStart(assignment);
    setShowStartAssignmentModal(true);
  };

  const handleCompleteAssignment = (assignment) => {
    setAssignmentToComplete(assignment);
    setShowCompleteAssignmentModal(true);
  };

  const handleEditRotation = (rotation) => {
    setSelectedRotation(rotation);
    setRotationForm({
      shift: rotation.shift,
      tasks: rotation.tasks.map(t => t.id),
      rotation_interval_minutes: rotation.rotation_interval_minutes,
      allow_multiple_employees_per_task: rotation.allow_multiple_employees_per_task
    });
    setShowRotationModal(true);
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

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    try {
      const response = await apiService.assignments.deleteAssignment(assignmentToDelete.id);
      if (response.message) {
        setSuccessMessage('Assignment deleted successfully');
        setShowDeleteModal(false);
        setAssignmentToDelete(null);
        
        // Reload assignments
        if (currentUser.role === 'employee') {
          await loadMyAssignments(dateFilter);
        } else {
          await loadAllAssignments(dateFilter);
        }
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment');
      setTimeout(() => setError(null), 3000);
    }
  };

  const confirmStartAssignment = async () => {
    if (!assignmentToStart) return;
    
    try {
      const response = await apiService.assignments.startAssignment(assignmentToStart.id);
      if (response.message) {
        setSuccessMessage('Assignment started successfully');
        setShowStartAssignmentModal(false);
        setAssignmentToStart(null);
        
        // Reload assignments and current assignment
        await loadMyAssignments(dateFilter);
        await loadCurrentAssignment();
        await loadNextAssignment();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error starting assignment:', error);
      setError(error.message || 'Failed to start assignment');
      setTimeout(() => setError(null), 3000);
    }
  };

  const confirmCompleteAssignment = async () => {
    if (!assignmentToComplete) return;
    
    try {
      const response = await apiService.assignments.completeAssignment(assignmentToComplete.id);
      if (response.message) {
        setSuccessMessage('Assignment completed successfully');
        setShowCompleteAssignmentModal(false);
        setAssignmentToComplete(null);
        
        // Reload assignments and current assignment
        await loadMyAssignments(dateFilter);
        await loadCurrentAssignment();
        await loadNextAssignment();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error completing assignment:', error);
      setError(error.message || 'Failed to complete assignment');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreateAssignments = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    
    try {
      const response = await apiService.assignments.createDailyAssignments(
        createAssignmentsForm.date,
        createAssignmentsForm.shift_id
      );
      
      if (response.message) {
        setSuccessMessage(response.message);
        setShowCreateAssignmentsModal(false);
        setCreateAssignmentsForm({
          date: new Date().toISOString().split('T')[0],
          shift_id: ''
        });
        
        // Reload assignments
        await loadAllAssignments(createAssignmentsForm.date);
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating assignments:', error);
      setError(error.message || 'Failed to create assignments');
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
        if (currentUser.role === 'employee') {
          await loadMyAssignments(dateFilter);
        } else {
          await loadAllAssignments(dateFilter);
        }
        
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

  const handleRotationFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    
    try {
      let response;
      
      if (selectedRotation) {
        response = await apiService.rotations.updateRotation(selectedRotation.id, rotationForm);
      } else {
        response = await apiService.rotations.createRotation(rotationForm);
      }
      
      if (response.rotation) {
        setSuccessMessage(`Rotation ${selectedRotation ? 'updated' : 'created'} successfully`);
        setShowRotationModal(false);
        setSelectedRotation(null);
        setRotationForm({
          shift: '',
          tasks: [],
          rotation_interval_minutes: 60,
          allow_multiple_employees_per_task: false
        });
        
        loadRotations();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving rotation:', error);
      setError(error.message || 'Failed to save rotation');
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
      
      if (currentUser.role === 'employee') {
        await loadMyAssignments(dateFilter);
        await loadCurrentAssignment();
        await loadNextAssignment();
      } else {
        await loadAllAssignments(dateFilter);
        await loadRotations();
        await loadOverloads();
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

  // Date change handler
  const handleDateChange = async (newDate) => {
    setDateFilter(newDate);
    
    try {
      setLoading(true);
      if (currentUser.role === 'employee') {
        await loadMyAssignments(newDate);
      } else {
        await loadAllAssignments(newDate);
      }
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

  const CurrentAssignmentCard = () => {
    if (!dashboardStats.currentAssignment) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Current Assignment</h3>
              <p className="text-blue-700 mt-1">No active assignment</p>
              <p className="text-sm text-blue-600 mt-2">You're not currently working on any task</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <Clock className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>
      );
    }

    const assignment = dashboardStats.currentAssignment;
    const timeRemaining = assignment.time_until_end_minutes;
    
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                Active Now
              </span>
              <PriorityBadge priority={assignment.priority} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{assignment.task_name}</h3>
            <p className="text-gray-600 mt-1">{assignment.task_description?.substring(0, 100)}...</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Started At</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(assignment.actual_start_time).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Time Remaining</p>
                <p className="text-sm font-medium text-gray-900">
                  {Math.round(timeRemaining)} minutes
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleCompleteAssignment(assignment)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Complete
            </button>
          </div>
          <div className="p-4 bg-green-200 rounded-lg ml-4">
            <Activity className="w-10 h-10 text-green-700" />
          </div>
        </div>
      </div>
    );
  };

  const NextAssignmentCard = () => {
    if (!dashboardStats.nextAssignment) {
      return (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Next Assignment</h3>
              <p className="text-gray-700 mt-1">No upcoming assignments</p>
              <p className="text-sm text-gray-600 mt-2">All tasks are completed for now</p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-gray-700" />
            </div>
          </div>
        </div>
      );
    }

    const assignment = dashboardStats.nextAssignment;
    const timeUntilStart = assignment.time_until_start_minutes;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={assignment.status} />
              <PriorityBadge priority={assignment.priority} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{assignment.task_name}</h3>
            <p className="text-gray-600 mt-1">{assignment.task_description?.substring(0, 100)}...</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Scheduled Start</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(assignment.start_time).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Starts In</p>
                <p className="text-sm font-medium text-gray-900">
                  {Math.round(timeUntilStart)} minutes
                </p>
              </div>
            </div>
            
            {assignment.can_start && (
              <button
                onClick={() => handleStartAssignment(assignment)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Now
              </button>
            )}
          </div>
          <div className="p-4 bg-blue-200 rounded-lg ml-4">
            <Clock className="w-10 h-10 text-blue-700" />
          </div>
        </div>
      </div>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Task Assignment Management</h1>
            <p className="mt-1 text-gray-600">
              Manage task assignments, rotations, and workload distribution
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
            
            {/* Admin/Supervisor specific buttons */}
            {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
              <>
                <button
                  onClick={() => {
                    setCreateAssignmentsForm({
                      date: new Date().toISOString().split('T')[0],
                      shift_id: ''
                    });
                    setShowCreateAssignmentsModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Create Daily Assignments
                </button>
                
                <button
                  onClick={() => {
                    setSelectedRotation(null);
                    setRotationForm({
                      shift: '',
                      tasks: [],
                      rotation_interval_minutes: 60,
                      allow_multiple_employees_per_task: false
                    });
                    setShowRotationModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Rotation
                </button>
              </>
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

      {/* View Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveView('my-assignments')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeView === 'my-assignments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserCheck className="inline mr-2 h-4 w-4" />
            My Assignments
          </button>
          
          {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
            <>
              <button
                onClick={() => setActiveView('all-assignments')}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeView === 'all-assignments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="inline mr-2 h-4 w-4" />
                All Assignments
              </button>
              
              <button
                onClick={() => setActiveView('rotations')}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeView === 'rotations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <RotateCcw className="inline mr-2 h-4 w-4" />
                Task Rotations
              </button>
              
              <button
                onClick={() => setActiveView('overloads')}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeView === 'overloads'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Zap className="inline mr-2 h-4 w-4" />
                Task Overloads
              </button>
            </>
          )}
        </div>
      </div>

      {/* Employee Dashboard */}
      {currentUser.role === 'employee' && activeView === 'my-assignments' && (
        <div className="space-y-6">
          {/* Current and Next Assignment Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrentAssignmentCard />
            <NextAssignmentCard />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      )}

      {/* Admin/Supervisor Dashboard */}
      {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && activeView === 'all-assignments' && (
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
              {activeView === 'my-assignments' ? 'My Assignments' : 
               activeView === 'all-assignments' ? 'All Assignments' :
               activeView === 'rotations' ? 'Task Rotations' :
               'Task Overloads'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeView === 'my-assignments' ? 'Your task assignments for the selected date' :
               activeView === 'all-assignments' ? 'All task assignments across the organization' :
               activeView === 'rotations' ? 'Task rotation configurations for shifts' :
               'Task overload situations requiring attention'}
            </p>
          </div>
          
          {(activeView === 'my-assignments' || activeView === 'all-assignments') && (
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
        {/* Filters */}
        {(activeView === 'my-assignments' || activeView === 'all-assignments') && (
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
                
                {currentUser.role !== 'employee' && (
                  <>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                    >
                      <option value="">All Employees</option>
                      {users.map(user => (
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4">
          {/* Assignments Table */}
          {(activeView === 'my-assignments' || activeView === 'all-assignments') && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeView === 'my-assignments' ? 'My Task Assignments' : 'All Task Assignments'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {Math.min(filteredAssignments.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      {currentUser.role !== 'employee' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('user_name')}>
                            Employee
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      )}
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
                        <td colSpan={currentUser.role !== 'employee' ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                          <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No assignments found. Try adjusting your filters or create new assignments.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedAssignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          {currentUser.role !== 'employee' && (
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
                          )}
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
                              
                              {/* Employee actions */}
                              {currentUser.role === 'employee' && assignment.can_start && assignment.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStartAssignment(assignment)}
                                  className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                  title="Start Assignment"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                              
                              {currentUser.role === 'employee' && assignment.status === 'active' && (
                                <button
                                  onClick={() => handleCompleteAssignment(assignment)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors"
                                  title="Complete Assignment"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              
                              {/* Admin/Supervisor actions */}
                              {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                                <>
                                  <button
                                    onClick={() => handleModifyAssignment(assignment)}
                                    className="p-1.5 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                                    title="Modify Assignment"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  
                                  {assignment.status !== 'active' && (
                                    <button
                                      onClick={() => handleDeleteAssignment(assignment)}
                                      className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                      title="Delete Assignment"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
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
          )}

          {/* Rotations Table */}
          {activeView === 'rotations' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Task Rotations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure task rotations for different shifts
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRotation(null);
                    setRotationForm({
                      shift: '',
                      tasks: [],
                      rotation_interval_minutes: 60,
                      allow_multiple_employees_per_task: false
                    });
                    setShowRotationModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Rotation
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tasks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rotation Interval</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rotations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          <RotateCcw className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No task rotations configured. Create your first rotation.</p>
                        </td>
                      </tr>
                    ) : (
                      rotations.map((rotation) => (
                        <tr key={rotation.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{rotation.shift_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {rotation.tasks_detail?.slice(0, 3).map((task) => (
                                <span key={task.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {task.name}
                                </span>
                              ))}
                              {rotation.tasks_detail?.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                  +{rotation.tasks_detail.length - 3} more
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {rotation.task_count} tasks total
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {rotation.rotation_interval_minutes} minutes
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              rotation.is_active
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {rotation.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditRotation(rotation)}
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Rotation"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAssignmentToDelete(rotation);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                title="Delete Rotation"
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
            </div>
          )}

          {/* Overloads Table */}
          {activeView === 'overloads' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Task Overloads</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track and manage task overload situations
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              overload.is_resolved
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
                                  setShowAssignmentDetailsModal(true);
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

      {/* Create Daily Assignments Modal */}
      {showCreateAssignmentsModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create Daily Assignments</h3>
                <button
                  onClick={() => setShowCreateAssignmentsModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateAssignments}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={createAssignmentsForm.date}
                      onChange={(e) => setCreateAssignmentsForm({...createAssignmentsForm, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift *
                    </label>
                    <select
                      value={createAssignmentsForm.shift_id}
                      onChange={(e) => setCreateAssignmentsForm({...createAssignmentsForm, shift_id: e.target.value})}
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
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

                  {/* Actual Time (if started/completed) */}
                  {(selectedAssignment.actual_start_time || selectedAssignment.actual_end_time) && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-yellow-600" />
                        <h5 className="text-sm font-medium text-yellow-700">Actual Time</h5>
                      </div>
                      <div className="space-y-1">
                        {selectedAssignment.actual_start_time && (
                          <p className="text-sm font-semibold text-yellow-900">
                            Started: {new Date(selectedAssignment.actual_start_time).toLocaleString()}
                          </p>
                        )}
                        {selectedAssignment.actual_end_time && (
                          <p className="text-sm font-semibold text-yellow-900">
                            Completed: {new Date(selectedAssignment.actual_end_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      <h5 className="text-sm font-medium text-indigo-700">Duration</h5>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-indigo-900">
                        Scheduled: {selectedAssignment.duration_minutes?.toFixed(0)} minutes
                      </p>
                      {selectedAssignment.actual_duration_minutes && (
                        <p className="text-sm font-semibold text-indigo-900">
                          Actual: {selectedAssignment.actual_duration_minutes?.toFixed(0)} minutes
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedAssignment.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h5 className="text-sm font-medium text-gray-700">Notes</h5>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedAssignment.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignmentDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Close
              </button>
              {currentUser.role !== 'employee' && (
                <button
                  onClick={() => {
                    setShowAssignmentDetailsModal(false);
                    handleModifyAssignment(selectedAssignment);
                  }}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
                >
                  Modify Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Start Assignment Modal */}
      {showStartAssignmentModal && assignmentToStart && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Start Assignment</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you ready to start <strong>{assignmentToStart.task_name}</strong>?
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Scheduled Time:</p>
                    <p className="text-sm text-blue-600">
                      {new Date(assignmentToStart.start_time).toLocaleTimeString()} - {new Date(assignmentToStart.end_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowStartAssignmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartAssignment}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Starting...' : 'Start Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Assignment Modal */}
      {showCompleteAssignmentModal && assignmentToComplete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Complete Assignment</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you finished with <strong>{assignmentToComplete.task_name}</strong>?
                  </p>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Started At:</p>
                    <p className="text-sm text-green-600">
                      {new Date(assignmentToComplete.actual_start_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowCompleteAssignmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmCompleteAssignment}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Completing...' : 'Complete Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {assignmentToDelete.task_name ? 'Assignment' : 'Rotation'}
                </h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete{' '}
                    <strong>
                      {assignmentToDelete.task_name || assignmentToDelete.shift_name}
                    </strong>
                    ?
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
                onClick={confirmDeleteAssignment}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all"
              >
                Delete
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
                      onChange={(e) => setModifyAssignmentForm({...modifyAssignmentForm, new_task_id: e.target.value})}
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
                        onChange={(e) => setModifyAssignmentForm({...modifyAssignmentForm, new_start_time: e.target.value})}
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
                        onChange={(e) => setModifyAssignmentForm({...modifyAssignmentForm, new_end_time: e.target.value})}
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
                      onChange={(e) => setModifyAssignmentForm({...modifyAssignmentForm, reason: e.target.value})}
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

      {/* Rotation Modal */}
      {showRotationModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRotation ? 'Edit Rotation' : 'Create Rotation'}
                </h3>
                <button
                  onClick={() => setShowRotationModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleRotationFormSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift *
                    </label>
                    <select
                      value={rotationForm.shift}
                      onChange={(e) => setRotationForm({...rotationForm, shift: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    >
                      <option value="">Select a shift</option>
                      {shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tasks *
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`task-${task.id}`}
                            checked={rotationForm.tasks.includes(task.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRotationForm({
                                  ...rotationForm,
                                  tasks: [...rotationForm.tasks, task.id]
                                });
                              } else {
                                setRotationForm({
                                  ...rotationForm,
                                  tasks: rotationForm.tasks.filter(id => id !== task.id)
                                });
                              }
                            }}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`task-${task.id}`} className="ml-2 text-sm text-gray-700">
                            {task.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selected {rotationForm.tasks.length} tasks
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation Interval (minutes) *
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      value={rotationForm.rotation_interval_minutes}
                      onChange={(e) => setRotationForm({...rotationForm, rotation_interval_minutes: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time each employee works on a task before rotating to the next one
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allow_multiple_employees"
                      checked={rotationForm.allow_multiple_employees_per_task}
                      onChange={(e) => setRotationForm({...rotationForm, allow_multiple_employees_per_task: e.target.checked})}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="allow_multiple_employees" className="ml-2 text-sm text-gray-700">
                      Allow multiple employees per task (for overload situations)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRotationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving...' : (selectedRotation ? 'Update Rotation' : 'Create Rotation')}
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
                        onChange={(e) => setOverloadForm({...overloadForm, task_id: e.target.value})}
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
                        onChange={(e) => setOverloadForm({...overloadForm, shift_id: e.target.value})}
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
                        onChange={(e) => setOverloadForm({...overloadForm, overload_date: e.target.value})}
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
                        onChange={(e) => setOverloadForm({...overloadForm, additional_employees_needed: parseInt(e.target.value)})}
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
                        onChange={(e) => setOverloadForm({...overloadForm, time_slot_start: e.target.value})}
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
                        onChange={(e) => setOverloadForm({...overloadForm, time_slot_end: e.target.value})}
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
                      onChange={(e) => setOverloadForm({...overloadForm, reason: e.target.value})}
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