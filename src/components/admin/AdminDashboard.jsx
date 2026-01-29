import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, TrendingUp, Clock, AlertOctagon, RefreshCw, 
  Activity, BarChart3, PieChart, Calendar, Bell,
  ChevronRight, Loader2, AlertTriangle, CheckCircle,
  UserCheck, Target, Zap, TrendingDown, ArrowUpRight, ArrowDownRight,
  Shield, Settings, Database, Cpu, Wallet, Briefcase,
  FileText, CheckSquare, XCircle, AlertCircle, MoreVertical
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar
} from 'recharts';

// API Service
const apiService = {
  async fetchDashboardData() {
    const response = await fetch('http://127.0.0.1:8000/report/admin/dashboard/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    const data = await response.json();
    console.log('📊 Dashboard Data:', data.summary);
    return data;
  },

  async fetchUserAnalytics() {
    const response = await fetch('http://127.0.0.1:8000/report/admin/users/analytics/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch user analytics');
    const data = await response.json();
    console.log('📈 User Analytics:', data.summary);
    return data;
  },

  async fetchPerformanceData() {
    const response = await fetch('http://127.0.0.1:8000/report/admin/performance/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch performance data');
    const data = await response.json();
    console.log('🎯 Performance Data:', data.summary);
    return data;
  }
};

// Modern Metric Card Component
const StatCard = ({ title, value, icon: Icon, color, trend, change, description, onClick }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    purple: { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
    red: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
    cyan: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600' }
  };

  const { bg, light, text } = colorClasses[color];
  const isPositive = trend === 'up' || (change && change > 0);
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group ${onClick ? 'hover:border-gray-300' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${light} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${text}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
};

// Dashboard Card Wrapper
const DashboardCard = ({ title, subtitle, children, className, action }) => (
  <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Status Indicator
const StatusIndicator = ({ status, label, count }) => {
  const statusConfig = {
    active: { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    inactive: { color: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-50' },
    pending: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    completed: { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    scheduled: { color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' }
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}></div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {count}
      </span>
    </div>
  );
};

// Quick Stat Item
const QuickStat = ({ label, value, change }) => (
  <div className="text-center p-4">
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
    {change && (
      <div className={`text-xs mt-2 ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {change > 0 ? '+' : ''}{change}%
      </div>
    )}
  </div>
);

// Loading State
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Loading dashboard...</span>
      </div>
    </div>
  </div>
);

// Error State
const ErrorState = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="max-w-sm text-center">
      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-rose-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        <RefreshCw className="w-4 h-4 inline mr-2" />
        Retry
      </button>
    </div>
  </div>
);

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [timeframe, setTimeframe] = useState('today');

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dashboard, analytics, performance] = await Promise.all([
        apiService.fetchDashboardData(),
        apiService.fetchUserAnalytics(),
        apiService.fetchPerformanceData()
      ]);
      
      setDashboardData(dashboard);
      setUserAnalytics(analytics);
      setPerformanceData(performance);
      
      // Log summary data to console as requested
      console.log('📋 ADMIN DASHBOARD SUMMARY:');
      console.log('============================');
      console.log('👥 User Statistics:');
      console.log(`   Total Users: ${dashboard.summary.users?.total || 0}`);
      console.log(`   Active Users: ${dashboard.summary.users?.active || 0}`);
      console.log(`   Supervisors: ${dashboard.summary.users?.supervisors || 0}`);
      console.log(`   Employees: ${dashboard.summary.users?.employees || 0}`);
      console.log('');
      console.log('🔄 Shift Statistics:');
      console.log(`   Total Shifts: ${dashboard.summary.shifts?.total || 0}`);
      console.log(`   Avg Users/Shift: ${dashboard.summary.shifts?.average_users_per_shift || 0}`);
      console.log('');
      console.log('✅ Task Statistics:');
      console.log(`   Total Tasks: ${dashboard.summary.tasks?.total || 0}`);
      console.log(`   Active Tasks: ${dashboard.summary.tasks?.active || 0}`);
      console.log('');
      console.log('📊 Performance Summary:');
      console.log(`   Break Completion Rate: ${dashboard.summary.breaks?.completion_rate || 0}%`);
      console.log(`   Task Completion Rate: ${dashboard.summary.tasks?.completion_rate || 0}%`);
      console.log('');
      console.log('🔔 Notifications:');
      console.log(`   Unread: ${dashboard.summary.notifications?.unread || 0}`);
      console.log(`   Read Rate: ${dashboard.summary.notifications?.read_rate || 0}%`);
      console.log('============================');
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      if (err.message.includes('401') || err.message.includes('403')) {
        setTimeout(() => logout(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAllData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const prepareChartData = () => {
    if (!dashboardData || !userAnalytics || !performanceData) return {};

    // Users by shift data
    const usersByShift = userAnalytics?.summary?.users_by_shift?.map(shift => ({
      name: shift.name?.length > 10 ? `${shift.name.substring(0, 10)}...` : shift.name,
      users: shift.user_count || 0,
      active: shift.active_users || 0
    })) || [];

    // Gender distribution data
    const genderData = userAnalytics?.summary?.users_by_gender?.map(gender => ({
      name: gender.gender?.charAt(0).toUpperCase() + gender.gender?.slice(1) || 'Unknown',
      value: gender.count || 0
    })) || [];

    // Performance trend data
    const performanceTrend = [
      { day: 'Mon', breaks: 85, tasks: 78 },
      { day: 'Tue', breaks: 88, tasks: 82 },
      { day: 'Wed', breaks: 90, tasks: 85 },
      { day: 'Thu', breaks: 87, tasks: 80 },
      { day: 'Fri', breaks: 92, tasks: 88 },
      { day: 'Sat', breaks: 75, tasks: 70 },
      { day: 'Sun', breaks: 70, tasks: 65 }
    ];

    // Status distribution
    const statusDistribution = dashboardData?.summary?.users?.by_status?.map(status => ({
      name: status.status?.charAt(0).toUpperCase() + status.status?.slice(1) || 'Unknown',
      value: status.count || 0
    })) || [];

    // Activity metrics
    const activityMetrics = [
      { name: 'Logins', value: userAnalytics?.summary?.active_today || 0 },
      { name: 'Breaks', value: dashboardData?.summary?.breaks?.today_completed || 0 },
      { name: 'Tasks', value: dashboardData?.summary?.tasks?.active || 0 },
      { name: 'Requests', value: dashboardData?.summary?.requests?.today || 0 }
    ];

    return {
      usersByShift,
      genderData,
      performanceTrend,
      statusDistribution,
      activityMetrics
    };
  };

  const chartData = prepareChartData();
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchAllData} />;
  if (!dashboardData) return <ErrorState message="No data available" onRetry={fetchAllData} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, <span className="font-medium">{user?.names || 'Admin'}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(dashboardData.summary?.generated_at || new Date()).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              
              <button
                onClick={fetchAllData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="relative">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={dashboardData.summary?.users?.total || 0}
            icon={Users}
            color="blue"
            description={`${dashboardData.summary?.users?.active || 0} active`}
            change={2.3}
          />
          
          <StatCard
            title="Active Tasks"
            value={dashboardData.summary?.tasks?.active || 0}
            icon={Target}
            color="green"
            description={`${dashboardData.summary?.tasks?.total || 0} total`}
            change={5.7}
          />
          
          <StatCard
            title="Today's Breaks"
            value={dashboardData.summary?.breaks?.today_scheduled || 0}
            icon={Clock}
            color="purple"
            description={`${dashboardData.summary?.breaks?.completion_rate || 0}% completed`}
            change={-1.2}
          />
          
          <StatCard
            title="Pending Requests"
            value={dashboardData.summary?.requests?.pending || 0}
            icon={AlertOctagon}
            color="orange"
            description={`${dashboardData.summary?.requests?.today || 0} today`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution by Shift */}
          <DashboardCard
            title="Users by Shift"
            subtitle="Distribution across active shifts"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.usersByShift}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="users" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    name="Total Users"
                  />
                  <Bar 
                    dataKey="active" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Active Users"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Performance Overview */}
          <DashboardCard
            title="Weekly Performance"
            subtitle="Break and task completion trends"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="breaks" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Break %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Task %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Status Distribution */}
          <DashboardCard
            title="User Status"
            subtitle="Current distribution"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={chartData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chartData.statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">{status.name}</span>
                  <span className="text-sm font-medium text-gray-900 ml-auto">{status.value}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Activity Metrics */}
          <DashboardCard
            title="Today's Activity"
            subtitle="Real-time metrics"
          >
            <div className="space-y-4">
              {chartData.activityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {index === 0 && <UserCheck className="w-4 h-4 text-gray-600" />}
                      {index === 1 && <Clock className="w-4 h-4 text-gray-600" />}
                      {index === 2 && <Target className="w-4 h-4 text-gray-600" />}
                      {index === 3 && <Bell className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                      <p className="text-xs text-gray-500">Today's count</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* System Status */}
          <DashboardCard
            title="System Status"
            subtitle="All systems operational"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-800">Database</span>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-800">API Services</span>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-800">Authentication</span>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-800">Notifications</span>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <DashboardCard title="Quick Stats">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <QuickStat 
                label="Supervisors" 
                value={dashboardData.summary?.users?.supervisors || 0}
                change={3.2}
              />
              <QuickStat 
                label="Employees" 
                value={dashboardData.summary?.users?.employees || 0}
                change={1.8}
              />
              <QuickStat 
                label="Avg Salary" 
                value={`$${userAnalytics?.summary?.average_salary?.toFixed(0) || '0'}`}
              />
              <QuickStat 
                label="Active Today" 
                value={userAnalytics?.summary?.active_today || 0}
                change={5.4}
              />
            </div>
          </DashboardCard>

          {/* Recent Registrations */}
          <DashboardCard 
            title="Recent Activity"
            subtitle={`${userAnalytics?.summary?.recent_registrations || 0} new users this month`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">New Registrations</span>
                <span className="font-medium text-gray-900">{userAnalytics?.summary?.recent_registrations || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg Daily Logins</span>
                <span className="font-medium text-gray-900">
                  {Math.round((userAnalytics?.summary?.active_today || 0) / 7)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Task Completion</span>
                <span className="font-medium text-gray-900">
                  {dashboardData.summary?.tasks?.completion_rate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Break Compliance</span>
                <span className="font-medium text-gray-900">
                  {dashboardData.summary?.breaks?.completion_rate || 0}%
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Notifications Summary */}
          <DashboardCard 
            title="Notifications"
            subtitle={`${dashboardData.summary?.notifications?.unread || 0} unread`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Unread</p>
                    <p className="text-xs text-gray-500">Requires attention</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {dashboardData.summary?.notifications?.unread || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Read Rate</p>
                    <p className="text-xs text-gray-500">Overall engagement</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {dashboardData.summary?.notifications?.read_rate || 0}%
                </span>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Notifications</span>
                  <span className="font-medium text-gray-900">
                    {dashboardData.summary?.notifications?.total || 0}
                  </span>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              <p>Data last updated: {new Date(dashboardData.summary?.generated_at || new Date()).toLocaleString()}</p>
              <p className="mt-1">System ID: {user?.emp_number || 'ADMIN'}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">Powered by</span>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">EMS v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}