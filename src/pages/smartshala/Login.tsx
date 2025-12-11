import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ArrowLeft, LogIn, AlertCircle } from 'lucide-react';

// Constants
const DEMO_CREDENTIALS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'staff', password: 'staff123', role: 'teacher' },
];

interface ValidationError {
  username?: string;
  password?: string;
}

export default function SmartShalaLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Check if already logged in
  useEffect(() => {
    const userId = localStorage.getItem('smartshala_user_id');
    const userRole = localStorage.getItem('smartshala_role');
    
    if (userId && userRole) {
      // Already logged in, redirect based on role
      if (userRole === 'admin') {
        navigate('/smartshala/admin', { replace: true });
      } else {
        navigate('/smartshala/data-entry', { replace: true });
      }
    }
  }, [navigate]);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationError = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle login form submission
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Call API
      const response = await api.login(username.trim(), password);

      if (response.success && response.user) {
        // Store user information in localStorage
        localStorage.setItem('smartshala_user_id', response.user.id.toString());
        localStorage.setItem('smartshala_username', response.user.username);
        localStorage.setItem('smartshala_role', response.user.role);
        
        // Optional: Store timestamp for session management
        localStorage.setItem('smartshala_login_time', new Date().toISOString());

        // Show success toast
        toast({
          title: 'Login Successful! 🎉',
          description: `Welcome back, ${response.user.username}!`,
          variant: 'default',
          duration: 2000,
        });

        // Navigate based on role
        const redirectPath = response.user.role === 'admin' 
          ? '/smartshala/admin' 
          : '/smartshala/data-entry';
        
        navigate(redirectPath, { replace: true });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';

      // Show specific error messages
      if (errorMessage.includes('Invalid username or password')) {
        setErrors({
          username: 'Invalid credentials',
          password: 'Please check your username and password',
        });
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password',
          variant: 'destructive',
          duration: 3000,
        });
      } else if (errorMessage.includes('Account is inactive')) {
        toast({
          title: 'Account Inactive',
          description: 'Your account has been deactivated. Contact administrator.',
          variant: 'destructive',
          duration: 3000,
        });
      } else if (errorMessage.includes('HTTP')) {
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to server. Please try again.',
          variant: 'destructive',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive',
          duration: 3000,
        });
      }

      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fill demo credentials for testing
   */
  const fillDemoCredentials = (role: 'admin' | 'teacher') => {
    const demo = DEMO_CREDENTIALS.find(d => d.role === role);
    if (demo) {
      setUsername(demo.username);
      setPassword(demo.password);
      setErrors({});
      
      toast({
        title: 'Demo Credentials Filled',
        description: `You can now login as ${role}`,
        duration: 2000,
      });
    }
  };

  /**
   * Check server health before login
   */
  const checkServerHealth = async () => {
    try {
      await api.healthCheck();
      toast({
        title: 'Server Status',
        description: 'Server is running and responsive ✓',
        variant: 'default',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Server Offline',
        description: 'Cannot connect to server. Make sure backend is running.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Login Card */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              SmartShala
            </CardTitle>
            <CardDescription className="text-sm">
              Attendance Management System
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  disabled={isLoading}
                  autoComplete="username"
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={isLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Demo Credentials</span>
              </div>
            </div>

            {/* Demo Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('admin')}
                disabled={isLoading}
                className="text-xs"
              >
                Admin Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('teacher')}
                disabled={isLoading}
                className="text-xs"
              >
                Staff Demo
              </Button>
            </div>

            {/* Server Status Check */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={checkServerHealth}
              disabled={isLoading}
              className="w-full text-xs"
            >
              🔌 Check Server Status
            </Button>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>🔒 Secure Login • Your credentials are encrypted</p>
          <p>Need help? Contact the administrator</p>
        </div>
      </div>
    </div>
  );
}
