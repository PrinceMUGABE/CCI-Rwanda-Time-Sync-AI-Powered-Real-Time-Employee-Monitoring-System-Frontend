import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import RulesButton from './RulesButton';

const RulesButtonController = () => {
  const location = useLocation();
  const [shouldShowButton, setShouldShowButton] = useState(false);

  useEffect(() => {
    // Get authentication status and user role
    const token = localStorage.getItem('access_token');
    const userDataStr = localStorage.getItem('user');
    
    // Parse user data safely
    let userData = {};
    try {
      if (userDataStr) {
        userData = JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    
    const isAuthenticated = !!token;
    const userRole = userData?.role;
    
    // Define public pages where button should be visible for non-authenticated users
    const publicPages = ['/', '/login', '/register', '/reset-password'];
    const isPublicPage = publicPages.includes(location.pathname);
    
    // Logic for showing rules button:
    // 1. Show for non-authenticated users on public pages
    // 2. Show for authenticated employees on any page
    // 3. Show for authenticated supervisors on any page
    // 4. NEVER show for authenticated admins
    
    let showButton = false;
    
    if (!isAuthenticated) {
      // Non-authenticated users - only show on public pages
      showButton = isPublicPage;
    } else if (isAuthenticated && userRole === 'employee') {
      // Authenticated employees - always show
      showButton = true;
    } else if (isAuthenticated && userRole === 'supervisor') {
      // Authenticated supervisors - always show
      showButton = true;
    } else if (isAuthenticated && userRole === 'admin') {
      // Authenticated admins - never show
      showButton = false;
    } else {
      // Other cases (e.g., unknown role) - don't show
      showButton = false;
    }
    
    setShouldShowButton(showButton);
    
    // Debug logging (can remove in production)
    console.log('RulesButtonController Debug:', {
      pathname: location.pathname,
      isAuthenticated,
      userRole,
      isPublicPage,
      shouldShowButton: showButton
    });
    
  }, [location.pathname]);

  // Only render the RulesButton if shouldShowButton is true
  return shouldShowButton ? <RulesButton /> : null;
};

export default RulesButtonController;