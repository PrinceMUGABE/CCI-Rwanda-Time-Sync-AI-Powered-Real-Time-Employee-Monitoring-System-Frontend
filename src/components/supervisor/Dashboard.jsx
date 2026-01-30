import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, TrendingUp, Clock, AlertOctagon, RefreshCw,
  Activity, BarChart3, PieChart, Calendar, Bell,
  ChevronRight, Loader2, AlertTriangle, CheckCircle,
  UserCheck, Target, Zap, TrendingDown, ArrowUpRight, ArrowDownRight,
  Shield, Settings, Database, Cpu, Wallet, Briefcase,
  FileText, CheckSquare, XCircle, AlertCircle, MoreVertical,
  Award, Star, BarChart2, Eye, Filter, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar
} from 'recharts';

// API Service
const apiService = {
  async fetchDashboardData() {
    const response = await fetch('http://127.0.0.1:8000/report/supervisor/dashboard/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    const data = await response.json();
    console.log('📊 Supervisor Dashboard Data:', data.summary);
    return data;
  },

  async fetchTeamPerformance() {
    const response = await fetch('http://127.0.0.1:8000/report/supervisor/team/performance/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch team performance data');
    const data = await response.json();
    console.log('📈 Team Performance Data:', data.summary);
    return data;
  },

  async fetchTeamAttendance(date) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const response = await fetch(`http://127.0.0.1:8000/report/supervisor/attendance/?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch team attendance');
    const data = await response.json();
    console.log('✅ Team Attendance Data:', data.summary);
    return data;
  },

  async fetchSupervisedUsers() {
    const response = await fetch('http://127.0.0.1:8000/users/supervised/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch supervised users');
    const data = await response.json();
    console.log('👥 Supervised Users:', data.users?.length || 0, 'users');
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

// Employee Performance Card
const EmployeePerformanceCard = ({ employee, index }) => {
  const breakRate = employee.break_performance?.completion_rate || 0;
  const taskRate = employee.task_performance?.completion_rate || 0;
  const attendanceRate = employee.attendance?.attendance_rate || 0;

  const getPerformanceColor = (rate) => {
    if (rate >= 90) return 'text-emerald-600 bg-emerald-50';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getPerformanceLabel = (rate) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Good';
    if (rate >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {employee.employee_name?.charAt(0) || 'E'}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{employee.employee_name}</h4>
            <p className="text-sm text-gray-500">{employee.employee_number}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getPerformanceColor((breakRate + taskRate + attendanceRate) / 3)}`}>
          {getPerformanceLabel((breakRate + taskRate + attendanceRate) / 3)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{breakRate}%</div>
          <div className="text-xs text-gray-500">Breaks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{taskRate}%</div>
          <div className="text-xs text-gray-500">Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{attendanceRate}%</div>
          <div className="text-xs text-gray-500">Attendance</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        {employee.shift ? `Shift: ${employee.shift}` : 'No shift assigned'}
      </div>
    </div>
  );
};

// Attendance Status Badge
const AttendanceStatusBadge = ({ status, isDayOff }) => {
  if (isDayOff) {
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
        Day Off
      </span>
    );
  }

  switch (status) {
    case 'Present':
      return (
        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
          Present
        </span>
      );
    case 'Absent':
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full">
          Absent
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
          {status}
        </span>
      );
  }
};

// Loading State
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Loading supervisor dashboard...</span>
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

// Main Supervisor Dashboard Component
export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [teamAttendance, setTeamAttendance] = useState(null);
  const [supervisedUsers, setSupervisedUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState('overview'); // overview, performance, attendance

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboard, performance, attendance, users] = await Promise.all([
        apiService.fetchDashboardData(),
        apiService.fetchTeamPerformance(),
        apiService.fetchTeamAttendance(selectedDate),
        apiService.fetchSupervisedUsers()
      ]);

      setDashboardData(dashboard);
      setTeamPerformance(performance);
      setTeamAttendance(attendance);
      setSupervisedUsers(users.users || []);

      // Log summary data to console
      console.log('📋 SUPERVISOR DASHBOARD SUMMARY:');
      console.log('============================');
      console.log('👥 Team Statistics:');
      console.log(`   Team Members: ${users.users?.length || 0}`);
      console.log(`   Today's Attendance: ${attendance.summary?.attendance_summary?.present || 0}/${attendance.summary?.attendance_summary?.total_users || 0}`);
      console.log(`   Attendance Rate: ${attendance.summary?.attendance_summary?.attendance_rate || 0}%`);
      console.log('');
      console.log('🎯 Team Performance:');
      console.log(`   Time Period: ${performance.summary?.time_period || 'Last 7 days'}`);
      console.log(`   Employees Tracked: ${performance.summary?.team_performance?.length || 0}`);
      console.log('');
      console.log('📊 Individual Performance Summary:');
      performance.summary?.team_performance?.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ${emp.employee_name}:`);
        console.log(`      Breaks: ${emp.break_performance?.completion_rate || 0}%`);
        console.log(`      Tasks: ${emp.task_performance?.completion_rate || 0}%`);
        console.log(`      Attendance: ${emp.attendance?.attendance_rate || 0}%`);
      });
      console.log('============================');

    } catch (err) {
      console.error('Error fetching supervisor dashboard data:', err);
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
  }, [selectedDate]);

  // Prepare chart data
  const prepareChartData = () => {
    if (!teamPerformance || !teamAttendance) return {};

    // Performance comparison chart
    const performanceComparison = teamPerformance.summary?.team_performance?.map(emp => ({
      name: emp.employee_name?.split(' ')[0] || 'Emp',
      breaks: emp.break_performance?.completion_rate || 0,
      tasks: emp.task_performance?.completion_rate || 0,
      attendance: emp.attendance?.attendance_rate || 0
    })) || [];

    // Attendance distribution
    const attendanceData = [
      { name: 'Present', value: teamAttendance.summary?.attendance_summary?.present || 0 },
      { name: 'Absent', value: teamAttendance.summary?.attendance_summary?.absent || 0 }
    ];

    // Performance trend (simulated)
    const performanceTrend = [
      { day: 'Mon', avgPerformance: 75 },
      { day: 'Tue', avgPerformance: 82 },
      { day: 'Wed', avgPerformance: 78 },
      { day: 'Thu', avgPerformance: 85 },
      { day: 'Fri', avgPerformance: 88 },
      { day: 'Sat', avgPerformance: 65 },
      { day: 'Sun', avgPerformance: 60 }
    ];

    // Today's activity breakdown
    const todayActivity = {
      logins: teamAttendance.detailed_data?.summary_by_log_type?.login || 0,
      logouts: teamAttendance.detailed_data?.summary_by_log_type?.logout || 0,
      breaks: (teamAttendance.detailed_data?.summary_by_log_type?.break_start || 0) +
        (teamAttendance.detailed_data?.summary_by_log_type?.break_end || 0),
      tasks: teamPerformance.summary?.team_performance?.reduce((acc, emp) =>
        acc + (emp.task_performance?.total || 0), 0) || 0
    };

    return {
      performanceComparison,
      attendanceData,
      performanceTrend,
      todayActivity
    };
  };

  const chartData = prepareChartData();
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];



  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchAllData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Team Supervisor Dashboard</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    Managing <span className="font-semibold">{supervisedUsers.length}</span> team members
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{user?.names || 'Supervisor'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm"
                />
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'overview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('performance')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'performance'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setActiveView('attendance')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'attendance'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Attendance
                </button>
              </div>

              <button
                onClick={fetchAllData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Overview View */}
        {activeView === 'overview' && (
          <>
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Team Members"
                value={supervisedUsers.length}
                icon={Users}
                color="blue"
                description={`${teamAttendance?.summary?.attendance_summary?.present || 0} present today`}
              />

              <StatCard
                title="Today's Attendance"
                value={`${teamAttendance?.summary?.attendance_summary?.attendance_rate || 0}%`}
                icon={UserCheck}
                color="green"
                description={`${teamAttendance?.summary?.attendance_summary?.present || 0} of ${teamAttendance?.summary?.attendance_summary?.total_users || 0} present`}
              />

              <StatCard
                title="Avg. Break Completion"
                value={(teamPerformance.summary?.team_performance?.reduce((acc, emp) =>
                  acc + (emp.break_performance?.completion_rate || 0), 0) /
                  Math.max(1, teamPerformance.summary?.team_performance?.length) || 0).toFixed(2) + '%'}
                icon={Clock}
                color="purple"
                description="Last 7 days average"
                change={2.3}
              />

              <StatCard
                title="Avg. Task Completion"
                value={teamPerformance.summary?.team_performance?.reduce((acc, emp) =>
                  acc + (emp.task_performance?.completion_rate || 0), 0) / Math.max(1, teamPerformance.summary?.team_performance?.length) || 0 + '%'}
                icon={Target}
                color="orange"
                description="Last 7 days average"
                change={1.8}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Team Performance Comparison */}
              <DashboardCard
                title="Team Performance Comparison"
                subtitle="Break vs Task vs Attendance rates"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.performanceComparison}>
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
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value}%`, 'Completion Rate']}
                      />
                      <Legend />
                      <Bar
                        dataKey="breaks"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Break %"
                      />
                      <Bar
                        dataKey="tasks"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name="Task %"
                      />
                      <Bar
                        dataKey="attendance"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Attendance %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Performance Trend */}
              <DashboardCard
                title="Weekly Performance Trend"
                subtitle="Average team performance over time"
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
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value}%`, 'Performance']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgPerformance"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Team Performance"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>
            </div>

            {/* Team Member Grid */}
            <DashboardCard
              title="Team Members"
              subtitle="Click on a team member to view detailed performance"
              action={
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamPerformance.summary?.team_performance?.slice(0, 6).map((employee, index) => (
                  <EmployeePerformanceCard
                    key={employee.employee_id || index}
                    employee={employee}
                    index={index}
                  />
                ))}
                {(!teamPerformance.summary?.team_performance || teamPerformance.summary.team_performance.length === 0) && (
                  <div className="col-span-3 text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No team performance data available</p>
                  </div>
                )}
              </div>
            </DashboardCard>
          </>
        )}

        {/* Performance View */}
        {activeView === 'performance' && teamPerformance && (
          <div className="space-y-6">
            <DashboardCard
              title="Detailed Team Performance"
              subtitle={teamPerformance.summary?.time_period || 'Last 7 days'}
              // action={
              //   <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              //     <Download className="w-4 h-4 inline mr-1" />
              //     Export Report
              //   </button>
              // }
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Shift
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Break Completion
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Task Completion
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Overall Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamPerformance.summary?.team_performance?.map((employee, index) => {
                      const breakRate = employee.break_performance?.completion_rate || 0;
                      const taskRate = employee.task_performance?.completion_rate || 0;
                      const attendanceRate = employee.attendance?.attendance_rate || 0;
                      const overallScore = (breakRate + taskRate + attendanceRate) / 3;

                      const getScoreColor = (score) => {
                        if (score >= 90) return 'text-emerald-700 bg-emerald-50';
                        if (score >= 70) return 'text-yellow-700 bg-yellow-50';
                        return 'text-rose-700 bg-rose-50';
                      };

                      return (
                        <tr key={employee.employee_id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {employee.employee_name?.charAt(0) || 'E'}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                                <div className="text-xs text-gray-500">{employee.employee_number}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{employee.shift || 'Not Assigned'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${breakRate}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getScoreColor(breakRate)} px-2 py-1 rounded-full`}>
                                {breakRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-emerald-600 h-2 rounded-full"
                                  style={{ width: `${taskRate}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getScoreColor(taskRate)} px-2 py-1 rounded-full`}>
                                {taskRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${attendanceRate}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getScoreColor(attendanceRate)} px-2 py-1 rounded-full`}>
                                {attendanceRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-lg font-bold ${getScoreColor(overallScore)} px-3 py-1 rounded-full`}>
                              {overallScore.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {(!teamPerformance.summary?.team_performance || teamPerformance.summary.team_performance.length === 0) && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <BarChart2 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No performance data available for your team</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DashboardCard title="Break Performance Distribution">
                <div className="space-y-3">
                  {teamPerformance.summary?.team_performance?.slice(0, 5).map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate">{emp.employee_name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${emp.break_performance?.completion_rate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {emp.break_performance?.completion_rate || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Task Performance Distribution">
                <div className="space-y-3">
                  {teamPerformance.summary?.team_performance?.slice(0, 5).map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate">{emp.employee_name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${emp.task_performance?.completion_rate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {emp.task_performance?.completion_rate || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Top Performers">
                <div className="space-y-4">
                  {[...(teamPerformance.summary?.team_performance || [])]
                    .sort((a, b) => {
                      const scoreA = (a.break_performance?.completion_rate || 0) +
                        (a.task_performance?.completion_rate || 0) +
                        (a.attendance?.attendance_rate || 0);
                      const scoreB = (b.break_performance?.completion_rate || 0) +
                        (b.task_performance?.completion_rate || 0) +
                        (b.attendance?.attendance_rate || 0);
                      return scoreB - scoreA;
                    })
                    .slice(0, 3)
                    .map((emp, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                            idx === 1 ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                          }`}>
                          <span className="font-bold">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{emp.employee_name}</div>
                          <div className="text-xs text-gray-500">Overall Score: {(
                            (emp.break_performance?.completion_rate || 0) +
                            (emp.task_performance?.completion_rate || 0) +
                            (emp.attendance?.attendance_rate || 0)
                          ) / 3}%</div>
                        </div>
                        <Award className={`w-5 h-5 ${idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-500' :
                              'text-orange-500'
                          }`} />
                      </div>
                    ))}
                </div>
              </DashboardCard>
            </div>

          </div>
        )}

        {/* Attendance View */}
        {activeView === 'attendance' && teamAttendance && (
          <div className="space-y-6">
            <DashboardCard
              title={`Attendance Report - ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
              subtitle={`${teamAttendance.summary?.attendance_summary?.present || 0} present, ${teamAttendance.summary?.attendance_summary?.absent || 0} absent`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Shift
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        First Login
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Last Logout
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Hours Worked
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamAttendance.summary?.attendance_details?.map((employee, index) => (
                      <tr key={employee.user_id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {employee.employee_name?.charAt(0) || 'E'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                              <div className="text-xs text-gray-500">{employee.employee_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{employee.shift || 'Not Assigned'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {employee.first_login_time ?
                              new Date(employee.first_login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                              '--:--'
                            }
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {employee.last_logout_time ?
                              new Date(employee.last_logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                              '--:--'
                            }
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {employee.hours_worked ? `${employee.hours_worked.toFixed(1)}h` : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceStatusBadge
                            status={employee.status}
                            isDayOff={employee.is_day_off}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <Eye className="w-4 h-4 inline mr-1" />
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}

                    {(!teamAttendance.summary?.attendance_details || teamAttendance.summary.attendance_details.length === 0) && (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No attendance data available for selected date</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard title="Attendance Rate">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {teamAttendance.summary?.attendance_summary?.attendance_rate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {teamAttendance.summary?.attendance_summary?.present || 0} of {teamAttendance.summary?.attendance_summary?.total_users || 0} team members
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Day Off Status">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {teamAttendance.summary?.attendance_details?.filter(e => e.is_day_off).length || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Team members on day off
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Average Hours">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {teamAttendance.summary?.attendance_details?.reduce((acc, emp) =>
                      acc + (emp.hours_worked || 0), 0) / Math.max(1, teamAttendance.summary?.attendance_details?.filter(e => e.hours_worked).length) || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Average hours worked
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Activity Today">
                <div className="space-y-2 py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Logins</span>
                    <span className="font-medium text-gray-900">{chartData.todayActivity.logins}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Logouts</span>
                    <span className="font-medium text-gray-900">{chartData.todayActivity.logouts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Breaks</span>
                    <span className="font-medium text-gray-900">{chartData.todayActivity.breaks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tasks</span>
                    <span className="font-medium text-gray-900">{chartData.todayActivity.tasks}</span>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>
        )}


        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              <p>Data as of {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="mt-1">Supervisor ID: {user?.emp_number || 'SUP'}</p>
            </div>

            <div className="text-sm text-gray-500">
              <p>Team Management Dashboard • EMS Supervisor v2.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}