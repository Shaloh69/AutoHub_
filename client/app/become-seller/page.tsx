// ==========================================
// app/become-seller/page.tsx - Buyer to Seller Upgrade
// ==========================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { RadioGroup, Radio } from '@heroui/radio';
import { Divider } from '@heroui/divider';
import {
  Store, Check, X, AlertCircle, ShieldCheck,
  TrendingUp, Users, DollarSign, Star
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function BecomeSellerPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<'SELLER' | 'DEALER'>('SELLER');
  const [reason, setReason] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPermit, setBusinessPermit] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [dtiRegistration, setDtiRegistration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user can upgrade
  const canUpgrade = user?.role?.toUpperCase() === 'BUYER';
  const isEmailVerified = user?.email_verified;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified) {
      setError('Please verify your email before upgrading your account.');
      return;
    }

    if (selectedRole === 'DEALER' && !businessName) {
      setError('Business name is required for dealer accounts.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.upgradeRole({
        new_role: selectedRole,
        reason,
        business_name: selectedRole === 'DEALER' ? businessName : undefined,
        business_permit_number: selectedRole === 'DEALER' ? businessPermit : undefined,
        tin_number: selectedRole === 'DEALER' ? tinNumber : undefined,
        dti_registration: selectedRole === 'DEALER' ? dtiRegistration : undefined,
      });

      if (response.success) {
        setSuccess(true);
        // User will be refreshed on next page load
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(response.error || 'Failed to upgrade account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canUpgrade) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <AlertCircle className="mx-auto text-yellow-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Account Upgrade Not Available
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your account is already a {user?.role} account. Only buyers can upgrade to seller or dealer accounts.
              </p>
              <Button
                color="primary"
                onPress={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="text-green-600 dark:text-green-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upgrade Successful!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your account has been upgraded to {selectedRole}. Redirecting to dashboard...
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Store size={16} />
            <span>Become a Seller</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Start Selling Your Cars
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upgrade your account to start listing and selling vehicles on AutoHub Philippines
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardBody className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reach More Buyers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect with thousands of potential buyers
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                <Users className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Listings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powerful tools to manage your inventory
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                <DollarSign className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Earn More</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Maximize your sales with premium features
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-3">
                <Star className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Build Reputation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get ratings and reviews from buyers
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Upgrade Form */}
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upgrade Your Account
              </h2>
            </CardHeader>
            <CardBody>
              {!isEmailVerified && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                        Email Verification Required
                      </h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        Please verify your email address before upgrading your account. Check your inbox for the verification link.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <X className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Account Type
                  </label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as 'SELLER' | 'DEALER')}
                  >
                    <Radio value="SELLER">
                      <div className="ml-2">
                        <div className="font-semibold text-gray-900 dark:text-white">Individual Seller</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          For individuals selling personal vehicles
                        </div>
                      </div>
                    </Radio>
                    <Radio value="DEALER">
                      <div className="ml-2">
                        <div className="font-semibold text-gray-900 dark:text-white">Dealer Account</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          For car dealerships and business sellers
                        </div>
                      </div>
                    </Radio>
                  </RadioGroup>
                </div>

                <Divider />

                {/* Dealer-specific fields */}
                {selectedRole === 'DEALER' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck size={20} />
                      Business Information
                    </h3>

                    <Input
                      label="Business Name"
                      placeholder="Your dealership or company name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      isRequired
                      description="Official registered business name"
                    />

                    <Input
                      label="Business Permit Number (Optional)"
                      placeholder="e.g., BPN-2024-12345"
                      value={businessPermit}
                      onChange={(e) => setBusinessPermit(e.target.value)}
                      description="Mayor's permit or business license number"
                    />

                    <Input
                      label="TIN Number (Optional)"
                      placeholder="e.g., 123-456-789-000"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      description="Tax Identification Number"
                    />

                    <Input
                      label="DTI Registration (Optional)"
                      placeholder="e.g., DTI-2024-12345"
                      value={dtiRegistration}
                      onChange={(e) => setDtiRegistration(e.target.value)}
                      description="Department of Trade and Industry registration"
                    />

                    <Divider />
                  </div>
                )}

                {/* Reason (optional) */}
                <Textarea
                  label="Why do you want to become a seller? (Optional)"
                  placeholder="Tell us about your plans for selling vehicles..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minRows={3}
                  description="This helps us understand our sellers better"
                />

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    variant="flat"
                    onPress={() => router.push('/profile')}
                    isDisabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={loading}
                    isDisabled={!isEmailVerified}
                    className="flex-1"
                    startContent={!loading && <Check size={18} />}
                  >
                    {loading ? 'Upgrading...' : 'Upgrade Account'}
                  </Button>
                </div>

                {selectedRole === 'DEALER' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Business verification may be required. Our team will review your information within 24-48 hours.
                  </p>
                )}
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
