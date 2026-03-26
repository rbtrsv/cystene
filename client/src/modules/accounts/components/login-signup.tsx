'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Loader2, RefreshCw, Mail, Eye, EyeOff } from 'lucide-react';
import { useOAuth } from '../hooks/use-oauth';
import Image from 'next/image';
// Client auth (comment out to switch back):
// import { useAuth } from '../hooks/use-auth-client';

// Server auth (current):
import { useAuth } from '../hooks/use-auth-server';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';
import { clearAuthCookies } from '../utils/token.client.utils';

// Import logos
import logoNudgioDark from '@/modules/main/logos/nudgio_black_text_with_logo.svg';
import logoNudgioLight from '@/modules/main/logos/nudgio_white_text_with_logo.svg';

// Define form data types based on Zod schemas
type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Login component that handles both sign-in and sign-up flows
 */
export default function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Show a simple loading state until client-side code runs
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-white dark:bg-black">
        <div className="w-full max-w-md">
          <div className="flex justify-center items-center flex-col space-y-4">
            <div className="mx-auto">
              <Image
                src={logoNudgioDark}
                alt="Nudgio"
                width={180}
                height={42}
                className="dark:hidden block"
              />
              <Image
                src={logoNudgioLight}
                alt="Nudgio"
                width={180}
                height={42}
                className="hidden dark:block"
              />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // The AccountsProviders are provided by the (accounts) layout
  return <LoginForm mode={mode} />;
}

// Create a wrapper component that safely uses searchParams
function LoginForm({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams?.get('registered') === 'true';
  
  // Initialize form data based on mode
  const [formData, setFormData] = useState<LoginInput | RegisterInput>(
    mode === 'signin'
      ? { email: '', password: '' }
      : { name: '', email: '', password: '' }
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Use the auth hook
  const { login, register, error: authError, clearError } = useAuth();
  
  // Use the OAuth hook (callback handling is automatic)
  const { redirectToGoogleAuth, isLoading: oAuthLoading } = useOAuth();
  
  // Note: Auth redirects handled by middleware only, no client-side redirects
  
  
  // Check if the user just registered
  useEffect(() => {
    if (registered) {
      setSuccessMessage('Account created successfully! Please sign in to continue.');
    }
  }, [registered]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleResendVerification = async () => {
    if (!formData.email) return;
    
    setResendingEmail(true);
    setResendSuccess(false);
    
    try {
      // This is a placeholder - implement actual resend verification logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResendSuccess(true);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setGeneralError('Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };
  
  const handleClearSession = async () => {
    setClearingSession(true);
    try {
      // Clear auth cookies
      clearAuthCookies();
      
      // Clear local storage items related to auth
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Don't reload - just let the cleared cookies work
      // window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setClearingSession(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError(null);
    setErrors({});
    clearError();
    
    try {
      if (mode === 'signin') {
        // Validate login data
        const loginData = formData as LoginInput;
        const validationResult = LoginSchema.safeParse(loginData);
        
        if (!validationResult.success) {
          const fieldErrors: Record<string, string> = {};
          validationResult.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }
        
        // Call login through hook (V7Capital pattern)
        const success = await login({ email: loginData.email, password: loginData.password });
        
        if (success) {
          // Redirect to home after successful login
          router.push('/');
        } else {
          setGeneralError(authError || 'Login failed. Please check your credentials.');
        }
      } else {
        // Validate signup data
        const signupData = formData as RegisterInput;
        const validationResult = RegisterSchema.safeParse({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password
        });

        if (!validationResult.success) {
          const fieldErrors: Record<string, string> = {};
          validationResult.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        // Call register through hook
        const success = await register({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password
        });
        
        if (success) {
          // Redirect to login page with a success indicator
          router.push('/login?registered=true');
        } else {
          setGeneralError(authError || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : `An unexpected error occurred. Please try again.`;
      setGeneralError(errorMessage);
      console.error(`${mode === 'signin' ? 'Login' : 'Signup'} error:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if the error is about email verification
  const isEmailVerificationError = generalError && (
    generalError.includes('verify your email') || 
    generalError.includes('verify your account') ||
    generalError.includes('confirmation email')
  );
  
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-white dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Image
              src={logoNudgioDark}
              alt="Nudgio"
              width={180}
              height={42}
              className="dark:hidden block"
            />
            <Image
              src={logoNudgioLight}
              alt="Nudgio"
              width={180}
              height={42}
              className="hidden dark:block"
            />
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-zinc-900 dark:text-white">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
            {mode === 'signin' 
              ? 'Enter your credentials to access your account'
              : 'Enter your details to create an account'
            }
          </p>
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-md">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={(formData as RegisterInput).name}
                    onChange={handleInputChange}
                    required
                    className={errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 dark:text-red-400">{errors.name}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className={`${errors.password ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                )}
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Must be at least 8 characters and include uppercase, lowercase, and numeric characters.
                  </p>
                )}
              </div>
              
              {generalError && !isEmailVerificationError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm rounded-md">
                  {generalError}
                </div>
              )}
              
              {isEmailVerificationError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm rounded-md space-y-2">
                  <p>{generalError}</p>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendingEmail || resendSuccess}
                      className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                    >
                      {resendingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : resendSuccess ? (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Email sent
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend email
                        </>
                      )}
                    </Button>
                    {resendSuccess && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Verification email sent!
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white" 
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === 'signin' ? 'Sign in' : 'Sign up'}
              </Button>
              
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-zinc-300 dark:after:border-zinc-600">
                <span className="relative z-10 bg-white dark:bg-zinc-800 px-2 text-zinc-500 dark:text-zinc-400">
                  Or continue with
                </span>
              </div>
              
              <Button 
                type="button"
                variant="outline" 
                className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                onClick={redirectToGoogleAuth}
                disabled={oAuthLoading || isLoading}
              >
                {oAuthLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-medium hover:underline"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </p>
            {mode === 'signin' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <Link
                  href="/forgot-password"
                  className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-medium hover:underline"
                >
                  Forgot your password?
                </Link>
              </p>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Having trouble signing in? Try clearing your session data.
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-1 h-auto p-0 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              onClick={handleClearSession}
              disabled={clearingSession}
            >
              {clearingSession ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Clear Session Data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
