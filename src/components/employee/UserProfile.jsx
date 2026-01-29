import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Phone, User, Save, Edit, Camera, X,
  Calendar, Clock, CheckCircle, AlertCircle,
  TrendingUp, TrendingDown, Bell, Filter,
  LogIn, LogOut, Coffee, Briefcase, BarChart,
  UserCircle, Settings, Activity, Lock
} from 'lucide-react';

// Base URL configuration
const BASE_URL = 'http://127.0.0.1:8000';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md animate-fade-in`}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    </div>
  );
};

// Performance Card Component
const PerformanceCard = ({ title, value, icon, trend, color, onClick }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer ${onClick ? 'hover:scale-[1.02] transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

// Log Item Component
const LogItem = ({ log, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'on_time': return 'bg-green-100 text-green-800';
      case 'early': return 'bg-blue-100 text-blue-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'very_late': return 'bg-red-100 text-red-800';
      case 'day_off': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'login': return <LogIn className="size-4" />;
      case 'logout': return <LogOut className="size-4" />;
      case 'break_start': return <Coffee className="size-4" />;
      case 'break_end': return <Coffee className="size-4" />;
      case 'shift_start': return <Briefcase className="size-4" />;
      case 'shift_end': return <Briefcase className="size-4" />;
      default: return <Clock className="size-4" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
      onClick={() => onClick(log)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getLogIcon(log.log_type)}
          <span className="font-medium text-gray-900 capitalize">
            {log.log_type.replace('_', ' ')}
          </span>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
          {log.status.replace('_', ' ')}
        </span>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {log.activity}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="size-3" />
          {new Date(log.actual_time).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          {formatTime(log.actual_time)}
        </div>
      </div>
      {log.time_difference_minutes && (
        <div className={`mt-2 text-xs ${Math.abs(log.time_difference_minutes) > 5 ? 'text-red-600' : 'text-green-600'}`}>
          {log.time_difference_minutes > 0 ?
            `${log.time_difference_minutes.toFixed(0)} minutes late` :
            `${Math.abs(log.time_difference_minutes).toFixed(0)} minutes early`
          }
        </div>
      )}
    </div>
  );
};

// BreakLogItem component with this fixed version
const BreakLogItem = ({ breakLog, onStartBreak, onEndBreak }) => {
  const now = new Date();
  const scheduledStart = new Date(breakLog.scheduled_start);
  const scheduledEnd = new Date(breakLog.scheduled_end);
  const actualStart = breakLog.actual_start ? new Date(breakLog.actual_start) : null;
  const actualEnd = breakLog.actual_end ? new Date(breakLog.actual_end) : null;
  
  const canStart = now >= scheduledStart && breakLog.status === 'scheduled';
  const canEnd = breakLog.status === 'started';

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'started': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'extended': return 'bg-purple-100 text-purple-800';
      case 'shortened': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPunctualityColor = (punctuality) => {
    switch (punctuality) {
      case 'on_time': return 'text-green-600';
      case 'early': return 'text-blue-600';
      case 'very_early': return 'text-blue-800';
      case 'late': return 'text-yellow-600';
      case 'very_late': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diffMs = Math.abs(end - start);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Safely check if deviation exists and is a number
  const hasDeviation = breakLog.start_deviation_minutes !== null && 
                      breakLog.start_deviation_minutes !== undefined &&
                      typeof breakLog.start_deviation_minutes === 'number';

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coffee className="size-4 text-blue-600" />
          <div>
            <span className="font-medium text-gray-900">{breakLog.break_name}</span>
            <div className="text-xs text-gray-500">{formatDate(scheduledStart)}</div>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(breakLog.status)}`}>
          {breakLog.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Scheduled</div>
          <div className="text-sm font-medium">
            {formatTime(scheduledStart)} - {formatTime(scheduledEnd)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Duration: {calculateDuration(scheduledStart, scheduledEnd)}
          </div>
        </div>
        {(actualStart || actualEnd) && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Actual</div>
            <div className="text-sm font-medium">
              {formatTime(actualStart)} - {formatTime(actualEnd)}
            </div>
            {actualStart && actualEnd && (
              <div className="text-xs text-gray-500 mt-1">
                Duration: {calculateDuration(actualStart, actualEnd)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Punctuality Display */}
      <div className="mb-3">
        {breakLog.start_punctuality && (
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Start Punctuality:</span>
            <span className={`font-medium ${getPunctualityColor(breakLog.start_punctuality)}`}>
              {breakLog.start_punctuality?.replace('_', ' ') || 'N/A'}
            </span>
          </div>
        )}
        {breakLog.end_punctuality && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">End Punctuality:</span>
            <span className={`font-medium ${getPunctualityColor(breakLog.end_punctuality)}`}>
              {breakLog.end_punctuality?.replace('_', ' ') || 'N/A'}
            </span>
          </div>
        )}
        {hasDeviation && (
          <div className="text-xs text-gray-500 mt-1">
            Deviation: {breakLog.start_deviation_minutes > 0 ? '+' : ''}{breakLog.start_deviation_minutes.toFixed(0)} minutes
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canStart && (
          <button
            onClick={() => onStartBreak(breakLog.id)}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Coffee className="size-4" />
            Start Break
          </button>
        )}
        {canEnd && (
          <button
            onClick={() => onEndBreak(breakLog.id)}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <X className="size-4" />
            End Break
          </button>
        )}
      </div>
    </div>
  );
};

// Recommendation Modal Component
const RecommendationModal = ({ log, onClose }) => {
  const getRecommendations = (log) => {
    const recommendations = [];

    if (log.status === 'late' || log.status === 'very_late') {
      recommendations.push({
        title: 'Improve Punctuality',
        description: `Your ${log.log_type} was ${log.status}. Try to arrive/start ${log.time_difference_minutes > 0 ? Math.abs(log.time_difference_minutes) : 10} minutes earlier.`,
        priority: 'high',
        action: 'Set reminder 30 minutes before scheduled time'
      });
    }

    if (log.status === 'early') {
      recommendations.push({
        title: 'Optimize Timing',
        description: `Your ${log.log_type} was early by ${Math.abs(log.time_difference_minutes || 0)} minutes. Consider using this time for preparation.`,
        priority: 'medium',
        action: 'Review pre-shift checklist'
      });
    }

    if (log.log_type === 'break_end' && log.break_log) {
      const deviation = log.break_log.duration_deviation_minutes;
      if (deviation > 10) {
        recommendations.push({
          title: 'Monitor Break Duration',
          description: 'Your breaks are consistently longer than scheduled. Try setting a timer for breaks.',
          priority: 'medium',
          action: 'Use phone timer for break reminders'
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Good Performance',
        description: 'Your activity patterns are consistent and within expected ranges.',
        priority: 'low',
        action: 'Continue current practices'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations(log);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Performance Insights</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="size-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Analysis for {log.log_type.replace('_', ' ')} on {new Date(log.actual_time).toLocaleDateString()}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                    }`}>
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                        }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Suggested Action:</span>
                      <span className="text-sm font-medium text-blue-600">{rec.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-medium capitalize">{log.status.replace('_', ' ')}</div>
              </div>
              {log.time_difference_minutes && (
                <div>
                  <div className="text-sm text-gray-600">Time Difference</div>
                  <div className={`font-medium ${log.time_difference_minutes > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {log.time_difference_minutes > 0 ? '+' : ''}{log.time_difference_minutes.toFixed(0)} minutes
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Punctuality</div>
                <div className="font-medium capitalize">{log.punctuality_category?.replace('_', ' ') || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Activity</div>
                <div className="font-medium">{log.activity}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Detailed Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Webcam Capture Modal Component
const WebcamModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const usePhoto = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Take Profile Photo</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="size-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Position your face in the center and click capture</p>
        </div>

        <div className="p-6">
          {!capturedImage ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto rounded-lg bg-gray-900"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white border-dashed rounded-full w-64 h-64"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-auto rounded-lg max-h-96 object-contain"
              />
              <p className="text-sm text-gray-600 mt-4">Preview your photo</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between">
          {!capturedImage ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Camera className="size-4" />
                Capture Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Retake
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={usePhoto}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="size-4" />
                  Use This Photo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Password Change Component
const PasswordChangeTab = ({ onClose }) => {
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = () => {
    if (passwords.new_password !== passwords.new_password_confirm) {
      return 'New passwords do not match';
    }
    if (passwords.new_password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(passwords.new_password)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${BASE_URL}/change-password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwords)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswords({
          old_password: '',
          new_password: '',
          new_password_confirm: ''
        });
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-full">
            <Lock className="size-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
            <p className="text-gray-600">Update your account password</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="size-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="size-4" />
              <span className="text-sm">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="old_password"
              value={passwords.old_password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="new_password"
              value={passwords.new_password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="new_password_confirm"
              value={passwords.new_password_confirm}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Changing...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Password Security Tips</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Use a unique password for this account</li>
              <li>• Change your password every 90 days</li>
              <li>• Never share your password with anyone</li>
              <li>• Log out after each session</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ user, profileData, setProfileData, isEditing, setIsEditing, handleSaveProfile, handleImageUpload, setShowWebcam, loading, showToast }) => {
  const getGenderOptions = () => [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
                disabled={loading}
              >
                <Edit className="size-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setProfileData({
                        names: user.names || '',
                        email: user.email || '',
                        phone_number: user.phone_number || '',
                        gender: user.gender || '',
                        profile_picture_upload: null
                      });
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="size-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {user?.profile_picture ? (
                  <img
                    src={`data:image/jpeg;base64,${user.profile_picture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : profileData.profile_picture_upload ? (
                  <img
                    src={URL.createObjectURL(profileData.profile_picture_upload)}
                    alt="New profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <span className="text-white text-3xl font-semibold">
                      {user?.names?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <label className="cursor-pointer bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
                    <Camera className="size-5 text-gray-700" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <button
                    onClick={() => setShowWebcam(true)}
                    className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    <User className="size-5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>

            {isEditing && profileData.profile_picture_upload && (
              <div className="text-center">
                <p className="text-sm text-green-600 mb-2">
                  New profile picture selected
                </p>
                <button
                  onClick={() => setProfileData(prev => ({
                    ...prev,
                    profile_picture_upload: null
                  }))}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove selected image
                </button>
              </div>
            )}
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                value={profileData.names}
                onChange={(e) => setProfileData({ ...profileData, names: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="size-4" />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="size-4" />
                Phone Number
              </label>
              <input
                value={profileData.phone_number}
                onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                value={profileData.gender}
                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select gender</option>
                {getGenderOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Read-only Fields */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Employee Number</span>
                <span className="font-medium">{user?.emp_number || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <span className="font-medium capitalize">{user?.role || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Work Shift</span>
                <span className="font-medium capitalize">{user?.current_shift_name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ performanceStats, breakLogs, handleStartBreak, handleEndBreak }) => {
  return (
    <div className="space-y-6">
      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PerformanceCard
          title="On Time Rate"
          value={`${performanceStats.onTimePercentage.toFixed(1)}%`}
          icon={<CheckCircle className="size-6 text-green-600" />}
          trend={performanceStats.onTimePercentage >= 80 ? 'up' : 'down'}
          color="bg-green-100"
        />
        <PerformanceCard
          title="Early Arrivals"
          value={`${performanceStats.earlyPercentage.toFixed(1)}%`}
          icon={<TrendingUp className="size-6 text-blue-600" />}
          trend="up"
          color="bg-blue-100"
        />
        <PerformanceCard
          title="Late Arrivals"
          value={`${performanceStats.latePercentage.toFixed(1)}%`}
          icon={<TrendingDown className="size-6 text-red-600" />}
          trend={performanceStats.latePercentage <= 10 ? 'down' : 'up'}
          color="bg-red-100"
        />
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Punctuality Score</span>
              <span className="font-bold text-lg">
                {performanceStats.averagePunctuality.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${performanceStats.averagePunctuality >= 80 ? 'bg-green-500' :
                    performanceStats.averagePunctuality >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                  }`}
                style={{ width: `${performanceStats.averagePunctuality}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {performanceStats.onTimePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">On Time</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {performanceStats.latePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <div className="text-sm text-gray-600 mb-1">Total Activities Logged</div>
            <div className="text-3xl font-bold text-blue-600">
              {performanceStats.totalLogs}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Breaks */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Today's Break Schedule</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Coffee className="size-5" />
            <span>Manage your breaks</span>
          </div>
        </div>

        {breakLogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breakLogs.map((breakLog) => (
              <BreakLogItem
                key={breakLog.id}
                breakLog={breakLog}
                onStartBreak={handleStartBreak}
                onEndBreak={handleEndBreak}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Coffee className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No break schedule for today</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Activity Logs Tab Component
const ActivityLogsTab = ({ logs, filters, setFilters, loadingLogs, selectedLog, setSelectedLog }) => {
  const [logsPerPage, setLogsPerPage] = useState(2);

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      logType: '',
      status: ''
    });
  };

  const displayedLogs = logs.slice(0, logsPerPage);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Activity Logs</h3>
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-gray-500" />
            <span className="text-sm text-gray-600">Filters</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={filters.logType}
              onChange={(e) => setFilters(prev => ({ ...prev, logType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="break_start">Break Start</option>
              <option value="break_end">Break End</option>
              <option value="shift_start">Shift Start</option>
              <option value="shift_end">Shift End</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="early">Early</option>
              <option value="on_time">On Time</option>
              <option value="late">Late</option>
              <option value="very_late">Very Late</option>
              <option value="day_off">Day Off</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="size-4" />
            Clear Filters
          </button>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {Math.min(logsPerPage, logs.length)} of {logs.length} logs
            </div>
            <select
              value={logsPerPage}
              onChange={(e) => setLogsPerPage(Number(e.target.value))}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 logs</option>
              <option value={10}>10 logs</option>
              <option value={30}>30 logs</option>
              <option value={50}>50 logs</option>
              <option value={100}>100 logs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
          <div className="text-sm text-gray-600">
            {displayedLogs.length} activities shown
          </div>
        </div>
        {loadingLogs ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading activities...</p>
          </div>
        ) : displayedLogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {displayedLogs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                onClick={setSelectedLog}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activities found for selected filters</p>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {selectedLog && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="size-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Performance Recommendations</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Based on your selected activity, here are some recommendations to improve your performance:
          </p>
          <button
            onClick={() => setSelectedLog(null)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
          >
            View detailed recommendations
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function EnhancedProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    names: '',
    email: '',
    phone_number: '',
    gender: '',
    profile_picture_upload: null
  });

  // Logs data
  const [logs, setLogs] = useState([]);
  const [breakLogs, setBreakLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    logType: '',
    status: ''
  });

  // Performance stats
  const [performanceStats, setPerformanceStats] = useState({
    averagePunctuality: 0,
    onTimePercentage: 0,
    earlyPercentage: 0,
    latePercentage: 0,
    totalLogs: 0,
    averageBreakDeviation: 0
  });

  // Toast helper function
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'Profile & Performance', icon: <UserCircle className="size-5" /> },
    { id: 'breaks', label: 'Break Schedule', icon: <Coffee className="size-5" /> },
    { id: 'logs', label: 'Activity Logs', icon: <Activity className="size-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="size-5" /> }
  ];

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchBreakLogs();
    }
  }, [user, filters]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${BASE_URL}/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.profile) {
        setUser(data.profile);
        setProfileData({
          names: data.profile.names || '',
          email: data.profile.email || '',
          phone_number: data.profile.phone_number || '',
          gender: data.profile.gender || ''
        });
      } else {
        showToast('Failed to fetch profile', 'error');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const token = localStorage.getItem('access_token');

      let url = `${BASE_URL}/performance/my-performance/`;
      const params = new URLSearchParams();

      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.logType) params.append('log_type', filters.logType);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.logs) {
        setLogs(data.logs);
        calculatePerformanceStats(data.logs, data.summary);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchBreakLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      let url = `${BASE_URL}/performance/breaks/current/`;
      const params = new URLSearchParams();

      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        return;
      }

      if (!response.ok) {
        console.error('API Error:', data.message || 'Unknown error');
        return;
      }

      if (data.breaks) {
        setBreakLogs(data.breaks);
      }
    } catch (error) {
      console.error('Error fetching break logs:', error);
    }
  };

  const calculatePerformanceStats = (logs, summary) => {
    if (!logs || logs.length === 0) return;

    const punctualityScores = logs.map(log => {
      if (log.time_difference_minutes) {
        const diff = Math.abs(log.time_difference_minutes);
        if (diff <= 5) return 100;
        if (diff <= 15) return 80;
        if (diff <= 30) return 60;
        if (diff <= 60) return 40;
        return 20;
      }
      return 50;
    });

    const averagePunctuality = punctualityScores.reduce((a, b) => a + b, 0) / punctualityScores.length;

    const total = summary.total_logs || logs.length;
    const onTimePercentage = ((summary.on_time_count || 0) / total) * 100;
    const earlyPercentage = ((summary.early_count || 0) / total) * 100;
    const latePercentage = ((summary.late_count || 0) / total) * 100;

    setPerformanceStats({
      averagePunctuality,
      onTimePercentage,
      earlyPercentage,
      latePercentage,
      totalLogs: total,
      averageBreakDeviation: 0
    });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const formData = new FormData();

      if (profileData.names !== user.names) {
        formData.append('names', profileData.names);
      }
      if (profileData.email !== user.email) {
        formData.append('email', profileData.email);
      }
      if (profileData.phone_number !== user.phone_number) {
        formData.append('phone_number', profileData.phone_number);
      }
      if (profileData.gender && profileData.gender !== user.gender) {
        formData.append('gender', profileData.gender);
      }
      if (profileData.profile_picture_upload) {
        formData.append('profile_picture_upload', profileData.profile_picture_upload);
      }

      const response = await fetch(`${BASE_URL}/profile/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.profile) {
        setUser(data.profile);
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');

        setProfileData(prev => ({
          ...prev,
          profile_picture_upload: null
        }));
      } else {
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async (breakLogId) => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${BASE_URL}/performance/breaks/start/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ break_log_id: breakLogId })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Break started successfully!', 'success');
        fetchBreakLogs();
      } else {
        showToast(data.message || 'Failed to start break', 'error');
      }
    } catch (error) {
      console.error('Error starting break:', error);
      showToast('Failed to start break', 'error');
    }
  };

  const handleEndBreak = async (breakLogId) => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${BASE_URL}/performance/breaks/end/${breakLogId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Break ended successfully!', 'success');
        fetchBreakLogs();
      } else {
        showToast(data.message || 'Failed to end break', 'error');
      }
    } catch (error) {
      console.error('Error ending break:', error);
      showToast('Failed to end break', 'error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
      }

      setProfileData(prev => ({
        ...prev,
        profile_picture_upload: file
      }));
    }
  };

  const handleWebcamCapture = (file) => {
    setProfileData(prev => ({
      ...prev,
      profile_picture_upload: file
    }));
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSaveProfile={handleSaveProfile}
            handleImageUpload={handleImageUpload}
            setShowWebcam={setShowWebcam}
            loading={loading}
            showToast={showToast}
          />
        );
      case 'breaks':
        return (
          <PerformanceTab
            performanceStats={performanceStats}
            breakLogs={breakLogs}
            handleStartBreak={handleStartBreak}
            handleEndBreak={handleEndBreak}
          />
        );
      case 'logs':
        return (
          <ActivityLogsTab
            logs={logs}
            filters={filters}
            setFilters={setFilters}
            loadingLogs={loadingLogs}
            selectedLog={selectedLog}
            setSelectedLog={setSelectedLog}
          />
        );
      case 'settings':
        return (
          <PasswordChangeTab
            onClose={() => setActiveTab('profile')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Webcam Modal */}
      {showWebcam && (
        <WebcamModal
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* Recommendation Modal */}
      {selectedLog && (
        <RecommendationModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your profile and track your performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Employee ID:</span>
          <span className="font-medium bg-gray-100 px-3 py-1 rounded-md">
            {user?.emp_number || 'N/A'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="border-b">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}