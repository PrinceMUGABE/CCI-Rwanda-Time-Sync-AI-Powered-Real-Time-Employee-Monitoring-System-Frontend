import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, TrendingUp, Clock, AlertOctagon, RefreshCw, 
  Activity, BarChart3, PieChart, Calendar, Bell,
  ChevronRight, Loader2, AlertTriangle, CheckCircle,
  Target, Zap, TrendingDown, ArrowUpRight, ArrowDownRight,
  Shield, Settings, Database, Cpu, Wallet, Briefcase,
  FileText, CheckSquare, XCircle, AlertCircle, MoreVertical,
  Award, Star, BarChart2, Eye, Filter, Download,
  LogIn, LogOut, Coffee, CheckCheck, CalendarDays,
  Clock3, Target as TargetIcon, TrendingUp as TrendingUpIcon,
  Percent, Award as AwardIcon, Activity as ActivityIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar
} from 'recharts';

// API Service for Employee
const apiService = {
  async fetchEmployeeDashboard() {
    const response = await fetch('http://127.0.0.1:8000/report/employee/dashboard/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch employee dashboard data');
    const data = await response.json();
    console.log('📊 Employee Dashboard Data:', data.summary);
    return data;
  },

  async fetchEmployeeBreakSchedule(date) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    
    const response = await fetch(`http://127.0.0.1:8000/report/employee/breaks/?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch break schedule');
    const data = await response.json();
    console.log('⏰ Employee Break Schedule:', data.summary);
    return data;
  },

  async fetchEmployeeTaskSchedule(date) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    
    const response = await fetch(`http://127.0.0.1:8000/report/employee/tasks/?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch task schedule');
    const data = await response.json();
    console.log('✅ Employee Task Schedule:', data.summary);
    return data;
  },

  async fetchEmployeeActivityLog(days = 7) {
    const params = new URLSearchParams({ days });
    
    const response = await fetch(`http://127.0.0.1:8000/report/employee/activities/?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch activity log');
    const data = await response.json();
    console.log('📝 Employee Activity Log:', data.summary);
    return data;
  }
};

// Modern Metric Card Component for Employee
const EmployeeStatCard = ({ title, value, icon: Icon, color, trend, change, description, onClick }) => {
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

// Task Status Badge
const TaskStatusBadge = ({ status }) => {
  switch(status?.toLowerCase()) {
    case 'completed':
      return (
        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
          Completed
        </span>
      );
    case 'in_progress':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          In Progress
        </span>
      );
    case 'pending':
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          Pending
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

// Break Status Badge
const BreakStatusBadge = ({ status }) => {
  switch(status?.toLowerCase()) {
    case 'completed':
      return (
        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
          Completed
        </span>
      );
    case 'in_progress':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          On Break
        </span>
      );
    case 'missed':
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full">
          Missed
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

// Task Card Component
const TaskCard = ({ task, index }) => {
  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrent = task.status?.toLowerCase() === 'in_progress';
  const isUpcoming = task.status?.toLowerCase() === 'pending';
  
  return (
    <div className={`bg-white border ${isCurrent ? 'border-blue-200 bg-blue-50/30' : isUpcoming ? 'border-yellow-200' : 'border-gray-200'} rounded-xl p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            {task.task_name || 'Task'}
            {task.priority === 'high' && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                High Priority
              </span>
            )}
          </h4>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-gray-600">
              <Clock3 className="w-3 h-3 inline mr-1" />
              {formatTime(task.start_time)} - {formatTime(task.end_time)}
            </span>
            {task.actual_start_time && (
              <span className="text-sm text-gray-600">
                <Clock className="w-3 h-3 inline mr-1" />
                Started: {formatTime(task.actual_start_time)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TaskStatusBadge status={task.status} />
          {isCurrent && (
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Mark Complete
            </button>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mt-2">
        Assigned on: {task.assignment_date ? new Date(task.assignment_date).toLocaleDateString() : 'N/A'}
      </div>
      
      {task.notes && (
        <div className="text-sm text-gray-500 mt-2 italic">
          "{task.notes}"
        </div>
      )}
    </div>
  );
};

// Break Card Component
const BreakCard = ({ breakItem, index }) => {
  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBreakIcon = (breakName) => {
    if (breakName?.toLowerCase().includes('lunch')) return '🍽️';
    if (breakName?.toLowerCase().includes('coffee')) return '☕';
    if (breakName?.toLowerCase().includes('tea')) return '🍵';
    return '⏸️';
  };

  const isActive = breakItem.status?.toLowerCase() === 'in_progress';
  const isScheduled = breakItem.status?.toLowerCase() === 'scheduled';
  
  return (
    <div className={`bg-white border ${isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} rounded-xl p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getBreakIcon(breakItem.break_name)}</div>
          <div>
            <h4 className="font-semibold text-gray-900">{breakItem.break_name || 'Break'}</h4>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-600">
                <Clock3 className="w-3 h-3 inline mr-1" />
                {formatTime(breakItem.scheduled_start)} - {formatTime(breakItem.scheduled_end)}
              </span>
              {breakItem.actual_start && (
                <span className="text-sm text-gray-600">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Started: {formatTime(breakItem.actual_start)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <BreakStatusBadge status={breakItem.status} />
          {isScheduled && (
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Start Break
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {breakItem.start_punctuality && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            breakItem.start_punctuality === 'on_time' ? 'bg-emerald-100 text-emerald-800' :
            breakItem.start_punctuality === 'early' ? 'bg-blue-100 text-blue-800' :
            'bg-rose-100 text-rose-800'
          }`}>
            {breakItem.start_punctuality === 'on_time' ? 'On Time' :
             breakItem.start_punctuality === 'early' ? 'Early' : 'Late'}
          </span>
        )}
        
        {breakItem.duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {breakItem.duration} min
          </span>
        )}
      </div>
    </div>
  );
};

// Loading State
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Loading employee dashboard...</span>
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

// Main Employee Dashboard Component
export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [breakSchedule, setBreakSchedule] = useState(null);
  const [taskSchedule, setTaskSchedule] = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState('overview'); // overview, tasks, breaks, activity
  
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dashboard, breaks, tasks, activities] = await Promise.all([
        apiService.fetchEmployeeDashboard(),
        apiService.fetchEmployeeBreakSchedule(selectedDate),
        apiService.fetchEmployeeTaskSchedule(selectedDate),
        apiService.fetchEmployeeActivityLog(7)
      ]);
      
      setDashboardData(dashboard);
      setBreakSchedule(breaks);
      setTaskSchedule(tasks);
      setActivityLog(activities);
      
      // Log summary data to console
      console.log('📋 EMPLOYEE DASHBOARD SUMMARY:');
      console.log('============================');
      console.log('👤 Employee Information:');
      console.log(`   Name: ${dashboard.summary?.employee_name || user?.names}`);
      console.log(`   Employee ID: ${dashboard.summary?.employee_number || user?.emp_number}`);
      console.log(`   Shift: ${dashboard.summary?.shift || 'Not assigned'}`);
      console.log(`   Day Off: ${dashboard.summary?.day_off || 'Not set'}`);
      console.log('');
      console.log('📊 Today\'s Performance:');
      console.log(`   Break Completion: ${dashboard.summary?.today_summary?.break_completion_rate || 0}%`);
      console.log(`   Task Completion: ${dashboard.summary?.today_summary?.task_completion_rate || 0}%`);
      console.log(`   Breaks Scheduled: ${breaks.summary?.total_breaks || 0}`);
      console.log(`   Breaks Completed: ${breaks.summary?.completed_breaks || 0}`);
      console.log('');
      console.log('✅ Tasks Today:');
      console.log(`   Total Tasks: ${tasks.summary?.total_tasks || 0}`);
      console.log(`   Completed: ${tasks.summary?.completed_tasks || 0}`);
      console.log(`   In Progress: ${tasks.summary?.active_tasks || 0}`);
      console.log('');
      console.log('📝 Recent Activity:');
      console.log(`   Total Activities: ${activities.summary?.activity_summary?.total_activities || 0}`);
      console.log(`   Logins: ${activities.summary?.activity_summary?.logins || 0}`);
      console.log(`   Logouts: ${activities.summary?.activity_summary?.logouts || 0}`);
      console.log('============================');
      
    } catch (err) {
      console.error('Error fetching employee dashboard data:', err);
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
    if (!dashboardData || !taskSchedule || !breakSchedule) return {};

    // Performance comparison for the week (simulated)
    const weeklyPerformance = [
      { day: 'Mon', breakRate: 85, taskRate: 90, attendance: 100 },
      { day: 'Tue', breakRate: 90, taskRate: 85, attendance: 100 },
      { day: 'Wed', breakRate: 75, taskRate: 88, attendance: 100 },
      { day: 'Thu', breakRate: 95, taskRate: 92, attendance: 100 },
      { day: 'Fri', breakRate: 80, taskRate: 87, attendance: 100 },
      { day: 'Sat', breakRate: 70, taskRate: 75, attendance: 100 },
      { day: 'Sun', breakRate: 65, taskRate: 70, attendance: 100 }
    ];

    // Task completion breakdown
    const taskBreakdown = [
      { name: 'Completed', value: taskSchedule.summary?.completed_tasks || 0 },
      { name: 'In Progress', value: taskSchedule.summary?.active_tasks || 0 },
      { name: 'Pending', value: taskSchedule.summary?.upcoming_tasks || 0 }
    ];

    // Break completion breakdown
    const breakBreakdown = [
      { name: 'Completed', value: breakSchedule.summary?.completed_breaks || 0 },
      { name: 'Scheduled', value: (breakSchedule.summary?.total_breaks || 0) - (breakSchedule.summary?.completed_breaks || 0) }
    ];

    // Today's activity breakdown
    const todayActivity = {
      tasks: taskSchedule.summary?.total_tasks || 0,
      completedTasks: taskSchedule.summary?.completed_tasks || 0,
      breaks: breakSchedule.summary?.total_breaks || 0,
      completedBreaks: breakSchedule.summary?.completed_breaks || 0
    };

    return {
      weeklyPerformance,
      taskBreakdown,
      breakBreakdown,
      todayActivity
    };
  };

  const chartData = prepareChartData();
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchAllData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">My Performance Dashboard</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    Employee ID: <span className="font-semibold">{dashboardData.summary?.employee_number || user?.emp_number}</span>
                  </span>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    Shift: <span className="font-semibold">{dashboardData.summary?.shift || 'Not assigned'}</span>
                  </span>
                  {dashboardData.summary?.day_off && (
                    <>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        Day Off: <span className="font-semibold">{dashboardData.summary.day_off}</span>
                      </span>
                    </>
                  )}
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
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('tasks')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'tasks' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveView('breaks')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'breaks' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Breaks
                </button>
                <button
                  onClick={() => setActiveView('activity')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'activity' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Activity
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
              <EmployeeStatCard
                title="Today's Tasks"
                value={chartData.todayActivity.tasks}
                icon={CheckSquare}
                color="blue"
                description={`${chartData.todayActivity.completedTasks} completed`}
                onClick={() => setActiveView('tasks')}
              />
              
              <EmployeeStatCard
                title="Today's Breaks"
                value={chartData.todayActivity.breaks}
                icon={Coffee}
                color="green"
                description={`${chartData.todayActivity.completedBreaks} completed`}
                onClick={() => setActiveView('breaks')}
              />
              
              <EmployeeStatCard
                title="Task Completion"
                value={`${dashboardData.summary?.today_summary?.task_completion_rate || 0}%`}
                icon={TargetIcon}
                color="purple"
                description="Today's rate"
                change={5.2}
              />
              
              <EmployeeStatCard
                title="Break Completion"
                value={`${dashboardData.summary?.today_summary?.break_completion_rate || 0}%`}
                icon={Clock}
                color="orange"
                description="Today's rate"
                change={3.8}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Weekly Performance */}
              <DashboardCard
                title="Weekly Performance"
                subtitle="Break vs Task completion rates"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.weeklyPerformance}>
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
                        formatter={(value) => [`${value}%`, 'Completion Rate']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="breakRate" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Break %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="taskRate" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Task %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Task Breakdown */}
              <DashboardCard
                title="Task Status Distribution"
                subtitle="Today's task completion overview"
              >
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={chartData.taskBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.taskBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} tasks`, 'Count']}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>
            </div>

            {/* Upcoming Tasks & Breaks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Tasks */}
              <DashboardCard
                title="Upcoming Tasks"
                subtitle="Next tasks to complete"
                action={
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All
                  </button>
                }
              >
                <div className="space-y-4">
                  {taskSchedule.summary?.task_schedule?.slice(0, 3).map((task, index) => (
                    <TaskCard 
                      key={task.id || index}
                      task={task}
                      index={index}
                    />
                  ))}
                  {(!taskSchedule.summary?.task_schedule || taskSchedule.summary.task_schedule.length === 0) && (
                    <div className="text-center py-6">
                      <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No tasks scheduled for today</p>
                    </div>
                  )}
                </div>
              </DashboardCard>

              {/* Upcoming Breaks */}
              <DashboardCard
                title="Upcoming Breaks"
                subtitle="Today's break schedule"
                action={
                  <button className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                    View All
                  </button>
                }
              >
                <div className="space-y-4">
                  {breakSchedule.summary?.break_schedule?.slice(0, 3).map((breakItem, index) => (
                    <BreakCard 
                      key={breakItem.id || index}
                      breakItem={breakItem}
                      index={index}
                    />
                  ))}
                  {(!breakSchedule.summary?.break_schedule || breakSchedule.summary.break_schedule.length === 0) && (
                    <div className="text-center py-6">
                      <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No breaks scheduled for today</p>
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>

            {/* Notifications & Updates */}
            <DashboardCard
              title="Notifications & Updates"
              subtitle="Latest system notifications"
              className="mt-6"
            >
              <div className="space-y-3">
                {dashboardData.summary?.notifications && dashboardData.summary.notifications.length > 0 ? (
                  dashboardData.summary.notifications.slice(0, 5).map((notification, index) => (
                    <div key={notification.id || index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${notification.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                        <Bell className={`w-4 h-4 ${notification.is_read ? 'text-gray-500' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No notifications</p>
                  </div>
                )}
              </div>
            </DashboardCard>
          </>
        )}

        {/* Tasks View */}
        {activeView === 'tasks' && taskSchedule && (
          <div className="space-y-6">
            <DashboardCard
              title={`My Tasks - ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
              subtitle={`${taskSchedule.summary?.completed_tasks || 0} completed • ${taskSchedule.summary?.active_tasks || 0} in progress • ${taskSchedule.summary?.upcoming_tasks || 0} pending`}
              action={
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    <Download className="w-4 h-4 inline mr-1" />
                    Export
                  </button>
                  <button className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                    <CheckCheck className="w-4 h-4 inline mr-1" />
                    Complete All
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                {taskSchedule.summary?.task_schedule?.map((task, index) => (
                  <TaskCard 
                    key={task.id || index}
                    task={task}
                    index={index}
                  />
                ))}
                
                {(!taskSchedule.summary?.task_schedule || taskSchedule.summary.task_schedule.length === 0) && (
                  <div className="text-center py-12">
                    <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks for today</h3>
                    <p className="text-gray-600">You have no tasks scheduled for today. Enjoy your day!</p>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Task Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardCard title="Task Completion Rate">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {dashboardData.summary?.today_summary?.task_completion_rate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Today's completion rate
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Tasks by Priority">
                <div className="space-y-3 py-4">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">High Priority</span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {taskSchedule.summary?.task_schedule?.filter(t => t.priority === 'high').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600">Medium Priority</span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {taskSchedule.summary?.task_schedule?.filter(t => t.priority === 'medium').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Low Priority</span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {taskSchedule.summary?.task_schedule?.filter(t => t.priority === 'low').length || 0}
                    </span>
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Task Timeline">
                <div className="space-y-2 py-4">
                  {taskSchedule.summary?.task_schedule?.slice(0, 3).map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{task.task_name}</span>
                      <span className="text-gray-900 font-medium">
                        {task.start_time ? new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        )}

        {/* Breaks View */}
        {activeView === 'breaks' && breakSchedule && (
          <div className="space-y-6">
            <DashboardCard
              title={`My Break Schedule - ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
              subtitle={`${breakSchedule.summary?.completed_breaks || 0} completed • ${breakSchedule.summary?.total_breaks || 0} total breaks`}
            >
              <div className="space-y-4">
                {breakSchedule.summary?.break_schedule?.map((breakItem, index) => (
                  <BreakCard 
                    key={breakItem.id || index}
                    breakItem={breakItem}
                    index={index}
                  />
                ))}
                
                {(!breakSchedule.summary?.break_schedule || breakSchedule.summary.break_schedule.length === 0) && (
                  <div className="text-center py-12">
                    <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No breaks scheduled</h3>
                    <p className="text-gray-600">You have no breaks scheduled for today.</p>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Break Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardCard title="Break Completion Rate">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {dashboardData.summary?.today_summary?.break_completion_rate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Today's completion rate
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Punctuality Score">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {breakSchedule.summary?.break_schedule?.filter(b => b.start_punctuality === 'on_time').length / 
                     Math.max(1, breakSchedule.summary?.break_schedule?.length) * 100 || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    On-time break starts
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Break Types">
                <div className="space-y-3 py-4">
                  {Array.from(new Set(breakSchedule.summary?.break_schedule?.map(b => b.break_name))).slice(0, 3).map((breakType, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{breakType}</span>
                      <span className="text-gray-900 font-medium">
                        {breakSchedule.summary?.break_schedule?.filter(b => b.break_name === breakType).length || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        )}

        {/* Activity View */}
        {activeView === 'activity' && activityLog && (
          <div className="space-y-6">
            <DashboardCard
              title="My Activity Log"
              subtitle={`Last 7 days • ${activityLog.summary?.activity_summary?.total_activities || 0} total activities`}
            >
              <div className="space-y-3">
                {activityLog.summary?.activity_details?.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      activity.log_type === 'login' ? 'bg-blue-100' :
                      activity.log_type === 'logout' ? 'bg-gray-100' :
                      'bg-emerald-100'
                    }`}>
                      {activity.log_type === 'login' ? (
                        <LogIn className="w-4 h-4 text-blue-600" />
                      ) : activity.log_type === 'logout' ? (
                        <LogOut className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ActivityIcon className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">{activity.activity}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.actual_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {activity.log_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.actual_time).toLocaleDateString()}
                        </span>
                        {activity.status && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activity.status === 'on_time' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!activityLog.summary?.activity_details || activityLog.summary.activity_details.length === 0) && (
                  <div className="text-center py-12">
                    <ActivityIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity recorded</h3>
                    <p className="text-gray-600">No activity data available for the selected period.</p>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Activity Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <DashboardCard title="Total Logins">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {activityLog.summary?.activity_summary?.logins || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last 7 days
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Total Logouts">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {activityLog.summary?.activity_summary?.logouts || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last 7 days
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Break Activities">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {activityLog.summary?.activity_summary?.break_starts || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Break starts & ends
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Other Activities">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {activityLog.summary?.activity_summary?.other_activities || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    System activities
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}