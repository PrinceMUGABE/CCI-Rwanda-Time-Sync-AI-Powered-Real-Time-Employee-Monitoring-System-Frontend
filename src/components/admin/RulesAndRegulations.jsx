import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, X, Save, Plus, Edit, Trash2, 
  CheckCircle, XCircle, AlertCircle, Clock, Filter,
  ChevronLeft, ChevronRight, ArrowUpDown, FileText,
  Users, Shield, Lock, Globe, Eye, BookOpen,
  AlertTriangle, TrendingUp, BarChart3, Calendar,
  List, CheckSquare, Square
} from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000/rules';

export default function RulesManagement() {
  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('access_token') || '');
  
  // Data states
  const [rules, setRules] = useState([]);
  
  // Modal states
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Selected items
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [viewRule, setViewRule] = useState(null);
  
  // Form states
  const [ruleForm, setRuleForm] = useState({
    title: '',
    description: '',
    rule_type: 'rule',
    user_type: 'all',
    status: 'active'
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalRules: 0,
    activeRules: 0,
    inactiveRules: 0,
    ruleTypeCount: { rule: 0, regulation: 0 }
  });

  // Colors and icons
  const RULE_TYPE_COLORS = {
    rule: 'bg-blue-100 text-blue-800 border border-blue-200',
    regulation: 'bg-purple-100 text-purple-800 border border-purple-200',
    policy: 'bg-green-100 text-green-800 border border-green-200',
    procedure: 'bg-orange-100 text-orange-800 border border-orange-200',
    guideline: 'bg-teal-100 text-teal-800 border border-teal-200'
  };

  const RULE_TYPE_ICONS = {
    rule: BookOpen,
    regulation: Shield,
    policy: FileText,
    procedure: List,
    guideline: AlertCircle
  };

  const USER_TYPE_COLORS = {
    all: 'bg-gray-100 text-gray-800 border border-gray-200',
    employee: 'bg-green-100 text-green-800 border border-green-200',
    supervisor: 'bg-blue-100 text-blue-800 border border-blue-200',
    admin: 'bg-red-100 text-red-800 border border-red-200',
    both: 'bg-purple-100 text-purple-800 border border-purple-200'
  };

  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-red-100 text-red-800 border border-red-200',
    draft: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    archived: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  // API Service
  const apiService = {
    rules: {
      getAllRules: async () => {
        const response = await fetch(`${BASE_URL}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch rules');
        return response.json();
      },
      
      getUserRules: async () => {
        const response = await fetch(`${BASE_URL}/user/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch user rules');
        return response.json();
      },
      
      getRuleById: async (ruleId) => {
        const response = await fetch(`${BASE_URL}/${ruleId}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch rule');
        return response.json();
      },
      
      createRule: async (ruleData) => {
        const response = await fetch(`${BASE_URL}/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(ruleData)
        });
        if (!response.ok) throw new Error('Failed to create rule');
        return response.json();
      },
      
      updateRule: async (ruleId, ruleData) => {
        const response = await fetch(`${BASE_URL}/${ruleId}/update/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(ruleData)
        });
        if (!response.ok) throw new Error('Failed to update rule');
        return response.json();
      },
      
      deleteRule: async (ruleId) => {
        const response = await fetch(`${BASE_URL}/${ruleId}/delete/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete rule');
        return response.json();
      },
      
      getRulesByType: async (type) => {
        const response = await fetch(`${BASE_URL}/type/${type}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch rules by type');
        return response.json();
      }
    }
  };

  // Load all data on mount
  useEffect(() => {
    loadAllRules();
  }, []);

  const loadAllRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.rules.getAllRules();
      
      if (response.success && response.data) {
        setRules(response.data);
        calculateDashboardStats(response.data);
      } else {
        // If getAllRules fails (non-admin), try getUserRules
        const userResponse = await apiService.rules.getUserRules();
        if (userResponse.success && userResponse.data) {
          setRules(userResponse.data);
          calculateDashboardStats(userResponse.data);
        }
      }
      
    } catch (error) {
      console.error('Error loading rules:', error);
      setError('Failed to load rules. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (rulesData) => {
    const total = rulesData.length;
    const active = rulesData.filter(r => r.status === 'active').length;
    const inactive = rulesData.filter(r => r.status === 'inactive').length;
    
    const ruleTypeCount = {
      rule: rulesData.filter(r => r.rule_type === 'rule').length,
      regulation: rulesData.filter(r => r.rule_type === 'regulation').length,
      policy: rulesData.filter(r => r.rule_type === 'policy').length,
      procedure: rulesData.filter(r => r.rule_type === 'procedure').length,
      guideline: rulesData.filter(r => r.rule_type === 'guideline').length
    };
    
    setDashboardStats({
      totalRules: total,
      activeRules: active,
      inactiveRules: inactive,
      ruleTypeCount: ruleTypeCount
    });
  };

  // Filter rules
  const filteredRules = useMemo(() => {
    let filtered = [...rules];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.title?.toLowerCase().includes(term) ||
        rule.description?.toLowerCase().includes(term)
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(rule => rule.rule_type === typeFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rule => rule.status === statusFilter);
    }
    
    // User type filter
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(rule => rule.user_type === userTypeFilter);
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
  }, [rules, searchTerm, typeFilter, statusFilter, userTypeFilter, sortConfig]);

  // Pagination
  const paginatedRules = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRules.slice(startIndex, endIndex);
  }, [filteredRules, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRules.length / rowsPerPage);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewRule = (rule) => {
    setViewRule(rule);
    setShowViewModal(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setRuleForm({
      title: rule.title,
      description: rule.description,
      rule_type: rule.rule_type,
      user_type: rule.user_type,
      status: rule.status
    });
    setShowRuleModal(true);
  };

  const handleDeleteRule = (rule) => {
    setRuleToDelete(rule);
    setShowDeleteModal(true);
  };

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    
    try {
      const response = await apiService.rules.deleteRule(ruleToDelete.id);
      if (response.success) {
        setSuccessMessage('Rule deleted successfully');
        setShowDeleteModal(false);
        setRuleToDelete(null);
        loadAllRules();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      setError('Failed to delete rule');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRuleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    
    try {
      let response;
      
      if (selectedRule) {
        response = await apiService.rules.updateRule(selectedRule.id, ruleForm);
      } else {
        response = await apiService.rules.createRule(ruleForm);
      }
      
      if (response.success) {
        setSuccessMessage(`Rule ${selectedRule ? 'updated' : 'created'} successfully`);
        setShowRuleModal(false);
        setSelectedRule(null);
        setRuleForm({ 
          title: '', 
          description: '', 
          rule_type: 'rule', 
          user_type: 'all', 
          status: 'active' 
        });
        loadAllRules();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      setError('Failed to save rule');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Components
  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const TypeBadge = ({ type }) => {
    const colorClass = RULE_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const Icon = RULE_TYPE_ICONS[type] || FileText;
    const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${colorClass}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const UserTypeBadge = ({ userType }) => {
    const colorClass = USER_TYPE_COLORS[userType] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const label = userType === 'both' ? 'Emp & Sup' :
                  userType === 'employee_supervisor' ? 'Emp & Sup' :
                  userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : 'Unknown';
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const Icon = status === 'active' ? CheckCircle : 
                 status === 'inactive' ? XCircle :
                 Clock;
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${colorClass}`}>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rules & Regulations</h1>
            <p className="mt-1 text-gray-600">
              Manage company rules, policies, and regulations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllRules}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow transition-all"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setSelectedRule(null);
                setRuleForm({ 
                  title: '', 
                  description: '', 
                  rule_type: 'rule', 
                  user_type: 'all', 
                  status: 'active' 
                });
                setShowRuleModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Rules"
          value={dashboardStats.totalRules}
          icon={FileText}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Rules"
          value={dashboardStats.activeRules}
          icon={CheckCircle}
          color="bg-gradient-to-r from-green-500 to-green-600"
          subtitle={`${dashboardStats.totalRules > 0 ? Math.round((dashboardStats.activeRules / dashboardStats.totalRules) * 100) : 0}% of total`}
        />
        <StatCard
          title="Rules"
          value={dashboardStats.ruleTypeCount.rule}
          icon={BookOpen}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatCard
          title="Regulations"
          value={dashboardStats.ruleTypeCount.regulation}
          icon={Shield}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
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
                  placeholder="Search rules by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Types</option>
                <option value="rule">Rules</option>
                <option value="regulation">Regulations</option>
                <option value="policy">Policies</option>
                <option value="procedure">Procedures</option>
                <option value="guideline">Guidelines</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
              >
                <option value="all">All Users</option>
                <option value="all">All Users</option>
                <option value="employee">Employees</option>
                <option value="supervisor">Supervisors</option>
                <option value="admin">Admins</option>
                <option value="both">Employees & Supervisors</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="p-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Rules & Regulations</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {Math.min(filteredRules.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredRules.length)} of {filteredRules.length} rules
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('title')}>
                        Title
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      User Access
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('created_at')}>
                        Created
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRules.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No rules found. Try adjusting your filters or create a new rule.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{rule.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {rule.description?.substring(0, 60)}...
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={rule.rule_type} />
                        </td>
                        <td className="px-4 py-3">
                          <UserTypeBadge userType={rule.user_type} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={rule.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(rule.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewRule(rule)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditRule(rule)}
                              className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                              title="Edit Rule"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule)}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Delete Rule"
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

      {/* Rule Modal (Create/Edit) */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRule ? 'Edit Rule' : 'Create New Rule'}
                </h3>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleRuleFormSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Title *
                    </label>
                    <input
                      type="text"
                      value={ruleForm.title}
                      onChange={(e) => setRuleForm({...ruleForm, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      minLength={3}
                      placeholder="Enter rule title (e.g., 'Attendance Policy')"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={ruleForm.description}
                      onChange={(e) => setRuleForm({...ruleForm, description: e.target.value})}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      placeholder="Enter detailed rule description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rule Type *
                      </label>
                      <select
                        value={ruleForm.rule_type}
                        onChange={(e) => setRuleForm({...ruleForm, rule_type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="rule">Rule</option>
                        <option value="regulation">Regulation</option>
                        <option value="policy">Policy</option>
                        <option value="procedure">Procedure</option>
                        <option value="guideline">Guideline</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visible To *
                      </label>
                      <select
                        value={ruleForm.user_type}
                        onChange={(e) => setRuleForm({...ruleForm, user_type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="all">All Users</option>
                        <option value="employee">Employees Only</option>
                        <option value="supervisor">Supervisors Only</option>
                        <option value="admin">Admins Only</option>
                        <option value="both">Employees & Supervisors</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={ruleForm.status}
                        onChange={(e) => setRuleForm({...ruleForm, status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving...' : (selectedRule ? 'Update Rule' : 'Create Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Rule Modal */}
      {showViewModal && viewRule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Rule Details</h3>
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
                {/* Rule Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{viewRule.title}</h4>
                    <div className="flex items-center gap-2 mb-4">
                      <TypeBadge type={viewRule.rule_type} />
                      <UserTypeBadge userType={viewRule.user_type} />
                      <StatusBadge status={viewRule.status} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h5 className="text-sm font-medium text-gray-700">Description</h5>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewRule.description}</p>
                </div>

                {/* Rule Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type Details */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h5 className="text-sm font-medium text-blue-700">Rule Type</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={viewRule.rule_type} />
                      <span className="text-sm text-blue-900 capitalize">
                        {viewRule.rule_type}
                      </span>
                    </div>
                  </div>

                  {/* Access Details */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <h5 className="text-sm font-medium text-green-700">Visible To</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserTypeBadge userType={viewRule.user_type} />
                      <span className="text-sm text-green-900">
                        {viewRule.user_type === 'all' && 'All Users'}
                        {viewRule.user_type === 'employee' && 'Employees Only'}
                        {viewRule.user_type === 'supervisor' && 'Supervisors Only'}
                        {viewRule.user_type === 'admin' && 'Admins Only'}
                        {viewRule.user_type === 'both' && 'Employees & Supervisors'}
                        {viewRule.user_type === 'employee_supervisor' && 'Employees & Supervisors'}
                      </span>
                    </div>
                  </div>

                  {/* Status Details */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <h5 className="text-sm font-medium text-yellow-700">Status</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={viewRule.status} />
                      <span className="text-sm text-yellow-900 capitalize">
                        {viewRule.status}
                      </span>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h5 className="text-sm font-medium text-purple-700">Created At</h5>
                    </div>
                    <p className="text-sm font-semibold text-purple-900">
                      {new Date(viewRule.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {new Date(viewRule.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Updated Date */}
                  {viewRule.updated_at && (
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-teal-600" />
                        <h5 className="text-sm font-medium text-teal-700">Last Updated</h5>
                      </div>
                      <p className="text-sm font-semibold text-teal-900">
                        {new Date(viewRule.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-teal-600 mt-1">
                        {new Date(viewRule.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
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
                  handleEditRule(viewRule);
                }}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                Edit Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ruleToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Delete Rule</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete <strong>{ruleToDelete.title}</strong>?
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
                onClick={confirmDeleteRule}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all"
              >
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}