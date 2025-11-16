// ==========================================
// app/auth/verify-email/page.tsx - Email Verification Page
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { apiService } from '@/services/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError('No verification token provided');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    try {
      setVerifying(true);
      setError(null);

      const response = await apiService.verifyEmail(token);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Email verification failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRetry = () => {
    if (token) {
      verifyEmail();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your email address
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="flex flex-col gap-3 px-6 pt-6">
            <div className="flex items-center justify-center w-full">
              <Mail className="text-blue-600" size={32} />
            </div>
          </CardHeader>

          <CardBody className="gap-4 px-6 py-8">
            {verifying ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Spinner size="lg" color="primary" className="mb-4" />
                <h3 className="text-xl font-semibold mb-2">Verifying your email...</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we verify your email address.
                </p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                  Email Verified Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your email has been verified. You can now access all features of AutoHub.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle size={64} className="text-red-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                  Verification Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error || 'Unable to verify your email address.'}
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    The verification link may have expired or is invalid.
                  </p>
                </div>
              </div>
            )}
          </CardBody>

          <CardFooter className="flex flex-col gap-3 px-6 pb-6">
            {!verifying && (
              <>
                {success ? (
                  <Button
                    color="primary"
                    size="lg"
                    className="w-full"
                    onPress={() => router.push('/auth/login')}
                  >
                    Continue to Login
                  </Button>
                ) : (
                  <>
                    <Button
                      color="primary"
                      variant="flat"
                      size="lg"
                      className="w-full"
                      onPress={handleRetry}
                    >
                      Try Again
                    </Button>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Need help?{' '}
                      <Link
                        href="/contact"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Contact Support
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
