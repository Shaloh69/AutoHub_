"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '@/services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.resetPassword(token, password);

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(response.error || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('An error occurred. Please try again or request a new reset link.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 px-4 py-12">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="flex flex-col items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Password Reset Successful!</h1>
          </CardHeader>
          <CardBody className="gap-6 p-8">
            <div className="text-center">
              <p className="mb-6 text-lg text-default-700">
                Your password has been successfully reset.
              </p>
              <p className="mb-8 text-sm text-default-500">
                Redirecting you to login page in 3 seconds...
              </p>

              <Button
                color="primary"
                fullWidth
                onPress={() => router.push('/auth/login')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 font-semibold text-white shadow-lg hover:shadow-xl"
              >
                Go to Login Now
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-col items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 p-8 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="text-sm text-white/90">Enter your new password below</p>
        </CardHeader>
        <CardBody className="gap-6 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type={showPassword ? "text" : "password"}
                label="New Password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="bordered"
                size="lg"
                isRequired
                autoFocus
                classNames={{
                  input: "text-base",
                  label: "text-sm font-semibold"
                }}
                startContent={
                  <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-default-500">Password must contain:</p>
                <ul className="ml-4 space-y-0.5 text-xs">
                  <li className={password.length >= 8 ? "text-success-600" : "text-default-400"}>
                    • At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-success-600" : "text-default-400"}>
                    • One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? "text-success-600" : "text-default-400"}>
                    • One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-success-600" : "text-default-400"}>
                    • One number
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm New Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="bordered"
                size="lg"
                isRequired
                classNames={{
                  input: "text-base",
                  label: "text-sm font-semibold"
                }}
                startContent={
                  <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger-50 p-4 dark:bg-danger-900/20">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-danger-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              isDisabled={!token}
              className="bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-white shadow-lg hover:shadow-xl"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-default-600">Remember your password?</span>
            <Link
              href="/auth/login"
              className="font-semibold text-primary hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
