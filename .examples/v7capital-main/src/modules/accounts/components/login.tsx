'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/modules/shadcnui/components/ui/card';
import { Loader2, RefreshCw, Mail } from 'lucide-react';
import logoLight from "@/images/company/logo-v7-black.png";
import logoDark from "@/images/company/logo-v7-white.png";
import Image from 'next/image';
import { LoginSchema, SignupSchema } from '@/modules/accounts/schemas/auth.schemas';
import { useAuthStore } from '@/modules/accounts/store/auth.store';
import { createClient } from '../utils/supabase/supabase-client';

/**
 * Login component that handles both login and signup flows
 */
export default function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Show a simple loading state until client-side code runs
  if (!isMounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card className="w-full" style={{ maxWidth: '380px' }}>
          <CardHeader className="flex justify-center items-center space-y-2">
            <div className="mx-auto">
              <Image 
                src={logoLight}
                alt="V7 Capital" 
                width={140} 
                height={32} 
                className="dark:hidden block"
              />
              <Image 
                src={logoDark}
                alt="V7 Capital" 
                width={140} 
                height={32} 
                className="hidden dark:block"
              />
            </div>
            <Loader2 className="h-8 w-8 animate-spin opacity-70 mt-4" />
            <p className="text-center text-sm text-gray-500">Loading...</p>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Once mounted on client, render the actual component
  return <LoginContent mode={mode} />;
}

// Create a wrapper component that safely uses searchParams
function LoginContent({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || null;
  const { setAuthData, resetAuth, refreshUser } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [clearingSession, setClearingSession] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [emailForResend, setEmailForResend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Client-side form validation before submitting to server action
  const validateForm = async (formData: FormData): Promise<boolean> => {
    setValidating(true);
    setFormErrors({});
    setError(null);
    
    try {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const name = mode === 'signup' ? formData.get('name') as string : undefined;
      
      // Save email for potential resend verification
      setEmailForResend(email);
      
      // Validate form data using Zod schemas
      if (mode === 'signin') {
        const result = LoginSchema.safeParse({ email, password });
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0].toString()] = err.message;
            }
          });
          setFormErrors(errors);
          return false;
        }
      } else {
        // Signup validation
        const result = SignupSchema.safeParse({ email, password, name });
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0].toString()] = err.message;
            }
          });
          setFormErrors(errors);
          return false;
        }
      }
      
      return true;
    } finally {
      setValidating(false);
    }
  };

  const handleResendVerification = async () => {
    if (!emailForResend) {
      return;
    }

    setResendingEmail(true);
    setResendSuccess(false);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailForResend,
      });
      
      if (error) {
        throw error;
      }
      
      setResendSuccess(true);
    } catch (err: any) {
      console.error('Failed to resend verification email:', err.message);
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleClearSession = async () => {
    setClearingSession(true);
    try {
      // Clear local storage items related to auth
      if (typeof window !== 'undefined') {
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear all sessionStorage
        sessionStorage.clear();
        
        // Clear cookie by setting it to expire in the past
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
      }
      
      // Reset auth store state
      resetAuth();
      
      // Reload the page to ensure everything is fresh
      window.location.reload();
    } catch (err) {
      console.error('Error clearing session:', err);
    } finally {
      setClearingSession(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validate form client-side first
    const isValid = await validateForm(formData);
    if (!isValid) return;
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      if (mode === 'signin') {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          throw error;
        }
        
        // Refresh user data instead of just setting the user
        if (data.user) {
          try {
            await refreshUser(); // This will fetch or create the full profile
            router.push(redirect || '/dashboard');
          } catch (refreshError) {
            console.error('Error refreshing user after sign in:', refreshError);
            setError('Error loading user profile. Please try again or contact support.');
          }
        }
      } else {
        // Sign up with email and password
        const name = formData.get('name') as string;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/accounts/verify`
          }
        });
        
        if (error) {
          throw error;
        }
        
        // If email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setError('Please check your email to verify your account before signing in.');
        } else {
          // If no email confirmation needed (rare)
          try {
            await refreshUser(); // This will fetch or create the profile
            router.push('/dashboard');
          } catch (refreshError) {
            console.error('Error refreshing user after sign up:', refreshError);
            setError('Error creating user profile. Please try again or contact support.');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || `An error occurred during ${mode === 'signin' ? 'login' : 'signup'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the error is about email verification
  const isEmailVerificationError = error && (
    error.includes('verify your email') || 
    error.includes('verify your account') ||
    error.includes('confirmation email')
  );

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full" style={{ maxWidth: '380px' }}>
        <CardHeader>
          <div className="mx-auto">
            <Image 
              src={logoLight}
              alt="V7 Capital" 
              width={140} 
              height={32} 
              className="dark:hidden block"
            />
            <Image 
              src={logoDark}
              alt="V7 Capital" 
              width={140} 
              height={32} 
              className="hidden dark:block"
            />
          </div>
          <CardTitle className="text-xl text-center mt-2">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'signin' 
              ? 'Enter your credentials to access your account'
              : 'Enter your details to create an account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {mode === 'signup' && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'signin' && (
                    <Link
                      href="/accounts/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={formErrors.password ? 'border-red-500' : ''}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>
              
              {error && !isEmailVerificationError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300 text-sm rounded-md">
                  {error}
                </div>
              )}
              
              {isEmailVerificationError && (
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 text-sm rounded-md space-y-2">
                  <p>{error}</p>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendingEmail || resendSuccess}
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
                className="w-full" 
                disabled={isLoading || validating}
              >
                {(isLoading || validating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === 'signin' ? 'Sign in' : 'Sign up'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href="/accounts/signup"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  href="/accounts/login"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
          
          <div className="text-muted-foreground text-xs text-center">
            <p>Having trouble signing in? Try clearing your session data.</p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-1 h-auto p-0 text-xs"
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
        </CardFooter>
      </Card>
    </div>
  );
}
