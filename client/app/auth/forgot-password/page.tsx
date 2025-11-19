"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '@/services/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.forgotPassword(email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Forgot password error:', err);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Check Your Email</h1>
          </CardHeader>
          <CardBody className="gap-6 p-8">
            <div className="text-center">
              <p className="mb-4 text-lg text-default-700">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="mb-6 text-sm text-default-500">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </p>

              <div className="space-y-3">
                <Button
                  color="primary"
                  variant="flat"
                  fullWidth
                  onPress={() => router.push('/auth/login')}
                  className="font-semibold"
                >
                  Back to Login
                </Button>

                <Button
                  variant="light"
                  fullWidth
                  onPress={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="font-semibold"
                >
                  Send Another Email
                </Button>
              </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-sm text-white/90">No worries, we'll send you reset instructions</p>
        </CardHeader>
        <CardBody className="gap-6 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="bordered"
                size="lg"
                isRequired
                autoFocus
                isInvalid={!!error && !email}
                errorMessage={!!error && !email ? error : undefined}
                classNames={{
                  input: "text-base",
                  label: "text-sm font-semibold"
                }}
                startContent={
                  <svg className="h-5 w-5 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
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
              className="bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-white shadow-lg hover:shadow-xl"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
