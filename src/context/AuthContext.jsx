// AuthContext.jsx - Fixed version to prevent unwanted navigation on refresh
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();
const BASE_URL = "http://127.0.0.1:8000";

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/reset-password', '/help'];

  // Helper function to map backend role to frontend route
  const getRoleRoute = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'supervisor': return '/supervisor';
      case 'employee': return '/employee';
      case 'hr': return '/hr';
      case 'mentor': return '/mentor';
      default: return '/employee';
    }
  };

  // Check if user is on a valid route for their role
  const isOnValidRoute = (userRole, currentPath) => {
    const roleRoute = getRoleRoute(userRole);
    return currentPath.startsWith(roleRoute);
  };

  // Verify token with backend
  const verifyToken = async (accessToken) => {
    try {
      const response = await fetch(`${BASE_URL}/verify-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { valid: true };
      }
      return { valid: false };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  };

  // Get user profile from backend
  const getUserProfile = async (accessToken) => {
    try {
      const response = await fetch(`${BASE_URL}/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, user: data.profile };
      }
      return { success: false };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false };
    }
  };

  // Initial load effect - runs only once on mount
  useEffect(() => {
    if (hasInitialized.current) return;

    const initializeAuth = async () => {
      console.log("=== AuthContext: Initializing ===");
      console.log("Current path:", location.pathname);

      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        console.log("Stored data check:", {
          hasUser: !!storedUser,
          hasToken: !!accessToken,
          currentPath: location.pathname
        });

        if (accessToken && refreshToken) {
          // Verify token with backend
          const { valid } = await verifyToken(accessToken);

          if (valid) {
            // Token valid, get user profile
            const { success, user: userProfile } = await getUserProfile(accessToken);

            if (success && userProfile) {
              console.log("Token valid, user authenticated:", userProfile.names);

              // Map backend user fields to frontend expected structure
              const mappedUser = {
                id: userProfile.id?.toString() || '',
                name: userProfile.names || '',
                full_name: userProfile.names || '',
                email: userProfile.email || '',
                work_mail_address: userProfile.email || '',
                role: userProfile.role || 'employee',
                department: userProfile.department || '',
                phone_number: userProfile.phone_number || '',
                avatar: userProfile.profile_picture || null,
                emp_number: userProfile.emp_number || ''
              };

              setUserState(mappedUser);

              const roleRoute = getRoleRoute(mappedUser.role);
              const isPublicRoute = publicRoutes.includes(location.pathname);
              const isValidRoleRoute = isOnValidRoute(mappedUser.role, location.pathname);

              console.log("Navigation check:", {
                roleRoute,
                isPublicRoute,
                isValidRoleRoute,
                currentPath: location.pathname
              });

              // CRITICAL FIX: Only navigate if necessary
              if (isPublicRoute) {
                // User is on public route (login, register, etc.) - redirect to their dashboard
                console.log("User on public route, redirecting to:", roleRoute);
                setTimeout(() => {
                  navigate(roleRoute, { replace: true });
                }, 100);
              } else if (!isValidRoleRoute) {
                // User is on protected route but wrong role - redirect to correct role route
                console.log("User on wrong role route, redirecting to:", roleRoute);
                setTimeout(() => {
                  navigate(roleRoute, { replace: true });
                }, 100);
              } else {
                // User is already on correct route - DO NOTHING (this fixes the refresh issue)
                console.log("User already on correct route, staying on:", location.pathname);
              }
            } else {
              // Couldn't get profile, clear everything
              console.log("Could not get user profile, clearing auth data");
              handleLogout();
            }
          } else {
            // Token invalid, clear everything
            console.log("Token invalid, clearing auth data");
            handleLogout();
          }
        } else {
          console.log("No stored auth tokens");

          // No auth data, redirect to login if on protected route
          if (!publicRoutes.includes(location.pathname)) {
            console.log("On protected route without auth, redirecting to login");
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        handleLogout();
      } finally {
        setIsLoading(false);
        hasInitialized.current = true;
        console.log("=== AuthContext: Initialization Complete ===");
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CRITICAL: Empty dependency array - only run once on mount

  // Login with OTP request (Step 1)
  const loginWithOTPRequest = async (emp_number, password) => {
    try {
      const response = await fetch(`${BASE_URL}/login/otp/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emp_number, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message, email: data.email };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login OTP request error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Login with OTP verify (Step 2)
  const loginWithOTPVerify = async (emp_number, otp) => {
    try {
      const response = await fetch(`${BASE_URL}/login/otp/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emp_number, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save tokens and user data
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Map backend user fields to frontend expected structure
        const mappedUser = {
          id: data.user.id?.toString() || '',
          name: data.user.names || '',
          full_name: data.user.names || '',
          email: data.user.email || '',
          work_mail_address: data.user.email || '',
          role: data.user.role || 'employee',
          department: data.user.department || '',
          phone_number: data.user.phone_number || '',
          avatar: data.user.profile_picture || null,
          emp_number: data.user.emp_number || '',
          gender: data.user.gender || '',
          status: data.user.status || '',
          salary: data.user.salary || '',
          day_off: data.user.day_off || '',
          created_at: data.user.created_at || ''
        };

        setUserState(mappedUser);

        // Navigate to role-based route
        const roleRoute = getRoleRoute(mappedUser.role);
        setTimeout(() => {
          navigate(roleRoute, { replace: true });
        }, 100);

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'OTP verification failed' };
      }
    } catch (error) {
      console.error('Login OTP verify error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Face login
  const loginWithFace = async (faceImage, emp_number = null) => {
    try {
      const formData = new FormData();
      formData.append('face_image', faceImage);
      if (emp_number) {
        formData.append('emp_number', emp_number);
      }

      const response = await fetch(`${BASE_URL}/login/face/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log("=== Face Login Response (AuthContext) ===");
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log("User data:", data.user);
      console.log("User role:", data.user?.role);
      console.log("========================================");

      if (response.ok) {
        if (!data.user || !data.user.role || !data.tokens) {
          console.error("Incomplete data in face login response:", data);
          return {
            success: false,
            message: 'Invalid response from server. Please try again.'
          };
        }

        // Save tokens and user data
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Map backend user fields to frontend expected structure
        const mappedUser = {
          id: data.user.id?.toString() || '',
          name: data.user.names || '',
          full_name: data.user.names || '',
          email: data.user.email || '',
          work_mail_address: data.user.email || '',
          role: data.user.role || 'employee',
          department: data.user.department || '',
          phone_number: data.user.phone_number || '',
          avatar: data.user.profile_picture || null,
          emp_number: data.user.emp_number || '',
          gender: data.user.gender || '',
          status: data.user.status || '',
          salary: data.user.salary || '',
          day_off: data.user.day_off || '',
          created_at: data.user.created_at || ''
        };

        console.log("Mapped user for face login:", mappedUser);
        setUserState(mappedUser);

        // Navigate to role-based route
        const roleRoute = getRoleRoute(mappedUser.role);
        console.log("Navigating to role route:", roleRoute);
        setTimeout(() => {
          navigate(roleRoute, { replace: true });
        }, 100);

        return {
          success: true,
          message: data.message,
          match_score: data.match_score
        };
      } else {
        return {
          success: false,
          message: data.message || 'Face login failed',
          match_score: data.match_score || 0
        };
      }
    } catch (error) {
      console.error('Face login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    }
  };

  // Password reset request (Step 1)
  const passwordResetRequest = async (email) => {
    try {
      const response = await fetch(`${BASE_URL}/password-reset/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message, email: data.email };
      } else {
        return { success: false, message: data.message || 'Password reset request failed' };
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Password reset verify (Step 2)
  const passwordResetVerify = async (email, otp) => {
    try {
      const response = await fetch(`${BASE_URL}/password-reset/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'OTP verification failed' };
      }
    } catch (error) {
      console.error('Password reset verify error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Password reset confirm (Step 3)
  const passwordResetConfirm = async (email, otp, new_password, new_password_confirm) => {
    try {
      const response = await fetch(`${BASE_URL}/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          new_password,
          new_password_confirm
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Password reset failed' };
      }
    } catch (error) {
      console.error('Password reset confirm error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Update user function that also saves to localStorage
  const setUser = (newUser) => {
    console.log("=== AuthContext: setUser called ===");
    console.log("New user:", newUser);

    setUserState(newUser);

    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      console.log("User saved to localStorage");

      // Navigate to role-based route
      const roleRoute = getRoleRoute(newUser.role);
      setTimeout(() => {
        navigate(roleRoute, { replace: true });
      }, 100);
    } else {
      localStorage.removeItem('user');
      console.log("User removed from localStorage");
    }
  };

  // Handle logout locally
  const handleLogout = () => {
    setUserState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    if (!publicRoutes.includes(location.pathname)) {
      navigate('/login', { replace: true });
    }
  };

  // Logout function with backend call
  const logout = async () => {
    console.log("=== AuthContext: Logout ===");

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access_token');

      // Call backend logout endpoint to blacklist token
      if (refreshToken && accessToken) {
        await fetch(`${BASE_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            refresh: refreshToken
          }),
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Clear all auth data
    handleLogout();
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        return { success: false, message: 'No refresh token available' };
      }

      const response = await fetch(`${BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        return { success: true, accessToken: data.access };
      } else {
        return { success: false, message: 'Token refresh failed' };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, message: 'Network error during token refresh' };
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setUser,
    logout,
    loginWithOTPRequest,
    loginWithOTPVerify,
    loginWithFace,
    passwordResetRequest,
    passwordResetVerify,
    passwordResetConfirm,
    refreshAccessToken,
    verifyToken,
    getUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};