import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import topoBg from '../assets/topo-bg.jpg';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [validations, setValidations] = useState({
    emailValid: false,
    passwordLength: false,
    passwordUppercase: false,
    passwordLowercase: false,
    passwordNumber: false,
    passwordSpecial: false,
    passwordsMatch: false,
  });

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return {
      passwordLength: password.length >= 8 && password.length <= 16,
      passwordUppercase: /[A-Z]/.test(password),
      passwordLowercase: /[a-z]/.test(password),
      passwordNumber: /[0-9]/.test(password),
      passwordSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  // Real-time validation
  useEffect(() => {
    const emailValid = validateEmail(email);
    const passwordValidations = validatePassword(password);
    const passwordsMatch = password === confirmPassword && password.length > 0 && confirmPassword.length > 0;

    setValidations({
      emailValid,
      ...passwordValidations,
      passwordsMatch,
    });

    // Update errors in real-time
    const newErrors = { ...errors };
    
    if (email && !emailValid) {
      newErrors.email = 'Invalid email format';
    } else {
      delete newErrors.email;
    }

    if (password && !passwordValidations.passwordLength) {
      newErrors.password = 'Password must be 8-16 characters';
    } else if (password && (!passwordValidations.passwordUppercase || !passwordValidations.passwordLowercase || 
                !passwordValidations.passwordNumber || !passwordValidations.passwordSpecial)) {
      newErrors.password = 'Password must meet all requirements';
    } else {
      delete newErrors.password;
    }

    if (confirmPassword && !passwordsMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
    } else {
      delete newErrors.confirmPassword;
    }

    setErrors(newErrors);
  }, [email, password, confirmPassword]);

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validations.emailValid) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validations.passwordLength || !validations.passwordUppercase || 
               !validations.passwordLowercase || !validations.passwordNumber || 
               !validations.passwordSpecial) {
      newErrors.password = 'Password must meet all requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!validations.passwordsMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, username);

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: 'This email is already registered' });
          toast.error('This email is already registered');
        } else {
          toast.error(error.message || 'Failed to sign up');
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
        // Clear form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        // Redirect to sign in page after a short delay
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image (Desktop) / Background (Mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={topoBg}
          alt="Topographic map background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 text-gray-800 drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Homeland Surveyors
            </h1>
            <p className="text-xl text-gray-700 drop-shadow-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
              Precision in Every Measurement
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form (Desktop) / Center Overlay (Mobile) */}
      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center px-4 py-6 lg:py-12 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0">
          <img
            src={topoBg}
            alt="Topographic map background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Form Container */}
        <div className="relative z-10 max-w-md w-full mt-4 lg:mt-0">
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-gray-800 lg:text-gray-900" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
              Create Account
            </h1>
            <p className="text-gray-700 lg:text-gray-600" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
              Join Homeland Surveyors today
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors`}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.email ? 'border-red-500' : email && validations.emailValid ? 'border-green-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors`}
                />
                {email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {validations.emailValid ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                  <PasswordRequirement met={validations.passwordLength} text="8-16 characters" />
                  <PasswordRequirement met={validations.passwordUppercase} text="One uppercase letter" />
                  <PasswordRequirement met={validations.passwordLowercase} text="One lowercase letter" />
                  <PasswordRequirement met={validations.passwordNumber} text="One number" />
                  <PasswordRequirement met={validations.passwordSpecial} text="One special character (!@#$%^&*)" />
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : confirmPassword && validations.passwordsMatch ? 'border-green-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {confirmPassword && validations.passwordsMatch && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" /> Passwords match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-600 font-medium hover:text-blue-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default SignUp;
