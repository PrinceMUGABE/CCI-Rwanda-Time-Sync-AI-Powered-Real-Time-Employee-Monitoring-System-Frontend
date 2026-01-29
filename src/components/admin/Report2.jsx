import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Clock, Target, AlertOctagon, RefreshCw, 
  Activity, BarChart3, Calendar, Bell, Download,
  Loader2, AlertTriangle, CheckCircle, FileText,
  FileSpreadsheet, FileBarChart, ChevronRight,
  TrendingUp, TrendingDown, Eye, X, CalendarIcon,
  Building2, ClipboardList, UserCheck, UserX
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// API Service for Reports
const reportsAPI = {
  // Admin Reports
  async getAdminDashboard() {
    const response = await fetch('http://127.0.0.1:8000/report/admin/dashboard/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch admin dashboard');
    return await response.json();
  },

  async getUserAnalytics(days = 30) {
    const response = await fetch(`http://127.0.0.1:8000/report/admin/users/analytics/?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user analytics');
    return await response.json();
  },

  async getShiftReport() {
    const response = await fetch('http://127.0.0.1:8000/report/admin/shifts/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch shift report');
    return await response.json();
  },

  async getPerformanceReport(days = 7) {
    const response = await fetch(`http://127.0.0.1:8000/report/admin/performance/?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch performance report');
    return await response.json();
  },

  // Export functionality
  async exportToCSV(data, filename) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }
};

// Loading Component
const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <Activity className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
    <p className="text-gray-700 font-semibold mt-4">{text}</p>
  </div>
);

// Error Component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-6 h-6 text-red-600" />
    </div>
    <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Report</h3>
    <p className="text-red-700 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
      >
        Retry
      </button>
    )}
  </div>
);

// Report Card Component
const ReportCard = ({ title, icon: Icon, onClick, isActive, description, count }) => (
  <button
    onClick={onClick}
    className={`w-full bg-white rounded-xl border-2 transition-all duration-300 p-6 text-left hover:shadow-lg group ${
      isActive 
        ? 'border-blue-500 ring-4 ring-blue-100 shadow-lg' 
        : 'border-gray-200 hover:border-blue-300'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-3 rounded-xl transition-colors ${
            isActive 
              ? 'bg-blue-500' 
              : 'bg-gray-100 group-hover:bg-blue-50'
          }`}>
            <Icon className={`w-6 h-6 ${
              isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
            }`} />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${
              isActive ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            {count !== undefined && (
              <p className="text-sm text-gray-600">{count} records</p>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>
      <ChevronRight className={`w-5 h-5 transition-transform ${
        isActive ? 'text-blue-600 rotate-90' : 'text-gray-400 group-hover:translate-x-1'
      }`} />
    </div>
  </button>
);

// Metric Card Component
const MetricCard = ({ label, value, icon: Icon, color = 'blue', trend, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-rose-500 to-rose-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {trend && (
              <span className={`text-sm font-semibold ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Export Buttons Component
const ExportButtons = ({ onExport, isExporting, reportType }) => (
  <div className="flex gap-3">
    <button
      onClick={() => onExport('csv')}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileBarChart className="w-4 h-4" />
      )}
      Export CSV
    </button>
    <button
      onClick={() => onExport('json')}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      Export JSON
    </button>
  </div>
);

// Data Table Component
const DataTable = ({ data, type }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileBarChart className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const renderHeaders = () => {
    switch (type) {
      case 'shifts':
        return ['Shift Name', 'Start Time', 'End Time', 'Duration (hrs)', 'Users', 'Active Users', 'Breaks', "Today's Breaks"];
      case 'users_by_shift':
        return ['Shift', 'Total Users', 'Active Users'];
      case 'users_by_gender':
        return ['Gender', 'Count'];
      default:
        return Object.keys(data[0] || {});
    }
  };

  const renderCell = (item, header) => {
    switch (header) {
      case 'Shift Name':
        return item.shift_name || item.name;
      case 'Start Time':
        return item.start_time || item.start_at;
      case 'End Time':
        return item.end_time || item.end_at;
      case 'Duration (hrs)':
        return item.duration_hours?.toFixed(1) || '0';
      case 'Users':
        return item.users_count || item.user_count || 0;
      case 'Active Users':
        return item.active_users || 0;
      case 'Breaks':
        return item.breaks_count || 0;
      case "Today's Breaks":
        return item.todays_breaks || 0;
      case 'Shift':
        return item.name;
      case 'Total Users':
        return item.user_count || 0;
      case 'Gender':
        return item.gender?.charAt(0).toUpperCase() + item.gender?.slice(1) || 'Unknown';
      case 'Count':
        return item.count || 0;
      default:
        return item[header.toLowerCase().replace(/ /g, '_')] || 'N/A';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {renderHeaders().map((header, index) => (
              <th 
                key={index}
                className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              {renderHeaders().map((header, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderCell(item, header)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main Admin Reports Component
export default function AdminReports() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('dashboard');
  const [reportData, setReportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ days: 30 });

  // Available report types
  const reportTypes = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'System-wide statistics and key metrics',
      icon: Activity,
      fetchData: () => reportsAPI.getAdminDashboard()
    },
    {
      id: 'users',
      title: 'User Analytics',
      description: 'User distribution, registrations, and demographics',
      icon: Users,
      fetchData: () => reportsAPI.getUserAnalytics(dateRange.days)
    },
    {
      id: 'shifts',
      title: 'Shift Report',
      description: 'Shift schedules, assignments, and coverage',
      icon: Clock,
      fetchData: () => reportsAPI.getShiftReport()
    },
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Break compliance, task completion, and punctuality',
      icon: TrendingUp,
      fetchData: () => reportsAPI.getPerformanceReport(dateRange.days)
    }
  ];

  const fetchReportData = async (reportId) => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const report = reportTypes.find(r => r.id === reportId);
      if (!report) throw new Error('Invalid report type');

      console.log(`📊 Fetching ${report.title}...`);
      const data = await report.fetchData();
      
      console.log(`✅ ${report.title} loaded:`, data);
      setReportData(data);
      setSelectedReport(reportId);

    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message || 'Failed to load report');
      
      if (err.message.includes('401') || err.message.includes('403')) {
        setTimeout(() => logout(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData('dashboard');
  }, []);

  const handleExport = async (format) => {
    if (!reportData) return;
    
    setIsExporting(true);
    try {
      const reportType = reportTypes.find(r => r.id === selectedReport);
      const filename = `${reportType.title.replace(/ /g, '_')}_Report`;
      
      if (format === 'csv') {
        // Determine what data to export based on report type
        let exportData = [];
        
        if (selectedReport === 'shifts' && reportData.shifts) {
          exportData = reportData.shifts;
        } else if (selectedReport === 'users' && reportData.users_by_shift) {
          exportData = reportData.users_by_shift;
        } else if (selectedReport === 'performance') {
          exportData = [reportData.break_performance, reportData.task_performance];
        } else {
          exportData = [reportData];
        }
        
        await reportsAPI.exportToCSV(exportData, filename);
      } else if (format === 'json') {
        await reportsAPI.exportToJSON(reportData, filename);
      }
      
      console.log(`✅ Exported ${format.toUpperCase()}: ${filename}`);
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'dashboard':
        return renderDashboardReport();
      case 'users':
        return renderUsersReport();
      case 'shifts':
        return renderShiftsReport();
      case 'performance':
        return renderPerformanceReport();
      default:
        return null;
    }
  };

  const renderDashboardReport = () => {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const statusData = reportData.users?.by_status?.map(item => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count
    })) || [];

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Total Users"
            value={reportData.users?.total || 0}
            subtitle={`${reportData.users?.active || 0} active`}
            icon={Users}
            color="blue"
          />
          <MetricCard
            label="Active Shifts"
            value={reportData.shifts?.total || 0}
            subtitle={`${reportData.shifts?.average_users_per_shift?.toFixed(1) || 0} avg users/shift`}
            icon={Clock}
            color="green"
          />
          <MetricCard
            label="Today's Breaks"
            value={reportData.breaks?.today_scheduled || 0}
            subtitle={`${reportData.breaks?.completion_rate || 0}% completed`}
            icon={Calendar}
            color="purple"
          />
          <MetricCard
            label="Pending Requests"
            value={reportData.requests?.pending || 0}
            subtitle={`${reportData.requests?.today || 0} today`}
            icon={AlertOctagon}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">User Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Supervisors</span>
                <span className="text-2xl font-bold text-blue-600">{reportData.users?.supervisors || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Employees</span>
                <span className="text-2xl font-bold text-green-600">{reportData.users?.employees || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="text-gray-700 font-medium">Active Tasks</span>
                <span className="text-2xl font-bold text-purple-600">{reportData.tasks?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <span className="text-gray-700 font-medium">Notifications</span>
                <span className="text-2xl font-bold text-orange-600">{reportData.notifications?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersReport = () => {
    const shiftData = reportData.users_by_shift?.map(shift => ({
      name: shift.name,
      total: shift.user_count,
      active: shift.active_users
    })) || [];

    const genderData = reportData.users_by_gender?.map(item => ({
      name: item.gender.charAt(0).toUpperCase() + item.gender.slice(1),
      value: item.count
    })) || [];

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Total Users"
            value={reportData.total_users || 0}
            icon={Users}
            color="blue"
          />
          <MetricCard
            label="Recent Registrations"
            value={reportData.recent_registrations || 0}
            subtitle={`Last ${reportData.time_period || '30 days'}`}
            icon={UserCheck}
            color="green"
          />
          <MetricCard
            label="Active Today"
            value={reportData.active_today || 0}
            icon={Activity}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Shift</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shiftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total" radius={[8, 8, 0, 0]} />
                <Bar dataKey="active" fill="#10B981" name="Active" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">User Distribution by Shift</h3>
          </div>
          <DataTable data={reportData.users_by_shift || []} type="users_by_shift" />
        </div>
      </div>
    );
  };

  const renderShiftsReport = () => {
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Total Shifts"
            value={reportData.total_shifts || 0}
            icon={Clock}
            color="blue"
          />
          <MetricCard
            label="Avg Users/Shift"
            value={(reportData.shifts?.reduce((acc, s) => acc + s.users_count, 0) / reportData.shifts?.length || 0).toFixed(1)}
            icon={Users}
            color="green"
          />
          <MetricCard
            label="Total Breaks"
            value={reportData.shifts?.reduce((acc, s) => acc + s.breaks_count, 0) || 0}
            icon={Calendar}
            color="purple"
          />
        </div>

        {/* Shifts Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Shift Details</h3>
          </div>
          <DataTable data={reportData.shifts || []} type="shifts" />
        </div>
      </div>
    );
  };

  const renderPerformanceReport = () => {
    const breakData = reportData.break_performance;
    const taskData = reportData.task_performance;

    const performanceChartData = [
      {
        name: 'Breaks',
        total: breakData?.total || 0,
        completed: breakData?.completed || 0,
        missed: breakData?.missed || 0
      },
      {
        name: 'Tasks',
        total: taskData?.total || 0,
        completed: taskData?.completed || 0,
        missed: taskData?.missed || 0
      }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Break Completion"
            value={`${breakData?.completion_rate || 0}%`}
            subtitle={`${breakData?.completed || 0}/${breakData?.total || 0}`}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            label="Task Completion"
            value={`${taskData?.completion_rate || 0}%`}
            subtitle={`${taskData?.completed || 0}/${taskData?.total || 0}`}
            icon={Target}
            color="blue"
          />
          <MetricCard
            label="Punctuality Rate"
            value={`${breakData?.start_punctuality?.on_time_rate || 0}%`}
            subtitle="On-time starts"
            icon={TrendingUp}
            color="purple"
          />
          <MetricCard
            label="Extended Breaks"
            value={breakData?.extended || 0}
            subtitle={`${((breakData?.extended / breakData?.total) * 100 || 0).toFixed(1)}%`}
            icon={AlertOctagon}
            color="orange"
          />
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#94A3B8" name="Total" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="missed" fill="#EF4444" name="Missed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Break Punctuality</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">On Time</span>
                <span className="text-lg font-bold text-green-600">
                  {breakData?.start_punctuality?.on_time || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Late</span>
                <span className="text-lg font-bold text-red-600">
                  {breakData?.start_punctuality?.late || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Early</span>
                <span className="text-lg font-bold text-blue-600">
                  {breakData?.start_punctuality?.early || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Task Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Completed</span>
                <span className="text-lg font-bold text-green-600">
                  {taskData?.completed || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Active</span>
                <span className="text-lg font-bold text-blue-600">
                  {taskData?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Missed</span>
                <span className="text-lg font-bold text-red-600">
                  {taskData?.missed || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner text="Loading report data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-600">
                  Comprehensive reporting system for {user?.names || 'Admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {reportData && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Generated</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    {new Date(reportData.generated_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              )}
              <button
                onClick={() => fetchReportData(selectedReport)}
                className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Report Type</h2>
              <p className="text-sm text-gray-600 mt-1">Choose a report to view detailed analytics</p>
            </div>
            {reportData && (
              <ExportButtons 
                onExport={handleExport}
                isExporting={isExporting}
                reportType={selectedReport}
              />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => (
              <ReportCard
                key={report.id}
                title={report.title}
                description={report.description}
                icon={report.icon}
                onClick={() => fetchReportData(report.id)}
                isActive={selectedReport === report.id}
              />
            ))}
          </div>
        </div>

        {/* Time Range Selector (for applicable reports) */}
        {(selectedReport === 'users' || selectedReport === 'performance') && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Time Range</h3>
            <div className="flex gap-4">
              {[7, 14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setDateRange({ days });
                    fetchReportData(selectedReport);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange.days === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12">
            <LoadingSpinner text="Generating report..." />
          </div>
        ) : reportData ? (
          <div>
            {renderReportContent()}
          </div>
        ) : null}

        {/* Footer Info */}
        {reportData && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg mb-1">Report Information</h4>
                <p className="text-sm text-gray-300">
                  Generated on {new Date(reportData.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase mb-1">System User</p>
                <p className="text-sm font-semibold">{user?.names || 'Admin'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}