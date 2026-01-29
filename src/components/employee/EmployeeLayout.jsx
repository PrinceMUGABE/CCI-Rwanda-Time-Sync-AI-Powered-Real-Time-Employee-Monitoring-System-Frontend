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

} from "lucide-react";
import { toast } from 'react-hot-toast';

export default function EmployeeLayout() {
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
  
    // Interval for checking new notifications
    useEffect(() => {
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token || !user) return;
  
          const response = await fetch('http://127.0.0.1:8000/notification/my-notifications/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (response.ok) {
            const data = await response.json();
            
            // Check for new notifications
            if (data.notifications && data.notifications.length > 0) {
              const previousNotifications = JSON.parse(localStorage.getItem('last_notifications') || '[]');
              const previousIds = previousNotifications.map(n => n.id);
              
              // Find new notifications
              const newNotifications = data.notifications.filter(
                notification => !previousIds.includes(notification.id) && !notification.is_read
              );
              
              // Show toast for new notifications
              newNotifications.forEach(notification => {
                toast(
                  (t) => (
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex">
                          <button
                            type="button"
                            className="rounded-md bg-white text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onClick={() => {
                              toast.dismiss(t.id);
                              setIsNotificationOpen(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="ml-3 rounded-md bg-white text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onClick={() => toast.dismiss(t.id)}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                  {
                    duration: 8000,
                    position: 'top-right',
                  }
                );
              });
              
              // Store current notifications for next comparison
              localStorage.setItem('last_notifications', JSON.stringify(data.notifications));
            }
            
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        } finally {
          setIsLoadingNotifications(false);
        }
      };
  
      // Fetch immediately on mount
      fetchNotifications();
      
      // Set up interval for checking new notifications every minute
      const intervalId = setInterval(fetchNotifications, 60000); // 1 minute
      
      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: "Performance", path: "/employee/dashboard" },
    { icon: GraduationCap, label: "Assigned Tasks", path: "/employee/task-assignments" },
    { icon: UserCog, label: "Shift Change Requests", path: "/employee/shift-change-requests" },
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
            <Link to="/employee" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-semibold text-gray-900">Employee Portal</span>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Shield className="w-3 h-3" />
                  <span>Employee</span>
                </div>
              </div>
            </Link>
          </div>


          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <p className="text-xs text-gray-500">
                        {unreadCount} unread • {notifications.length} total
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Mark all as read
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
                      </div>
                    ) : (
                      <div className="divide-y">
                        {/* Unread Notifications */}
                        {unreadNotifications.length > 0 && (
                          <div className="pb-2">
                            <div className="px-4 py-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Unread
                              </span>
                            </div>
                            {unreadNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className="px-4 py-3 hover:bg-gray-50 border-l-2 border-blue-500"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    {getNotificationIcon(notification)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900">
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
                                      <span className="text-xs text-gray-500">
                                        {notification.time_ago}
                                      </span>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => markNotificationAsRead(notification.id)}
                                          className="text-xs font-medium text-green-600 hover:text-green-800"
                                        >
                                          Mark as read
                                        </button>
                                        <button
                                          onClick={() => deleteNotification(notification.id)}
                                          className="text-xs font-medium text-red-600 hover:text-red-800"
                                        >
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
                            <div className="px-4 py-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Read
                              </span>
                            </div>
                            {readNotifications.slice(0, 5).map((notification) => (
                              <div
                                key={notification.id}
                                className="px-4 py-3 hover:bg-gray-50 opacity-75"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    {getNotificationIcon(notification)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900 line-through">
                                        {notification.title}
                                      </p>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getNotificationPriorityColor(notification.priority)} opacity-50`}>
                                        {notification.priority}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 line-through">
                                      {notification.message}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-xs text-gray-400">
                                        {notification.time_ago}
                                      </span>
                                      <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="text-xs font-medium text-red-600 hover:text-red-800"
                                      >
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
                        navigate('/employee/notifications');
                      }}
                      className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
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
                  <div className="text-sm font-medium">{user?.names || user?.name || 'Employee'}</div>
                  <div className="text-xs text-gray-500">{user?.work_mail_address || user?.email || ''}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <div className="px-4 py-3 border-b">
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
                            {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'A'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">{user?.names || user?.name || 'Employee'}</div>
                        <div className="text-xs text-gray-500">{user?.work_mail_address || user?.email || ''}</div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          <Shield className="w-3 h-3" />
                          Employee
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/employee/profile");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded"
                    >
                      <UserCog className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/employee/notifications");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded"
                    >
                      <Bell className="w-4 h-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                  </div>

                  <div className="border-t my-1"></div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-5 py-2 text-sm text-blue-600 hover:bg-blue-50"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 font-medium border-l-4 border-blue-500"
                        : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Employee Access (bottom – always pinned) */}
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-pink-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-medium text-blue-900">
                  Employee Access
                </h3>
              </div>
              <p className="text-xs text-blue-700">
                You have full system control. Manage programs, users, and all settings.
              </p>
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