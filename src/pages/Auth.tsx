
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';
import { cleanupAuthState } from '@/utils/authCleanup';

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authType, setAuthType] = useState<'signin' | 'signup' | 'admin-signin' | 'admin-signup'>('signin');

  // Auto-fill demo credentials
  const demoCredentials = {
    user: { email: 'chesdakuyseng2@gmail.com', password: '123456' },
    admin: { email: 'chesdakuyseng1@gmail.com', password: '123456' }
  };

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authType === 'signup' || authType === 'admin-signup') {
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        return;
      }
      if (password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Clean up any existing auth state
      cleanupAuthState();

      if (authType === 'signin' || authType === 'admin-signin') {
        const { error } = await signIn(email, password);
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: authType === 'admin-signin' ? "Signed in as admin successfully!" : "Signed in successfully!"
        });
        
        // Force page reload for clean state
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account."
        });
        
        // Switch to sign in tab after successful registration
        setAuthType(authType === 'admin-signup' ? 'admin-signin' : 'signin');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'user' | 'admin') => {
    setEmail(demoCredentials[type].email);
    setPassword(demoCredentials[type].password);
    setConfirmPassword(demoCredentials[type].password);
    setFullName(type === 'admin' ? 'Admin User' : 'Demo User');
  };

  const handleAuthTypeChange = (value: string) => {
    setAuthType(value as any);
    // Clear form when switching types
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">IS</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">IELTSSlay</span>
          </div>
          <p className="text-gray-600">Your AI-powered IELTS preparation platform</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4">
            <CardTitle className="text-center text-2xl">Welcome</CardTitle>
            
            {/* Demo Credentials */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fillDemoCredentials('user')}
                className="text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                Demo User
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fillDemoCredentials('admin')}
                className="text-xs"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Demo Admin
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={authType} onValueChange={handleAuthTypeChange}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sign In Tab */}
                <TabsContent value="signin" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button 
                      type="button"
                      variant={authType === 'signin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAuthType('signin')}
                    >
                      <User className="h-4 w-4 mr-1" />
                      User
                    </Button>
                    <Button 
                      type="button"
                      variant={authType === 'admin-signin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAuthType('admin-signin')}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </div>

                  {authType === 'admin-signin' && (
                    <Badge variant="outline" className="w-full justify-center py-1">
                      Signing in as Admin
                    </Badge>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-sky-600 hover:bg-sky-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button 
                      type="button"
                      variant={authType === 'signup' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAuthType('signup')}
                    >
                      <User className="h-4 w-4 mr-1" />
                      User
                    </Button>
                    <Button 
                      type="button"
                      variant={authType === 'admin-signup' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAuthType('admin-signup')}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </div>

                  {authType === 'admin-signup' && (
                    <Badge variant="outline" className="w-full justify-center py-1">
                      Creating Admin Account
                    </Badge>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min. 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
