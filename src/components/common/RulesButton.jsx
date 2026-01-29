// components/common/FloatingChatButton.jsx
import React, { useState, useEffect, useCallback } from 'react';
import RulesModal from './RulesModal';

const RulesButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Get user role from localStorage
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Show pulsing effect for new users or after updates
  useEffect(() => {
    // Check if user has seen rules before
    const hasSeenRules = localStorage.getItem('has_seen_rules');
    
    // Pulse for 30 seconds when modal hasn't been opened before
    if (!hasSeenRules && (userRole === 'employee' || userRole === 'supervisor')) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 30000);
    }
  }, [userRole]);

  const handleToggle = () => {
    if (!isOpen) {
      // Opening the modal
      setIsOpen(true);
      setIsPulsing(false);
      
      // Mark as seen
      localStorage.setItem('has_seen_rules', 'true');
    } else {
      // Closing the modal
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Don't show floating button for admin users
  if (userRole === 'admin') {
    return null;
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-40 transition-all duration-300 hover:scale-110 ${
          isPulsing ? 'animate-pulse shadow-2xl shadow-blue-500/50' : ''
        } ${isOpen ? 'rotate-45' : 'rotate-0'}`}
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #3B82F6 100%)',
        }}
        aria-label={isOpen ? "Close Rules" : "Open Rules"}
        title={isOpen ? "Close Rules" : "Quick Rules Access"}
      >
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          {isOpen ? '✕' : '📜'}
        </span>
      </button>
      
      <RulesModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default RulesButton;