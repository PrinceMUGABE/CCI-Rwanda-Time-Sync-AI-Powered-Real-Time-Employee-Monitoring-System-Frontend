import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Camera, User, Lock, AlertCircle, Eye, EyeOff, X, Loader2, Clock, Menu, Scan } from "lucide-react";
import Webcam from "react-webcam";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const webcamRef = useRef(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState("credentials");
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [otpExpiry, setOtpExpiry] = useState(30);
  const [otpExpiryActive, setOtpExpiryActive] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Get auth functions from context
  const { loginWithOTPRequest, loginWithOTPVerify, loginWithFace } = useAuth();

  useEffect(() => {
    if (!otpExpiryActive || otpExpiry <= 0) return;

    const timer = setInterval(() => {
      setOtpExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setOtpExpiryActive(false);
          setError("OTP has expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiryActive, otpExpiry]);

  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!userId || !password) {
      setError("User ID and Password are required");
      return;
    }

    setLoading(true);

    try {
      // Use AuthContext function
      const result = await loginWithOTPRequest(userId, password);

      if (!result.success) {
        setError(result.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      setMaskedEmail(result.email || "");
      setLoginStep("otp");
      setOtpExpiry(30);
      setOtpExpiryActive(true);
      setError("");
      setLoading(false);

    } catch (err) {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!userId || !otp) {
      setError("User ID and OTP are required");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (otpExpiry <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);

    try {
      // Use AuthContext function - it will handle navigation
      const result = await loginWithOTPVerify(userId, otp);

      console.log("=== OTP Verification Result ===");
      console.log("Success:", result.success);
      console.log("Message:", result.message);
      console.log("===============================");

      if (!result.success) {
        setError(result.message || "OTP verification failed.");
        setLoading(false);
        return;
      }

      // Show success message
      setSuccessMessage("Login successful! Redirecting...");
      setLoading(false);
      
      // AuthContext will handle navigation automatically

    } catch (err) {
      console.error("Network error during OTP verification:", err);
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId || !password) {
      setError("Session expired. Please login again.");
      goBackToCredentials();
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await loginWithOTPRequest(userId, password);

      if (!result.success) {
        setError(result.message || "Failed to resend OTP.");
        setLoading(false);
        return;
      }

      setOtpExpiry(30);
      setOtpExpiryActive(true);
      setOtp("");
      setSuccessMessage("New OTP sent successfully!");
      setLoading(false);

    } catch (err) {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  const startFaceScan = () => {
    setShowFaceScan(true);
    setCountdown(3);
    setIsCapturing(true);
    setError("");
  };

  useEffect(() => {
    if (!showFaceScan || !isCapturing) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          captureFace();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showFaceScan, isCapturing]);

  const captureFace = () => {
    if (!webcamRef.current) {
      setError("Camera not available");
      setIsCapturing(false);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Failed to capture image");
      setIsCapturing(false);
      return;
    }

    const byteString = atob(imageSrc.split(',')[1]);
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], "face_capture.jpg", { type: "image/jpeg" });

    handleFaceLogin(file);
  };

  const handleFaceLogin = async (faceImage) => {
    setIsCapturing(false);
    setLoading(true);

    try {
      // Use AuthContext function - it will handle navigation
      const result = await loginWithFace(faceImage, userId || null);

      console.log("=== Face Login Result ===");
      console.log("Success:", result.success);
      console.log("Message:", result.message);
      console.log("Match score:", result.match_score);
      console.log("========================");

      if (!result.success) {
        setError(result.message || "Face recognition failed");
        setShowFaceScan(false);
        setLoading(false);
        return;
      }

      // Show success message
      setSuccessMessage(`Face login successful! Match: ${result.match_score}%. Redirecting...`);
      setShowFaceScan(false);
      setLoading(false);
      
      // AuthContext will handle navigation automatically

    } catch (err) {
      console.error("Network error during face login:", err);
      setError("Network error. Please check your connection.");
      setShowFaceScan(false);
      setLoading(false);
    }
  };

  const cancelFaceScan = () => {
    setShowFaceScan(false);
    setIsCapturing(false);
    setCountdown(3);
  };

  const goBackToCredentials = () => {
    setLoginStep("credentials");
    setOtp("");
    setOtpExpiryActive(false);
    setOtpExpiry(30);
    setError("");
    setSuccessMessage("");
  };

  const forgetPassword = () => {
    navigate("/reset-Password");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {/* Equal sign bars */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-4.5 bg-gray-400 rounded-sm"></div>
                  <div className="w-24 h-4.5 bg-gray-400 rounded-sm"></div>
                </div>
                {/* CCI letters */}
                <div className="flex items-center gap-4">
                  {/* First C */}
                  <div className="relative w-8 h-10">
                    <div className="absolute inset-0 border-[8px] border-gray-600 rounded-3xl border-r-transparent"></div>
                  </div>

                  {/* Second C */}
                  <div className="relative w-8 h-10">
                    <div className="absolute inset-0 border-[8px] border-gray-600 rounded-3xl border-r-transparent"></div>
                  </div>

                  {/* I */}
                  <div className="w-2 h-10 bg-gray-600 rounded-full"></div>
                </div>

              </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm">
              <a href="#" className="hover:text-gray-200 transition-colors">About Us</a>
              <a href="#" className="hover:text-gray-200 transition-colors">Industries</a>
              <a href="#" className="hover:text-gray-200 transition-colors">Solutions</a>
              <a href="#" className="hover:text-gray-200 transition-colors">CareerBox</a>
              <a href="#" className="hover:text-gray-200 transition-colors">Quality</a>
              <a href="#" className="hover:text-gray-200 transition-colors">Knowledge Base</a>
              <a href="#" className="hover:text-gray-200 transition-colors">Diversity</a>
              <a href="#" className="hover:text-gray-200 transition-colors">Connect</a>
            </nav>

            {/* Mobile Menu */}
            <button className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-72px)]">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/10 to-transparent"></div>

          <div className="relative z-10 flex flex-col justify-center items-center px-16 py-12 w-full">
            {/* Logo Group - Centered */}
            <div className="mb-16 text-center">
              {/* =CCI Logo */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {/* Equal sign bars */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-4.5 bg-gray-400 rounded-sm"></div>
                  <div className="w-24 h-4.5 bg-gray-400 rounded-sm"></div>
                </div>
                {/* CCI letters */}
                <div className="flex items-center gap-4">
                  {/* First C */}
                  <div className="relative w-16 h-20">
                    <div className="absolute inset-0 border-[8px] border-gray-600 rounded-3xl border-r-transparent"></div>
                  </div>

                  {/* Second C */}
                  <div className="relative w-16 h-20">
                    <div className="absolute inset-0 border-[8px] border-gray-600 rounded-3xl border-r-transparent"></div>
                  </div>

                  {/* I */}
                  <div className="w-2 h-20 bg-gray-600 rounded-full"></div>
                </div>

              </div>

              {/* RWANDA text */}
              <div className="text-4xl font-light text-cyn-900 tracking-widest" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.3em' }}>
                RWANDA
              </div>
            </div>

            {/* Stopwatch Icon - Centered */}
            <div className="mb-12">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-gray-200">
                <Clock className="w-14 h-14 text-blue-900 stroke-[1.5]" />
              </div>
            </div>

            {/* Title Box */}
            <div className="bg-gradient-to-r from-slate-500 to-slate-200 text-white py-10 px-12 w-full max-w-xl text-center shadow-xl">
              <h1 className="text-3xl font-light leading-relaxed tracking-wide">
                Time Sync: AI-Powered Real-Time<br />
                Employee Monitoring System
              </h1>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
          <div className="w-full max-w-md">
            {/* Top Action Buttons */}
            <div className="flex justify-end mb-8">
              <button
                type="button"
                onClick={startFaceScan}
                disabled={loading}
                className="flex items-center gap-2 mr-4 px-6 py-2.5 bg-blue-900 text-white rounded-full text-sm hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <Scan className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-full text-sm hover:bg-blue-800 transition-colors">
                <User className="w-4 h-4" />
                Login
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Form Container */}
            <div className="space-y-8">
              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-gray-800 mb-2">Admin / Employee Login</h2>
                <p className="text-sm text-gray-500">Please enter your credentials to continue</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600 text-center">{successMessage}</p>
                </div>
              )}

              {/* Credentials Step */}
              {loginStep === "credentials" && (
                <div className="space-y-6">
                  {/* User ID Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Enter your User ID"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-700 placeholder:text-gray-400"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCredentialLogin(e)}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => forgetPassword()}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-700 placeholder:text-gray-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCredentialLogin(e)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Use OTP for Employee login</p>
                  </div>

                  {/* Login Button */}
                  <button
                    onClick={handleCredentialLogin}
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Enter"
                    )}
                  </button>
                </div>
              )}

              {/* OTP Step */}
              {loginStep === "otp" && (
                <div className="space-y-6">
                  {/* OTP Header */}
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Enter OTP</h3>
                    <p className="text-sm text-gray-600">
                      We've sent a verification code to <span className="font-medium">{maskedEmail}</span>
                    </p>
                    {otpExpiryActive && (
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className={`text-sm font-semibold ${otpExpiry <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                            Expires in: {otpExpiry}s
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User ID Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      value={userId}
                      readOnly
                    />
                  </div>

                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP Code
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-center text-3xl tracking-[0.5em] font-semibold"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleOtpVerification(e)}
                      autoFocus
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={goBackToCredentials}
                      className="flex-1 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleOtpVerification}
                      disabled={loading || otp.length !== 6 || otpExpiry <= 0}
                      className="flex-1 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </button>
                  </div>

                  {/* Resend OTP */}
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                    <button
                      onClick={handleResendOtp}
                      disabled={loading || otpExpiry > 0}
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpExpiry > 0 ? `Resend OTP (${otpExpiry}s)` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Face Scan Modal */}
      {showFaceScan && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Face Recognition Login</h3>
              <button
                onClick={cancelFaceScan}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 text-center mb-6">
              Position your face in the center. The system will automatically capture in {countdown} seconds.
            </p>

            <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-6">
              {isCapturing ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-64 object-cover"
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user"
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-48 h-48 border-4 border-white rounded-full border-opacity-30"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-4xl font-bold">{countdown}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                      <p className="text-white">Processing face recognition...</p>
                    </div>
                  ) : (
                    <Camera className="w-16 h-16 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Make sure your face is well-lit and clearly visible
              </p>

              {!loading && (
                <div className="flex gap-3">
                  <button
                    onClick={cancelFaceScan}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  {!isCapturing && (
                    <button
                      onClick={() => {
                        setCountdown(3);
                        setIsCapturing(true);
                      }}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all"
                    >
                      Retry Capture
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        video {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}