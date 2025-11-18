// app/seller/subscription/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/spinner";
import {
  Crown, TrendingUp, Image, Star, Video, Glasses,
  BarChart3, Headphones, CheckCircle, XCircle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UsageWarning from '@/components/UsageWarning';
import LockedFeatureBadge from '@/components/LockedFeatureBadge';
import SellerLayout from '@/components/seller/SellerLayout';

export default function SellerSubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscriptionData();
    }
  }, [isAuthenticated]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subResponse, usageResponse] = await Promise.all([
        apiService.getCurrentSubscription(),
        apiService.getUserLimits()
      ]);

      if (subResponse.success && subResponse.data) {
        setSubscription(subResponse.data);
      }

      if (usageResponse.success && usageResponse.data) {
        setUsage(usageResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const plan = subscription?.plan;
  const isActive = subscription?.status === 'ACTIVE';

  return (
    <SellerLayout>
      <div className="container mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50 mb-2">
          My Subscription
        </h1>
        <p className="text-autohub-accent1-600">
          Manage your subscription plan and track your usage
        </p>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200 border-2 mb-6">
          <CardBody className="p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Current Plan */}
      <Card className="mb-6 bg-gradient-to-br from-autohub-primary-500 to-autohub-primary-700 text-white">
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {plan?.name || 'Free Plan'}
                  </h2>
                  <Chip
                    color={isActive ? 'success' : 'default'}
                    variant="flat"
                    className="bg-white/20 text-white"
                  >
                    {subscription?.status || 'FREE'}
                  </Chip>
                </div>

                <p className="text-white/80 mb-4">
                  {plan?.description || 'Basic features to get started'}
                </p>

                {subscription && (
                  <div className="text-sm text-white/70">
                    <p>Active since: {new Date(subscription.subscribed_at).toLocaleDateString()}</p>
                    {subscription.current_period_end && (
                      <p>Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              color="default"
              variant="flat"
              onPress={() => router.push('/subscription')}
              className="bg-white text-autohub-primary-600 hover:bg-white/90"
            >
              {isActive ? 'Manage Plan' : 'Upgrade Now'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Usage Statistics */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Active Listings Usage */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-autohub-primary-600" />
                <h3 className="text-lg font-semibold">Active Listings</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-autohub-secondary-900">
                    {usage.active_listings?.used || 0}
                  </span>
                  <span className="text-sm text-autohub-accent1-600">
                    of {usage.active_listings?.limit || 0} available
                  </span>
                </div>
                <Progress
                  value={usage.active_listings?.percentage || 0}
                  color={usage.active_listings?.percentage >= 80 ? 'danger' : 'primary'}
                  className="h-2"
                />
                <UsageWarning
                  used={usage.active_listings?.used || 0}
                  limit={usage.active_listings?.limit || 0}
                  feature="Active Listings"
                  unit="listings"
                />
              </div>
            </CardBody>
          </Card>

          {/* Featured Listings Usage */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Featured Listings</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-autohub-secondary-900">
                    {usage.featured_listings?.used || 0}
                  </span>
                  <span className="text-sm text-autohub-accent1-600">
                    of {usage.featured_listings?.limit || 0} available
                  </span>
                </div>
                <Progress
                  value={usage.featured_listings?.percentage || 0}
                  color={usage.featured_listings?.percentage >= 80 ? 'danger' : 'warning'}
                  className="h-2"
                />
                {(usage.featured_listings?.limit || 0) === 0 && (
                  <LockedFeatureBadge
                    feature="Featured Listings"
                    requiredPlan="Premium"
                    description="Boost your listings to the top of search results"
                  />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Images Per Listing */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Images Per Listing</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-autohub-secondary-900">
                  {usage.images_per_listing?.limit || 0}
                </span>
                <span className="text-sm text-autohub-accent1-600">
                  photos allowed
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Boost Credits */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Boost Credits</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-autohub-secondary-900">
                  {usage.boost_credits?.remaining || 0}
                </span>
                <span className="text-sm text-autohub-accent1-600">
                  of {usage.boost_credits?.total || 0} remaining
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Premium Features */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Plan Features</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video Upload */}
            <div className="flex items-center gap-3">
              {plan?.can_add_video ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${plan?.can_add_video ? 'text-autohub-secondary-900' : 'text-gray-400'}`}>
                  Video Upload
                </p>
                <p className="text-xs text-autohub-accent1-600">
                  Add videos to your listings
                </p>
              </div>
            </div>

            {/* Virtual Tour */}
            <div className="flex items-center gap-3">
              {plan?.can_add_virtual_tour ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${plan?.can_add_virtual_tour ? 'text-autohub-secondary-900' : 'text-gray-400'}`}>
                  Virtual Tour
                </p>
                <p className="text-xs text-autohub-accent1-600">
                  360° virtual car tours
                </p>
              </div>
            </div>

            {/* Advanced Analytics */}
            <div className="flex items-center gap-3">
              {plan?.advanced_analytics ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${plan?.advanced_analytics ? 'text-autohub-secondary-900' : 'text-gray-400'}`}>
                  Advanced Analytics
                </p>
                <p className="text-xs text-autohub-accent1-600">
                  Detailed performance insights
                </p>
              </div>
            </div>

            {/* Priority Support */}
            <div className="flex items-center gap-3">
              {plan?.priority_support ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${plan?.priority_support ? 'text-autohub-secondary-900' : 'text-gray-400'}`}>
                  Priority Support
                </p>
                <p className="text-xs text-autohub-accent1-600">
                  Get help faster
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      </div>
    </SellerLayout>
  );
}
