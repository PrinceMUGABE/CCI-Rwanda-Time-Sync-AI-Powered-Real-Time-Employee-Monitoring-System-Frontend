import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Award,
  LayoutDashboard,
  Users,
  BookOpen,
  Bot,
  BarChart3,
  UserCog,
  MessageSquare,
  GraduationCap,
  Target,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Globe,
  HelpCircle,
  Plus,
  Search,
  Star,
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Activity,
  ListTodo,
  ShieldCheck,
  BellRing,
  Timer,
  Coffee,
  LogIn,
  Briefcase,
  Home,
  TrendingUp,
  XCircle,
  CalendarDays,
  ClipboardCheck
} from "lucide-react";
import { toast } from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationIntervalRef = useRef(null);

  // Helper function to get notification icon
  const getNotificationIcon = (notification) => {
    const { notification_type, priority } = notification;
    
    switch (notification_type) {
      case 'task_end_reminder':
        return <Timer className="h-5 w-5 text-yellow-500" />;
      case 'upcoming_task_alert':
        return <ListTodo className="h-5 w-5 text-blue-500" />;
      case 'task_missed_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'break_start_reminder':
      case 'break_end_reminder':
        return <Coffee className="h-5 w-5 text-green-500" />;
      case 'break_missed':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'break_extended':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'shift_start_reminder':
        return <Briefcase className="h-5 w-5 text-indigo-500" />;
      case 'shift_end_reminder':
        return <Home className="h-5 w-5 text-indigo-500" />;
      case 'performance_alert':
        return <TrendingUp className="h-5 w-5 text-teal-500" />;
      case 'system_alert':
        return <ShieldCheck className="h-5 w-5 text-gray-500" />;
      case 'login_reminder':
        return <LogIn className="h-5 w-5 text-blue-500" />;
      case 'logout_reminder':
        return <LogOut className="h-5 w-5 text-red-500" />;
      default:
        return <BellRing className="h-5 w-5 text-gray-400" />;
    }
  };

  // Helper function to get notification priority color
  const getNotificationPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get notification type label
  const getNotificationTypeLabel = (type) => {
    const labels = {
      'task_end_reminder': 'Task Ending',
      'upcoming_task_alert': 'Upcoming Task',
      'task_missed_alert': 'Task Missed',
      'break_start_reminder': 'Break Start',
      'break_end_reminder': 'Break End',
      'break_missed': 'Break Missed',
      'break_extended': 'Break Extended',
      'shift_start_reminder': 'Shift Start',
      'shift_end_reminder': 'Shift End',
      'performance_alert': 'Performance',
      'system_alert': 'System',
      'login_reminder': 'Login',
      'logout_reminder': 'Logout'
    };
    return labels[type] || 'Notification';
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const token = localStorage.getItem('access_token');
      if (!token || !user) return;

      const response = await fetch('http://127.0.0.1:8000/notification/my-notifications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        const previousNotifications = JSON.parse(localStorage.getItem('last_notifications') || '[]');
        const previousIds = previousNotifications.map(n => n.id);
        
        // Find truly new notifications (not in previous fetch)
        const brandNewNotifications = newNotifications.filter(
          notification => !previousIds.includes(notification.id)
        );
        
        // Show toast for new notifications (no modal for admin)
        brandNewNotifications.forEach(notification => {
          if (!notification.is_read) {
            toast.custom((t) => (
              <div className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getNotificationPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getNotificationTypeLabel(notification.notification_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ), {
              duration: 5000, // Shorter duration for admin
              position: 'top-right',
            });
          }
        });
        
        // Store current notifications for next comparison
        localStorage.setItem('last_notifications', JSON.stringify(newNotifications));
        setNotifications(newNotifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/notification/${notificationId}/mark-read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/notification/mark-all-read/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
        
        toast.success(data.message || 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/notification/${notificationId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId);
          return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
        });
        
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Initial fetch and interval setup
  useEffect(() => {
    // Fetch immediately
    fetchNotifications();
    
    // Set up interval for checking new notifications every minute (60,000ms)
    notificationIntervalRef.current = setInterval(fetchNotifications, 60000);
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(notificationIntervalRef.current);
    };
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "User Management", path: "/admin/users" },
    { icon: Calendar, label: "Shifts & Breaks", path: "/admin/shifts" },
    { icon: ClipboardCheck, label: "Tasks", path: "/admin/tasks" },
    { icon: GraduationCap, label: "Task Assignments", path: "/admin/task-assignments" },
    { icon: Users, label: "Shift Change Requests", path: "/admin/shift-change-requests" },
    { icon: BookOpen, label: "Rules Management", path: "/admin/rules-and-regulations" },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
  ];

  const quickActions = [
    { label: 'Shifts & Breaks', icon: <Plus className="w-4 h-4" />, onClick: () => navigate('/admin/shifts?action=create-shift') },
    { label: 'Manage Users', icon: <Users className="w-4 h-4" />, onClick: () => navigate('/admin/users') },
    { label: 'View Reports', icon: <FileText className="w-4 h-4" />, onClick: () => navigate('/admin/reports') },
  ];

  // Filter unread notifications
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-40 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-semibold text-gray-900">Admin Portal</span>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Shield className="w-3 h-3" />
                  <span>Administrator</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {action.icon}
                <span className="hidden lg:inline">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell - NO MODAL, ONLY DROPDOWN */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title={`${unreadCount} unread notifications`}
              >
                <BellRing className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-gray-50">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Admin Notifications</h3>
                        <p className="text-xs text-gray-500">
                          {unreadCount} unread • {notifications.length} total
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                        <p className="text-xs text-gray-400 mt-1">System notifications will appear here</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {/* Unread Notifications */}
                        {unreadNotifications.length > 0 && (
                          <div className="pb-2">
                            <div className="px-4 py-2 bg-blue-50/50">
                              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide flex items-center gap-1">
                                <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                                Unread ({unreadNotifications.length})
                              </span>
                            </div>
                            {unreadNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className="px-4 py-3 hover:bg-blue-50/30 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/20 to-transparent transition-all duration-200"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 pt-1">
                                    {getNotificationIcon(notification)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {notification.title}
                                      </p>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getNotificationPriorityColor(notification.priority)}`}>
                                        {notification.priority}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {notification.message}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">
                                          {notification.time_ago}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-blue-600 font-medium">
                                          {getNotificationTypeLabel(notification.notification_type)}
                                        </span>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => markNotificationAsRead(notification.id)}
                                          className="text-xs font-medium text-green-600 hover:text-green-800 flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                                        >
                                          <Check className="h-3 w-3" />
                                          Mark read
                                        </button>
                                        <button
                                          onClick={() => deleteNotification(notification.id)}
                                          className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                        >
                                          <XCircle className="h-3 w-3" />
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Read Notifications */}
                        {readNotifications.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50/50">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-gray-400" />
                                Read ({readNotifications.length})
                              </span>
                            </div>
                            {readNotifications.slice(0, 5).map((notification) => (
                              <div
                                key={notification.id}
                                className="px-4 py-3 hover:bg-gray-50 border-l-4 border-gray-300 transition-colors duration-200"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 pt-1 opacity-60">
                                    {getNotificationIcon(notification)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900 line-through opacity-60">
                                        {notification.title}
                                      </p>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getNotificationPriorityColor(notification.priority)} opacity-50`}>
                                        {notification.priority}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 line-through opacity-60">
                                      {notification.message}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-400">
                                          {notification.time_ago}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-400">
                                          {getNotificationTypeLabel(notification.notification_type)}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                      >
                                        <XCircle className="h-3 w-3" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {readNotifications.length > 5 && (
                              <div className="px-4 py-2 text-center border-t">
                                <span className="text-xs text-gray-500">
                                  {readNotifications.length - 5} more read notifications
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t px-4 py-3 bg-gray-50">
                    <button
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate('/admin/notifications');
                      }}
                      className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 hover:bg-blue-50 py-2 rounded transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Profile Picture or Initial */}
                {user?.avatar ? (
                  <img
                    src={`data:image/jpeg;base64,${user.avatar}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center ring-2 ring-blue-100">
                    <span className="text-white font-semibold text-sm">
                      {user?.names?.charAt(0) || user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium">{user?.names || user?.name || 'Admin'}</div>
                  <div className="text-xs text-gray-500">{user?.work_mail_address || user?.email || ''}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-gray-50">
                    <div className="flex items-center gap-3">
                      {/* Profile Picture in Dropdown */}
                      {user?.avatar ? (
                        <img
                          src={`data:image/jpeg;base64,${user.avatar}`}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user?.names?.charAt(0) || user?.name?.charAt(0) || 'A'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">{user?.names || user?.name || 'Admin'}</div>
                        <div className="text-xs text-gray-500">{user?.work_mail_address || user?.email || ''}</div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700">
                          <Shield className="w-3 h-3" />
                          Administrator
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/admin/profile");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                    >
                      <UserCog className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      // onClick={() => {
                      //   setIsDropdownOpen(false);
                      //   navigate("/admin/notifications");
                      // }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {/* <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/admin/chatbot");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help & Support
                    </button> */}
                  </div>

                  <div className="border-t my-1"></div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 
          bg-white border-r overflow-y-auto transition-transform duration-200 
          flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          {/* Navigation (top) */}
          <div className="flex-1">
            <nav className="p-4 space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 font-medium border-l-4 border-blue-500 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-200 hover:shadow-sm"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-sm">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Access (bottom – always pinned) */}
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-medium text-blue-900">
                  Admin Access
                </h3>
              </div>
              <p className="text-xs text-blue-700 mb-2">
                You have full system control. Manage users, shifts, tasks, and all system settings.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <BellRing className="w-3 h-3" />
                <span>System notifications enabled</span>
              </div>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}