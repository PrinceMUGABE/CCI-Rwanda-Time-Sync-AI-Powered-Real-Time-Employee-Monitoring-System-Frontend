import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Moon,
  Sun,
  Calendar,
  Coffee,
  Clock as ClockIcon,
  Coffee as CoffeeIcon,
  FileText
} from 'lucide-react';

const BASE_URL = "http://127.0.0.1:8000";

export default function ShiftsManagement() {
  // State for tabs
  const [activeTab, setActiveTab] = useState('shifts');
  
  // Common states
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Shifts states
  const [shifts, setShifts] = useState([]);
  const [shiftStatusFilter, setShiftStatusFilter] = useState('all');
  const [shiftStats, setShiftStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  // Break templates states
  const [breakTemplates, setBreakTemplates] = useState([]);
  const [breakStatusFilter, setBreakStatusFilter] = useState('all');
  const [selectedShiftForBreaks, setSelectedShiftForBreaks] = useState('all');
  const [shiftsList, setShiftsList] = useState([]); // For dropdown in break templates
  const [breakStats, setBreakStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  // Modal states
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isBreakDialogOpen, setIsBreakDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'shift' or 'break'
  const [viewShiftModal, setViewShiftModal] = useState(false);
  const [shiftToView, setShiftToView] = useState(null);

  // Form states
  const [shiftFormData, setShiftFormData] = useState({
    name: '',
    start_at: '',
    end_at: '',
    status: 'active',
    description: ''
  });

  const [breakFormData, setBreakFormData] = useState({
    shift: '',
    name: '',
    start_at: '',
    end_at: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  // Fetch shifts for both tabs
  const fetchShifts = async (page = 1) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Please log in to access shift management");
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10'
      });

      if (shiftStatusFilter !== 'all') {
        params.append('status', shiftStatusFilter);
      }

      const response = await fetch(`${BASE_URL}/shift/shifts/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shifts: ${response.status}`);
      }

      const data = await response.json();
      
      setShifts(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 10));
      
      // Calculate stats
      const total = data.count || 0;
      const active = (data.results || []).filter(s => s.status === 'active').length;
      const inactive = (data.results || []).filter(s => s.status === 'inactive').length;
      setShiftStats({ total, active, inactive });
      
      // Update shifts list for break templates dropdown
      setShiftsList(data.results || []);
      
    } catch (error) {
      console.error('Error fetching shifts:', error);
      alert("Failed to load shifts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch break templates
  const fetchBreakTemplates = async (page = 1) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Please log in to access break management");
        return;
      }

      // Fetch all shifts to get breaks for each
      const response = await fetch(`${BASE_URL}/shift/shifts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shifts for breaks: ${response.status}`);
      }

      const data = await response.json();
      const allShifts = data.results || [];
      setShiftsList(allShifts);
      
      // Fetch breaks for each shift
      const breakPromises = allShifts.map(async (shift) => {
        try {
          const breaksResponse = await fetch(`${BASE_URL}/shift/shifts/${shift.id}/breaks/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          if (breaksResponse.ok) {
            const breaksData = await breaksResponse.json();
            return {
              shift_id: shift.id,
              shift_name: shift.name,
              breaks: breaksData.breaks || []
            };
          }
          return { shift_id: shift.id, shift_name: shift.name, breaks: [] };
        } catch (error) {
          console.error(`Error fetching breaks for shift ${shift.id}:`, error);
          return { shift_id: shift.id, shift_name: shift.name, breaks: [] };
        }
      });

      const allBreaksData = await Promise.all(breakPromises);
      
      // Flatten breaks array
      const flattenedBreaks = [];
      let totalBreaks = 0;
      let activeBreaks = 0;
      let inactiveBreaks = 0;
      
      allBreaksData.forEach(shiftData => {
        shiftData.breaks.forEach(brk => {
          const breakWithShift = {
            ...brk,
            shift_name: shiftData.shift_name,
            shift_id: shiftData.shift_id
          };
          flattenedBreaks.push(breakWithShift);
          
          // Update stats
          totalBreaks++;
          if (brk.status === 'active') activeBreaks++;
          else inactiveBreaks++;
        });
      });
      
      setBreakTemplates(flattenedBreaks);
      setBreakStats({ total: totalBreaks, active: activeBreaks, inactive: inactiveBreaks });
      
    } catch (error) {
      console.error('Error fetching break templates:', error);
      alert("Failed to load break templates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create shift
  const createShift = async (shiftData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/shifts/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiftData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || 'Failed to create shift');
      }

      alert(data.message || "Shift created successfully");
      fetchShifts(currentPage);
      fetchBreakTemplates(); // Refresh break templates too
      resetShiftForm();
      setIsShiftDialogOpen(false);

    } catch (error) {
      alert(error.message || "Failed to create shift");
    }
  };

  // Update shift
  const updateShift = async (shiftId, shiftData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/shifts/${shiftId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiftData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || 'Failed to update shift');
      }

      alert(data.message || "Shift updated successfully");
      fetchShifts(currentPage);
      fetchBreakTemplates(); // Refresh break templates too
      resetShiftForm();
      setIsShiftDialogOpen(false);
      setIsEditing(false);
      setSelectedShift(null);

    } catch (error) {
      alert(error.message || "Failed to update shift");
    }
  };

  // Delete shift
  const deleteShift = async (shiftId) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/shifts/${shiftId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete shift');
      }

      alert(data.message || "Shift deleted successfully");
      fetchShifts(currentPage);
      fetchBreakTemplates(); // Refresh break templates too
      setDeleteConfirmOpen(false);
      setItemToDelete(null);

    } catch (error) {
      alert(error.message || "Failed to delete shift");
    }
  };

  // Create break template
  const createBreakTemplate = async (breakData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/breaks/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(breakData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || 'Failed to create break template');
      }

      alert(data.message || "Break template created successfully");
      fetchBreakTemplates();
      resetBreakForm();
      setIsBreakDialogOpen(false);

    } catch (error) {
      alert(error.message || "Failed to create break template");
    }
  };

  // Update break template
  const updateBreakTemplate = async (breakId, breakData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/breaks/${breakId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(breakData)
      });

      const data = await response.json();
      

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || 'Failed to update break template');
      }

      console.log('Update Break Response:', data);

      alert(data.message || "Break template updated successfully");
      fetchBreakTemplates();
      resetBreakForm();
      setIsBreakDialogOpen(false);
      setIsEditing(false);
      setSelectedBreak(null);

    } catch (error) {
      alert(error.message || "Failed to update break template");
    }
  };

  // Delete break template
  const deleteBreakTemplate = async (breakId) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/breaks/${breakId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete break template');
      }

      alert(data.message || "Break template deleted successfully");
      fetchBreakTemplates();
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      setDeleteType('');

    } catch (error) {
      alert(error.message || "Failed to delete break template");
    }
  };

  // Get shift details
  const getShiftDetails = async (shiftId) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/shift/shifts/${shiftId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch shift details');
      }

      setShiftToView(data.shift || data);
      setViewShiftModal(true);

    } catch (error) {
      alert(error.message || "Failed to load shift details");
    }
  };

  // Initialize forms for editing
  const initializeShiftFormForEdit = (shift) => {
    setShiftFormData({
      name: shift.name,
      start_at: shift.start_at,
      end_at: shift.end_at,
      status: shift.status,
      description: shift.description || ''
    });
    setSelectedShift(shift);
    setIsEditing(true);
    setIsShiftDialogOpen(true);
    setErrors({});
  };

  const initializeBreakFormForEdit = (breakTemplate) => {
    setBreakFormData({
      shift: breakTemplate.shift_id || breakTemplate.shift,
      name: breakTemplate.name,
      start_at: breakTemplate.start_at,
      end_at: breakTemplate.end_at,
      status: breakTemplate.status
    });
    setSelectedBreak(breakTemplate);
    setIsEditing(true);
    setIsBreakDialogOpen(true);
    setErrors({});
  };

  // Reset forms
  const resetShiftForm = () => {
    setShiftFormData({
      name: '',
      start_at: '',
      end_at: '',
      status: 'active',
      description: ''
    });
    setSelectedShift(null);
    setIsEditing(false);
    setErrors({});
  };

  const resetBreakForm = () => {
    setBreakFormData({
      shift: '',
      name: '',
      start_at: '',
      end_at: '',
      status: 'active'
    });
    setSelectedBreak(null);
    setIsEditing(false);
    setErrors({});
  };

  // Open delete confirmation
  const openDeleteConfirm = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setDeleteConfirmOpen(true);
  };

  // Form submissions
  const handleShiftFormSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!shiftFormData.name.trim()) {
      setErrors({ name: ['Shift name is required'] });
      return;
    }

    if (!shiftFormData.start_at) {
      setErrors({ start_at: ['Start time is required'] });
      return;
    }

    if (!shiftFormData.end_at) {
      setErrors({ end_at: ['End time is required'] });
      return;
    }

    const submitData = { ...shiftFormData };

    if (isEditing && selectedShift) {
      updateShift(selectedShift.id, submitData);
    } else {
      createShift(submitData);
    }
  };

  const handleBreakFormSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!breakFormData.shift) {
      setErrors({ shift: ['Shift selection is required'] });
      return;
    }

    if (!breakFormData.name.trim()) {
      setErrors({ name: ['Break name is required'] });
      return;
    }

    if (!breakFormData.start_at) {
      setErrors({ start_at: ['Start time is required'] });
      return;
    }

    if (!breakFormData.end_at) {
      setErrors({ end_at: ['End time is required'] });
      return;
    }

    const submitData = { ...breakFormData };

    if (isEditing && selectedBreak) {
      updateBreakTemplate(selectedBreak.id, submitData);
    } else {
      createBreakTemplate(submitData);
    }
  };

  // Filtering functions
  const filteredShifts = shifts.filter(shift => {
    const searchLower = searchTerm.toLowerCase();
    return shift.name.toLowerCase().includes(searchLower) ||
           (shift.description?.toLowerCase() || '').includes(searchLower);
  });

  const filteredBreaks = breakTemplates.filter(brk => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = brk.name.toLowerCase().includes(searchLower) ||
                          brk.shift_name.toLowerCase().includes(searchLower);
    
    const matchesStatus = breakStatusFilter === 'all' || brk.status === breakStatusFilter;
    const matchesShift = selectedShiftForBreaks === 'all' || brk.shift_id.toString() === selectedShiftForBreaks;
    
    return matchesSearch && matchesStatus && matchesShift;
  });

  // Helper functions
  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMinutes === 0) {
      return `${diffHours} hrs`;
    }
    return `${diffHours}h ${diffMinutes}m`;
  };

  const calculateBreakDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle break crossing midnight (rare but possible)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (remainingMinutes === 0) {
      return `${diffHours} hrs`;
    }
    return `${diffHours}h ${remainingMinutes}m`;
  };

  // Fetch data based on active tab
  useEffect(() => {
    setLoading(true);
    if (activeTab === 'shifts') {
      fetchShifts(currentPage);
    } else {
      fetchBreakTemplates();
    }
  }, [activeTab, currentPage, shiftStatusFilter]);

  if (loading && activeTab === 'shifts' && shifts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        <span className="ml-2 text-gray-600">Loading {activeTab === 'shifts' ? 'shifts' : 'breaks'}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shifts & Breaks Management</h1>
          <p className="text-gray-600">Create and manage work shifts and breaks</p>
        </div>
        
        {/* Create Button based on active tab */}
        {activeTab === 'shifts' ? (
          <button
            onClick={() => {
              resetShiftForm();
              setIsShiftDialogOpen(true);
            }}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="size-4" />
            Create Shift
          </button>
        ) : (
          <button
            onClick={() => {
              resetBreakForm();
              setIsBreakDialogOpen(true);
            }}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="size-4" />
            Create Break
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => {
                setActiveTab('shifts');
                setCurrentPage(1);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shifts'
                  ? 'border-slate-500 text-slate-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                Shifts Management
                {shiftStats.total > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === 'shifts' 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {shiftStats.total}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('breaks');
                setCurrentPage(1);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'breaks'
                  ? 'border-slate-500 text-slate-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coffee className="size-4" />
                Breaks
                {breakStats.total > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === 'breaks' 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {breakStats.total}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Statistics Cards */}
          {activeTab === 'shifts' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Shifts</p>
                      <p className="text-2xl font-bold text-gray-900">{shiftStats.total}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-full">
                      <Clock className="size-6 text-slate-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Shifts</p>
                      <p className="text-2xl font-bold text-green-600">{shiftStats.active}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="size-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Inactive Shifts</p>
                      <p className="text-2xl font-bold text-gray-600">{shiftStats.inactive}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-full">
                      <XCircle className="size-6 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shifts Filters */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          placeholder="Search by shift name or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </div>
                    <div>
                      <select
                        value={shiftStatusFilter}
                        onChange={(e) => setShiftStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shifts Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Shifts ({filteredShifts.length})</h2>
                  <p className="text-gray-600">Manage shifts time for scheduling</p>
                </div>

                <div className="p-0">
                  {filteredShifts.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts found</h3>
                      <p className="text-gray-500">
                        {searchTerm || shiftStatusFilter !== 'all' 
                          ? 'Try adjusting your search or filter' 
                          : 'Create a new shift to get started'
                        }
                      </p>
                      {(searchTerm || shiftStatusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setShiftStatusFilter('all');
                          }}
                          className="mt-4 px-4 py-2 text-slate-600 hover:text-slate-700 font-medium"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Shift Name</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Time Range</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Duration</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Type</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Status</th>
                              <th className="py-3 px-4 text-right font-medium text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredShifts.map((shift) => {
                              const isOvernight = shift.is_overnight || 
                                (shift.start_at && shift.end_at && shift.end_at < shift.start_at);
                              
                              return (
                                <tr key={shift.id} className="border-b hover:bg-gray-50 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        isOvernight ? 'bg-purple-100' : 'bg-slate-100'
                                      }`}>
                                        {isOvernight ? (
                                          <Moon className="size-5 text-purple-600" />
                                        ) : (
                                          <Sun className="size-5 text-slate-600" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">{shift.name}</p>
                                        <p className="text-xs text-gray-500">ID: {shift.id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {shift.formatted_time_range || 
                                        `${formatTime(shift.start_at)} - ${formatTime(shift.end_at)}`
                                      }
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-sm text-gray-600">
                                      {shift.duration_hours || calculateDuration(shift.start_at, shift.end_at)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {isOvernight ? (
                                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                        Overnight
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                        Day Shift
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 text-xs rounded-full capitalize border ${getStatusColor(shift.status)}`}>
                                      {shift.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => getShiftDetails(shift.id)}
                                        title="View Details"
                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                      >
                                        <Eye className="size-4 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() => initializeShiftFormForEdit(shift)}
                                        title="Edit Shift"
                                        className="p-2 hover:bg-slate-50 rounded-md transition-colors"
                                      >
                                        <Edit className="size-4 text-slate-600" />
                                      </button>
                                      <button
                                        onClick={() => openDeleteConfirm(shift, 'shift')}
                                        title="Delete Shift"
                                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                                      >
                                        <Trash2 className="size-4 text-red-600" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-6 border-t">
                          <p className="text-sm text-gray-600">
                            Showing page {currentPage} of {totalPages} • {totalCount} total Shifts
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className={`px-3 py-1 border rounded-md text-sm flex items-center gap-1 transition-colors ${
                                currentPage === 1 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <ChevronLeft className="size-4" />
                              Previous
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                                    className={`w-8 h-8 rounded-md text-sm transition-colors ${
                                      currentPage === pageNum 
                                        ? 'bg-slate-600 text-white' 
                                        : 'border hover:bg-gray-50'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className={`px-3 py-1 border rounded-md text-sm flex items-center gap-1 transition-colors ${
                                currentPage === totalPages 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              Next
                              <ChevronRight className="size-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Breaks Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Breaks</p>
                      <p className="text-2xl font-bold text-gray-900">{breakStats.total}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Coffee className="size-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Breaks</p>
                      <p className="text-2xl font-bold text-green-600">{breakStats.active}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="size-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Inactive Breaks</p>
                      <p className="text-2xl font-bold text-gray-600">{breakStats.inactive}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-full">
                      <XCircle className="size-6 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Breaks Filters */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          placeholder="Search by break name or shift..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <select
                        value={breakStatusFilter}
                        onChange={(e) => setBreakStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={selectedShiftForBreaks}
                        onChange={(e) => setSelectedShiftForBreaks(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Shifts</option>
                        {shiftsList.map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breaks Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Breaks ({filteredBreaks.length})</h2>
                  <p className="text-gray-600">Manage breaks for shifts</p>
                </div>

                <div className="p-0">
                  {filteredBreaks.length === 0 ? (
                    <div className="text-center py-12">
                      <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No breaks found</h3>
                      <p className="text-gray-500">
                        {searchTerm || breakStatusFilter !== 'all' || selectedShiftForBreaks !== 'all'
                          ? 'Try adjusting your search or filter' 
                          : 'Create a new break to get started'
                        }
                      </p>
                      {(searchTerm || breakStatusFilter !== 'all' || selectedShiftForBreaks !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setBreakStatusFilter('all');
                            setSelectedShiftForBreaks('all');
                          }}
                          className="mt-4 px-4 py-2 text-green-600 hover:text-green-700 font-medium"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Break Name</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Shift</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Time Range</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Duration</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-900">Status</th>
                              <th className="py-3 px-4 text-right font-medium text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBreaks.map((breakTemplate) => (
                              <tr key={breakTemplate.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                                      <CoffeeIcon className="size-5 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{breakTemplate.name}</p>
                                      <p className="text-xs text-gray-500">ID: {breakTemplate.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
                                      <ClockIcon className="size-4 text-slate-600" />
                                    </div>
                                    <span className="text-sm text-gray-900">{breakTemplate.shift_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {formatTime(breakTemplate.start_at)} - {formatTime(breakTemplate.end_at)}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm text-gray-600">
                                    {breakTemplate.duration_minutes || calculateBreakDuration(breakTemplate.start_at, breakTemplate.end_at)}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 text-xs rounded-full capitalize border ${getStatusColor(breakTemplate.status)}`}>
                                    {breakTemplate.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => initializeBreakFormForEdit(breakTemplate)}
                                      title="Edit Break"
                                      className="p-2 hover:bg-green-50 rounded-md transition-colors"
                                    >
                                      <Edit className="size-4 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => openDeleteConfirm(breakTemplate, 'break')}
                                      title="Delete Break"
                                      className="p-2 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <Trash2 className="size-4 text-red-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Shift Modal */}
      {isShiftDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Shift' : 'Create Shift'}
              </h2>
              <p className="text-gray-600">
                {isEditing ? 'Update shift information' : 'Create a new shift for scheduling'}
              </p>
            </div>
            <form onSubmit={handleShiftFormSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Shift Name *
                  </label>
                  <input
                    id="name"
                    value={shiftFormData.name}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, name: e.target.value })}
                    placeholder="e.g., Morning Shift, Night Shift, Weekend Shift"
                    required
                    maxLength={200}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="start_at" className="text-sm font-medium text-gray-700">
                      Start Time *
                    </label>
                    <input
                      id="start_at"
                      type="time"
                      value={shiftFormData.start_at}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, start_at: e.target.value })}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        errors.start_at ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.start_at && <p className="text-xs text-red-600">{errors.start_at[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="end_at" className="text-sm font-medium text-gray-700">
                      End Time *
                    </label>
                    <input
                      id="end_at"
                      type="time"
                      value={shiftFormData.end_at}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, end_at: e.target.value })}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        errors.end_at ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.end_at && <p className="text-xs text-red-600">{errors.end_at[0]}</p>}
                  </div>
                </div>

                {/* Time Preview */}
                {shiftFormData.start_at && shiftFormData.end_at && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Time Preview</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Start Time</p>
                        <p className="font-medium">{formatTime(shiftFormData.start_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">End Time</p>
                        <p className="font-medium">{formatTime(shiftFormData.end_at)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium">{calculateDuration(shiftFormData.start_at, shiftFormData.end_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                      shiftFormData.status === 'active'
                        ? 'bg-green-50 border-green-300 ring-2 ring-green-100'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={shiftFormData.status === 'active'}
                        onChange={(e) => setShiftFormData({ ...shiftFormData, status: e.target.value })}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <CheckCircle className="size-6 mb-1 text-green-500" />
                        <span className="text-sm font-medium">Active</span>
                        <span className="text-xs text-gray-500">Available for use</span>
                      </div>
                    </label>
                    <label className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                      shiftFormData.status === 'inactive'
                        ? 'bg-gray-50 border-gray-300 ring-2 ring-gray-100'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={shiftFormData.status === 'inactive'}
                        onChange={(e) => setShiftFormData({ ...shiftFormData, status: e.target.value })}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <XCircle className="size-6 mb-1 text-gray-500" />
                        <span className="text-sm font-medium">Inactive</span>
                        <span className="text-xs text-gray-500">Not available</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={shiftFormData.description}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, description: e.target.value })}
                    placeholder="Add any additional notes or details about this shift..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsShiftDialogOpen(false);
                    resetShiftForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {isEditing ? 'Update Shift' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Break Modal */}
      {isBreakDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Break' : 'Create Break'}
              </h2>
              <p className="text-gray-600">
                {isEditing ? 'Update break information' : 'Create a new break for shifts'}
              </p>
            </div>
            <form onSubmit={handleBreakFormSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="break_shift" className="text-sm font-medium text-gray-700">
                    Select Shift *
                  </label>
                  <select
                    id="break_shift"
                    value={breakFormData.shift}
                    onChange={(e) => setBreakFormData({ ...breakFormData, shift: e.target.value })}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.shift ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select a shift...</option>
                    {shiftsList
                      .filter(shift => shift.status === 'active')
                      .map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({formatTime(shift.start_at)} - {formatTime(shift.end_at)})
                        </option>
                      ))
                    }
                  </select>
                  {errors.shift && <p className="text-xs text-red-600">{errors.shift[0]}</p>}
                  {shiftsList.filter(s => s.status === 'active').length === 0 && (
                    <p className="text-xs text-yellow-600">
                      No active shifts available. Please create an active shift first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="break_name" className="text-sm font-medium text-gray-700">
                    Break Name *
                  </label>
                  <input
                    id="break_name"
                    value={breakFormData.name}
                    onChange={(e) => setBreakFormData({ ...breakFormData, name: e.target.value })}
                    placeholder="e.g., Lunch Break, Tea Break, Short Break"
                    required
                    maxLength={200}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="break_start_at" className="text-sm font-medium text-gray-700">
                      Start Time *
                    </label>
                    <input
                      id="break_start_at"
                      type="time"
                      value={breakFormData.start_at}
                      onChange={(e) => setBreakFormData({ ...breakFormData, start_at: e.target.value })}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.start_at ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.start_at && <p className="text-xs text-red-600">{errors.start_at[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="break_end_at" className="text-sm font-medium text-gray-700">
                      End Time *
                    </label>
                    <input
                      id="break_end_at"
                      type="time"
                      value={breakFormData.end_at}
                      onChange={(e) => setBreakFormData({ ...breakFormData, end_at: e.target.value })}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.end_at ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.end_at && <p className="text-xs text-red-600">{errors.end_at[0]}</p>}
                  </div>
                </div>

                {/* Time Preview */}
                {breakFormData.start_at && breakFormData.end_at && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Break Time Preview</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Start Time</p>
                        <p className="font-medium">{formatTime(breakFormData.start_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">End Time</p>
                        <p className="font-medium">{formatTime(breakFormData.end_at)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium">{calculateBreakDuration(breakFormData.start_at, breakFormData.end_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                      breakFormData.status === 'active'
                        ? 'bg-green-50 border-green-300 ring-2 ring-green-100'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="break_status"
                        value="active"
                        checked={breakFormData.status === 'active'}
                        onChange={(e) => setBreakFormData({ ...breakFormData, status: e.target.value })}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <CheckCircle className="size-6 mb-1 text-green-500" />
                        <span className="text-sm font-medium">Active</span>
                        <span className="text-xs text-gray-500">Available for use</span>
                      </div>
                    </label>
                    <label className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                      breakFormData.status === 'inactive'
                        ? 'bg-gray-50 border-gray-300 ring-2 ring-gray-100'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="break_status"
                        value="inactive"
                        checked={breakFormData.status === 'inactive'}
                        onChange={(e) => setBreakFormData({ ...breakFormData, status: e.target.value })}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center">
                        <XCircle className="size-6 mb-1 text-gray-500" />
                        <span className="text-sm font-medium">Inactive</span>
                        <span className="text-xs text-gray-500">Not available</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsBreakDialogOpen(false);
                    resetBreakForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isEditing ? 'Update Break' : 'Create Break'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Shift Details Modal */}
      {viewShiftModal && shiftToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Shift Details</h2>
              <p className="text-gray-600">Complete information about this shift</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Shift Name</p>
                      <p className="font-medium text-gray-900">{shiftToView.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time Range</p>
                      <p className="font-medium text-gray-900">
                        {shiftToView.formatted_time_range || 
                          `${formatTime(shiftToView.start_at)} - ${formatTime(shiftToView.end_at)}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">
                        {shiftToView.duration_hours || calculateDuration(shiftToView.start_at, shiftToView.end_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize border ${getStatusColor(shiftToView.status)}`}>
                        {shiftToView.status}
                      </span>
                    </div>
                    {shiftToView.description && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="font-medium text-gray-900">{shiftToView.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Information</h3>
                  {shiftToView.breaks && shiftToView.breaks.length > 0 ? (
                    <div className="space-y-3">
                      {shiftToView.breaks.map((brk) => (
                        <div key={brk.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Coffee className="size-4 text-green-600" />
                              <span className="font-medium text-gray-900">{brk.name}</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full capitalize border ${getStatusColor(brk.status)}`}>
                              {brk.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Time</p>
                              <p className="font-medium">{formatTime(brk.start_at)} - {formatTime(brk.end_at)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duration</p>
                              <p className="font-medium">{brk.duration_minutes || calculateBreakDuration(brk.start_at, brk.end_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg bg-gray-50">
                      <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No breaks configured for this shift</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t">
              <div className="flex justify-end">
                <button
                  onClick={() => setViewShiftModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete {deleteType === 'shift' ? 'the shift' : 'the break'} 
                "<strong>{itemToDelete.name}</strong>"?
              </p>
              <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> {deleteType === 'shift' 
                      ? 'This will prevent the shift from being used in future shift assignments. Existing assignments will not be affected.'
                      : 'This will remove the break from the associated shift. Existing break logs will not be affected.'
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setItemToDelete(null);
                  setDeleteType('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteType === 'shift' && itemToDelete) {
                    deleteShift(itemToDelete.id);
                  } else if (deleteType === 'break' && itemToDelete) {
                    deleteBreakTemplate(itemToDelete.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="size-4" />
                Delete {deleteType === 'shift' ? 'Shift' : 'Break'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}