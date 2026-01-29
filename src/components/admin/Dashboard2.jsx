import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Clock, Target, Activity, AlertCircle, 
  CheckCircle, Calendar, BarChart3, TrendingDown, 
  UserCheck, UserX, Briefcase, Building2, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Filter, Eye, Layers,
  Award, Shield, Database, DollarSign, Percent,
  ChevronRight, Info
} from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
  ComposedChart
} from 'recharts';

// ==================== API Service ====================
const API_BASE_URL = 'http://127.0.0.1:8000/report';

const apiService = {
  async fetchWithAuth(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  },

  async fetchDashboardOverview(period = 'today') {
    return this.fetchWithAuth(`/dashboard/overview/?period=${period}`);
  },

  async fetchAttendanceReport(period = 'this_month') {
    return this.fetchWithAuth(`/reports/attendance/?period=${period}`);
  },

  async fetchBreakCompliance(period = 'this_month') {
    return this.fetchWithAuth(`/reports/break-compliance/?period=${period}`);
  },

  async fetchTaskCompletion(period = 'this_month') {
    return this.fetchWithAuth(`/reports/task-completion/?period=${period}`);
  },

  async fetchProductivityReport(period = 'this_month') {
    return this.fetchWithAuth(`/reports/productivity/?period=${period}`);
  }
};

// ==================== Custom Components ====================

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue', loading = false }) => {
  const colorVariants = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-emerald-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600', border: 'border-orange-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', border: 'border-red-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600', border: 'border-indigo-100' }
  };

  const colors = colorVariants[color];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border ${colors.border} hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${colors.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, actions, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="h-80 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-sm' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

const StatBadge = ({ label, value, color = 'gray' }) => {
  const colorVariants = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${colorVariants[color]}`}>
      <span className="font-semibold mr-1">{value}</span>
      <span>{label}</span>
    </div>
  );
};

// ==================== Main Dashboard Component ====================

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [dashboardData, setDashboardData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [breakData, setBreakData] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [productivityData, setProductivityData] = useState(null);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' }
  ];

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dashboard, attendance, breaks, tasks, productivity] = await Promise.all([
        apiService.fetchDashboardOverview(selectedPeriod),
        apiService.fetchAttendanceReport(selectedPeriod),
        apiService.fetchBreakCompliance(selectedPeriod),
        apiService.fetchTaskCompletion(selectedPeriod),
        apiService.fetchProductivityReport(selectedPeriod)
      ]);

      setDashboardData(dashboard);
      setAttendanceData(attendance);
      setBreakData(breaks);
      setTaskData(tasks);
      setProductivityData(productivity);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '0%';
    return `${Math.round(num)}%`;
  };

  // Prepare chart data
  const prepareAttendanceChartData = () => {
    if (!attendanceData?.user_statistics) return [];
    
    return attendanceData.user_statistics.slice(0, 10).map(stat => ({
      name: stat.user.names.split(' ')[0],
      'On Time': stat.on_time,
      'Late': stat.late,
      'Early': stat.early
    }));
  };

  const prepareBreakComplianceData = () => {
    if (!breakData?.user_statistics) return [];
    
    return [
      { name: 'Completed', value: breakData.user_statistics.reduce((sum, s) => sum + s.completed, 0), fill: '#10B981' },
      { name: 'Missed', value: breakData.user_statistics.reduce((sum, s) => sum + s.missed, 0), fill: '#EF4444' },
      { name: 'Extended', value: breakData.user_statistics.reduce((sum, s) => sum + s.extended, 0), fill: '#F59E0B' }
    ];
  };

  const prepareTaskCompletionData = () => {
    if (!taskData?.task_statistics) return [];
    
    return taskData.task_statistics.slice(0, 8).map(stat => ({
      name: stat.task.name.length > 20 ? stat.task.name.substring(0, 20) + '...' : stat.task.name,
      'Completed': stat.completed,
      'Active': stat.active,
      'Scheduled': stat.scheduled,
      'Missed': stat.missed
    }));
  };

  // Updated: Replace radar data with line chart data for productivity
  const prepareProductivityLineData = () => {
    if (!productivityData?.user_productivity) return [];
    
    return productivityData.user_productivity.slice(0, 5).map(stat => ({
      name: stat.user.names.split(' ')[0],
      attendance: stat.attendance_score,
      breaks: stat.break_compliance_score,
      tasks: stat.task_completion_score,
      overall: stat.overall_productivity_score
    }));
  };

  // Updated: Replace radar data with line chart data for performance metrics
  const preparePerformanceMetricsLineData = () => {
    if (!dashboardData?.performance_metrics) return [];
    
    const metrics = dashboardData.performance_metrics;
    return [
      { name: 'Attendance', score: metrics.attendance_rate || 0 },
      { name: 'Break Compliance', score: metrics.break_compliance_rate || 0 },
      { name: 'Task Completion', score: metrics.task_completion_rate || 0 }
    ];
  };

  // Updated: Prepare time-series data for trend analysis (example)
  const prepareTrendData = () => {
    // This is a mock function - you should replace with actual time-series data from your API
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      name: day,
      attendance: 85 + Math.random() * 15,
      productivity: 70 + Math.random() * 25,
      tasks: 75 + Math.random() * 20
    }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time workforce insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-8 py-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={formatNumber(dashboardData?.total_users)}
            subtitle={`${formatNumber(dashboardData?.attendance?.total_logins)} logins today`}
            icon={Users}
            color="blue"
            trend="up"
            trendValue="+12%"
            loading={loading}
          />
          
          <MetricCard
            title="Attendance Rate"
            value={formatPercent(dashboardData?.performance_metrics?.attendance_rate)}
            subtitle={`${formatNumber(dashboardData?.attendance?.on_time_logins)} on-time arrivals`}
            icon={UserCheck}
            color="green"
            trend="up"
            trendValue="+5.2%"
            loading={loading}
          />
          
          <MetricCard
            title="Task Completion"
            value={formatPercent(dashboardData?.performance_metrics?.task_completion_rate)}
            subtitle={`${formatNumber(dashboardData?.tasks?.completed_tasks)} tasks completed`}
            icon={Target}
            color="purple"
            trend="up"
            trendValue="+8.1%"
            loading={loading}
          />
          
          <MetricCard
            title="Break Compliance"
            value={formatPercent(dashboardData?.performance_metrics?.break_compliance_rate)}
            subtitle={`${formatNumber(dashboardData?.breaks?.on_time_breaks)} compliant breaks`}
            icon={Clock}
            color="orange"
            trend="down"
            trendValue="-2.3%"
            loading={loading}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white text-black bg-opacity-20 p-3 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-sm text-black font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Active Now
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {loading ? '...' : dashboardData?.performance_metrics?.active_users_today || 0}
            </h3>
            <p className="text-blue-100 text-sm">Users currently active</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 text-black rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-sm text-black font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                This {selectedPeriod}
              </span>
            </div>
            <h3 className="text-3xl text-white font-bold mb-1">
              {loading ? '...' : formatNumber(dashboardData?.tasks?.completed_tasks)}
            </h3>
            <p className="text-emerald-100 text-sm">Tasks successfully completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white text-black bg-opacity-20 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-black bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Trending
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {loading ? '...' : formatNumber(dashboardData?.shift_requests?.pending_requests)}
            </h3>
            <p className="text-purple-100 text-sm">Pending shift requests</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')}>
            Attendance
          </TabButton>
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
            Tasks
          </TabButton>
          <TabButton active={activeTab === 'productivity'} onClick={() => setActiveTab('productivity')}>
            Productivity
          </TabButton>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Metrics - Now using Line Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Performance Overview"
                subtitle="Key performance indicators across all metrics"
                loading={loading}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={preparePerformanceMetricsLineData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        domain={[0, 100]}
                        label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', offset: 10 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Break Compliance Breakdown"
                subtitle="Status distribution of employee breaks"
                loading={loading}
              >
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareBreakComplianceData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepareBreakComplianceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(value), 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {prepareBreakComplianceData().map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: item.fill }}>
                        {formatNumber(item.value)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{item.name}</div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Weekly Trends - New Line Chart */}
            <ChartCard
              title="Weekly Performance Trends"
              subtitle="Performance metrics over the past week"
              loading={loading}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(1)}%`, '']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="attendance" 
                      name="Attendance"
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivity" 
                      name="Productivity"
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasks" 
                      name="Task Completion"
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Attendance and Status Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Attendance Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Logins</span>
                    <span className="font-semibold text-gray-900">
                      {loading ? '...' : formatNumber(dashboardData?.attendance?.total_logins)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On Time</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.attendance?.on_time_logins)} 
                      label="logins" 
                      color="green" 
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Late</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.attendance?.late_logins)} 
                      label="logins" 
                      color="red" 
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Early</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.attendance?.early_logins)} 
                      label="logins" 
                      color="blue" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Break Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Breaks</span>
                    <span className="font-semibold text-gray-900">
                      {loading ? '...' : formatNumber(dashboardData?.breaks?.total_breaks)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.breaks?.completed_breaks)} 
                      label="breaks" 
                      color="green" 
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Missed</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.breaks?.missed_breaks)} 
                      label="breaks" 
                      color="red" 
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Extended</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.breaks?.extended_breaks)} 
                      label="breaks" 
                      color="orange" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Task Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Assignments</span>
                    <span className="font-semibold text-gray-900">
                      {loading ? '...' : formatNumber(dashboardData?.tasks?.total_assignments)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.tasks?.completed_tasks)} 
                      label="tasks" 
                      color="green" 
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.tasks?.active_tasks)} 
                      label="tasks" 
                      color="blue" 
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Missed</span>
                    <StatBadge 
                      value={loading ? '...' : formatNumber(dashboardData?.tasks?.missed_tasks)} 
                      label="tasks" 
                      color="red" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <ChartCard
            title="Top 10 Employee Attendance"
            subtitle="Punctuality breakdown by employee"
            loading={loading}
          >
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareAttendanceChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatNumber(value), '']}
                  />
                  <Legend />
                  <Bar dataKey="On Time" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Late" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Early" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <ChartCard
            title="Task Completion by Type"
            subtitle="Status breakdown across different task types"
            loading={loading}
          >
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={prepareTaskCompletionData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatNumber(value), '']}
                  />
                  <Legend />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Active" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Scheduled" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Missed" stroke="#EF4444" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Productivity Tab */}
        {activeTab === 'productivity' && (
          <div className="space-y-6">
            {/* Updated: Now using Line Chart instead of Radar Chart */}
            <ChartCard
              title="Top 5 Employee Productivity Scores"
              subtitle="Performance scores across different metrics"
              loading={loading}
            >
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareProductivityLineData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="attendance" 
                      name="Attendance"
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="breaks" 
                      name="Break Compliance"
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasks" 
                      name="Task Completion"
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="overall" 
                      name="Overall"
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Productivity Leaderboard */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Leaderboard</h3>
              <div className="space-y-3">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))
                ) : (
                  productivityData?.user_productivity?.slice(0, 10).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stat.user.names}</p>
                          <p className="text-xs text-gray-500">{stat.user.emp_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Attendance</p>
                          <p className="font-semibold text-gray-900">{stat.attendance_score.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Tasks</p>
                          <p className="font-semibold text-gray-900">{stat.task_completion_score.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Overall</p>
                          <p className="text-lg font-bold text-blue-600">{stat.overall_productivity_score.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Additional Line Chart for Time-based Productivity Trends */}
            <ChartCard
              title="Productivity Trends Over Time"
              subtitle="Weekly performance progression"
              loading={loading}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prepareTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="attendance" 
                      name="Attendance"
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tasks" 
                      name="Task Completion"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="productivity" 
                      name="Overall Productivity"
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        )}

        {/* Notifications Summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">System Activity</h3>
              <p className="text-sm text-gray-600">Recent notifications and alerts</p>
            </div>
            <Info className="w-5 h-5 text-indigo-600" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Notifications</span>
                <Database className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatNumber(dashboardData?.notifications?.total_notifications)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Unread</span>
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? '...' : formatNumber(dashboardData?.notifications?.unread_notifications)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Pending Requests</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? '...' : formatNumber(dashboardData?.shift_requests?.pending_requests)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Read</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatNumber(dashboardData?.notifications?.read_notifications)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">System Status: <span className="font-medium text-green-600">All Systems Operational</span></span>
            </div>
            <div className="text-gray-500">
              Last updated: {loading ? '...' : new Date(dashboardData?.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}