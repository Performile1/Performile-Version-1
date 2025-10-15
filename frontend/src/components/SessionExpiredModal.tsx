import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionEvents } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle, LogIn, X } from 'lucide-react';

export const SessionExpiredModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  // Memoize the session handler to prevent re-subscriptions
  const handleSessionExpired = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    // Subscribe to session expiration events
    const unsubscribe = sessionEvents.subscribe(handleSessionExpired);

    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [handleSessionExpired]);

  const handleLogin = useCallback(() => {
    setIsOpen(false);
    clearAuth();
    navigate('/login', { state: { sessionExpired: true } });
  }, [clearAuth, navigate]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Session Expired
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-6">
            Your session has expired due to inactivity. Please log in again to continue using Performile.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <LogIn className="w-5 h-5" />
              Log In Again
            </button>
            
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Your session will automatically extend while you're active. Sessions expire after 15 minutes of inactivity for your security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
