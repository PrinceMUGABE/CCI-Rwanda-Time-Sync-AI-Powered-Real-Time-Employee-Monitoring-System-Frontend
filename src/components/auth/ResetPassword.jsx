import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  Mail,
  CheckCircle,
  ArrowLeft,
  Key,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request-otp');
  const [workMail, setWorkMail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Handle OTP timer
  useEffect(() => {
    let timer;
    if (step === 'verify-otp' && otpExpiry > 0) {
      timer = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiry]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    return errors;
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/password-reset/request-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: workMail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP has been sent to your registered email address.');
        setStep('verify-otp');
        setOtpExpiry(30);
        setCanResend(false);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/password-reset/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: workMail,
          otp
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          setStep('reset-password');
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/password-reset/request-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: workMail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('New OTP has been sent to your email.');
        setOtpExpiry(30);
        setCanResend(false);
        setOtp('');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`Password must contain: ${passwordErrors.join(', ')}`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/password-reset/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: workMail,
          otp,
          new_password: newPassword,
          new_password_confirm: confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successfully!');
        setStep('success');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'request-otp':
        return (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="workMail" className="block text-sm font-medium text-gray-700">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="workMail"
                  type="text"
                  placeholder="Enter emil email address"
                  value={workMail}
                  onChange={(e) => setWorkMail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">
                Enter your work email address to receive an OTP
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
            </button>
          </form>
        );

      case 'verify-otp':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    OTP expires in: {otpExpiry}s
                  </span>
                </div>
                {canResend && (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Check your email for the 6-digit OTP code
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !otp || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request-otp');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Use different email
                </button>
              </div>
            </form>
          </div>
        );

      case 'reset-password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  required
                />
                <PasswordStrength password={newPassword} />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('verify-otp')}
                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to OTP verification
              </button>
            </div>
          </form>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-gray-600">
                Your password has been successfully reset. You can now login with your new password.
              </p>
            </div>
            <Link to="/login">
              <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        {/* <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-900">MentorHub</span>
          </Link>
        </div> */}



        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Step Indicator */}
          {step !== 'success' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {['request-otp', 'verify-otp', 'reset-password'].map((s, index) => (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${step === s ? 'bg-blue-600 text-white' :
                          ['verify-otp', 'reset-password'].includes(step) && ['request-otp', 'verify-otp'].includes(s) ?
                            'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-400'}
                      `}>
                        {index + 1}
                      </div>
                      <span className="text-xs mt-1 text-gray-600 capitalize">
                        {s.replace('-', ' ')}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className={`flex-1 h-1 mx-2 ${['verify-otp', 'reset-password'].includes(step) && s !== 'reset-password' ? 'bg-green-200' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Headings */}
          <div className="mb-6">
            {step === 'request-otp' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
                <p className="text-gray-600">
                  Enter your work email address to receive a one-time password (OTP)
                </p>
              </>
            )}
            {step === 'verify-otp' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
                <p className="text-gray-600">
                  Enter the 6-digit OTP sent to your email
                </p>
              </>
            )}
            {step === 'reset-password' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-600">
                  Create a strong new password for your account
                </p>
              </>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Step Content */}
          {renderStep()}

          {/* Back to Login Link */}
          {step === 'request-otp' && (
            <div className="mt-6 text-center">
              <Link to="/login" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Password Strength Component
function PasswordStrength({ password }) {
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/\d/.test(pwd)) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Very Weak', 'Weak', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= strength ? colors[strength - 1] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-sm ${strength < 2 ? 'text-red-600' : strength < 3 ? 'text-orange-600' : strength < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
        Password strength: {labels[strength - 1] || 'Very Weak'}
      </p>
      <ul className="text-xs text-gray-500 space-y-1">
        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : ''}`}>
          <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
          At least 8 characters
        </li>
        <li className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600' : ''}`}>
          <div className={`w-1 h-1 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
          At least one number
        </li>
        <li className={`flex items-center gap-1 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
          <div className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
          Upper & lowercase letters
        </li>
        <li className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : ''}`}>
          <div className={`w-1 h-1 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
          At least one special character
        </li>
      </ul>
    </div>
  );
}