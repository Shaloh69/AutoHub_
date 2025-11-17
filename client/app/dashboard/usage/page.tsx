'use client';

import { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody} from "@heroui/card";
import {Progress} from "@heroui/progress";
import {Chip} from "@heroui/chip";
import {Spinner} from "@heroui/spinner";
import {Button} from "@heroui/button";
import {
  TrendingUp, Package, Star, Image, Zap, Calendar, AlertCircle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface FeatureUsage {
  active_listings: {
    used: number;
    limit: number;
    percentage: number;
  };
  featured_listings: {
    used: number;
    limit: number;
    percentage: number;
  };
  premium_listings: {
    used: number;
    limit: number;
    percentage: number;
  };
  images_per_listing: {
    limit: number;
  };
  boost_credits: {
    remaining: number;
    total: number;
  };
}

export default function SubscriptionUsagePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.request('/subscriptions/features/usage');

      if (response.success && response.data) {
        setFeatureUsage(response.data);
      } else {
        setError(response.error || 'Failed to load usage data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'primary';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
            <CardBody className="p-12 text-center">
              <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Usage Data</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button
                color="primary"
                onPress={loadUsageData}
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (!featureUsage) {
    return (
      <div className="min-h-screen bg-transparent py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
            <CardBody className="p-12 text-center">
              <Package className="mx-auto text-gray-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Subscription</h2>
              <p className="text-gray-400 mb-6">
                You don't have an active subscription. Upgrade to unlock premium features!
              </p>
              <Button
                as={Link}
                href="/subscriptions"
                color="primary"
                size="lg"
              >
                View Subscription Plans
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient-red mb-2">
            Subscription Usage
          </h1>
          <p className="text-xl text-gray-400">
            Track your plan usage and limits
          </p>
        </div>

        {/* Active Listings */}
        <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
          <CardHeader className="border-b border-dark-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Package className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Active Listings</h3>
                <p className="text-sm text-gray-400">Current active car listings</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">
                  {featureUsage.active_listings.used} of {featureUsage.active_listings.limit} used
                </span>
                <Chip
                  color={getProgressColor(featureUsage.active_listings.percentage) as any}
                  variant="flat"
                  size="sm"
                >
                  {featureUsage.active_listings.percentage}%
                </Chip>
              </div>
              <Progress
                value={featureUsage.active_listings.percentage}
                color={getProgressColor(featureUsage.active_listings.percentage) as any}
                className="max-w-full"
              />
            </div>
          </CardBody>
        </Card>

        {/* Featured Listings */}
        <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
          <CardHeader className="border-b border-dark-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Star className="text-yellow-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Featured Listings</h3>
                <p className="text-sm text-gray-400">Premium featured placements</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">
                  {featureUsage.featured_listings.used} of {featureUsage.featured_listings.limit} used
                </span>
                <Chip
                  color={getProgressColor(featureUsage.featured_listings.percentage) as any}
                  variant="flat"
                  size="sm"
                >
                  {featureUsage.featured_listings.percentage}%
                </Chip>
              </div>
              <Progress
                value={featureUsage.featured_listings.percentage}
                color={getProgressColor(featureUsage.featured_listings.percentage) as any}
                className="max-w-full"
              />
            </div>
          </CardBody>
        </Card>

        {/* Premium Listings */}
        <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
          <CardHeader className="border-b border-dark-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="text-purple-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Premium Listings</h3>
                <p className="text-sm text-gray-400">Priority search placement</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">
                  {featureUsage.premium_listings.used} of {featureUsage.premium_listings.limit} used
                </span>
                <Chip
                  color={getProgressColor(featureUsage.premium_listings.percentage) as any}
                  variant="flat"
                  size="sm"
                >
                  {featureUsage.premium_listings.percentage}%
                </Chip>
              </div>
              <Progress
                value={featureUsage.premium_listings.percentage}
                color={getProgressColor(featureUsage.premium_listings.percentage) as any}
                className="max-w-full"
              />
            </div>
          </CardBody>
        </Card>

        {/* Other Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images Per Listing */}
          <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
            <CardHeader className="border-b border-dark-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Image className="text-green-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Images Per Listing</h3>
                  <p className="text-sm text-gray-400">Maximum images allowed</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gradient-red mb-2">
                  {featureUsage.images_per_listing.limit}
                </p>
                <p className="text-gray-400">images per listing</p>
              </div>
            </CardBody>
          </Card>

          {/* Boost Credits */}
          <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
            <CardHeader className="border-b border-dark-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-500/20 rounded-lg">
                  <Zap className="text-primary-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Boost Credits</h3>
                  <p className="text-sm text-gray-400">Monthly boost allowance</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gradient-red mb-2">
                  {featureUsage.boost_credits.remaining}
                </p>
                <p className="text-gray-400">
                  of {featureUsage.boost_credits.total} remaining
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Upgrade CTA */}
        <Card className="bg-gradient-red-dark border border-primary-700">
          <CardBody className="p-8 text-center">
            <Calendar className="mx-auto text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">Need More Features?</h3>
            <p className="text-gray-200 mb-6">
              Upgrade your subscription to unlock higher limits and premium features
            </p>
            <Button
              as={Link}
              href="/subscriptions"
              className="bg-white text-primary-600 hover:bg-gray-100"
              size="lg"
            >
              View Subscription Plans
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
