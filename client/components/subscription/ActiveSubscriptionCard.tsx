// components/subscription/ActiveSubscriptionCard.tsx
'use client';

import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Crown, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { Subscription } from '@/types';
import { useRouter } from 'next/navigation';

interface ActiveSubscriptionCardProps {
  subscription: Subscription | null;
  userLimits?: {
    usedListings: number;
    usedFeatured: number;
    remainingListings: number;
    remainingFeatured: number;
  } | null;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ActiveSubscriptionCard({
  subscription,
  userLimits,
  showUpgradeButton = true,
  onUpgrade,
  onCancel,
  loading = false
}: ActiveSubscriptionCardProps) {
  const router = useRouter();

  if (!subscription || !subscription.plan) {
    // Free Plan State
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're on the Free Plan
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upgrade to unlock more features and grow your business
          </p>
          <Button
            color="primary"
            size="lg"
            onPress={() => router.push('/subscription')}
            startContent={<Crown size={20} />}
          >
            View Premium Plans
          </Button>
        </CardBody>
      </Card>
    );
  }

  const getDaysRemaining = () => {
    const expiryDate = subscription.current_period_end || subscription.expires_at;
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getListingsProgress = () => {
    if (!userLimits) return 0;
    const maxListings = subscription.plan.max_listings === -1 ? Infinity : subscription.plan.max_listings;
    if (maxListings === Infinity) return 0;
    return (userLimits.usedListings / maxListings) * 100;
  };

  const getFeaturedProgress = () => {
    if (!userLimits) return 0;
    const maxFeatured = subscription.plan.max_featured_listings;
    if (maxFeatured === 0) return 0;
    return (userLimits.usedFeatured / maxFeatured) * 100;
  };

  const getPlanIcon = () => {
    const planName = subscription.plan.name.toLowerCase();
    if (planName.includes('business')) return <Crown className="text-yellow-500" size={28} />;
    if (planName.includes('pro')) return <Sparkles className="text-purple-500" size={28} />;
    return <TrendingUp className="text-blue-500" size={28} />;
  };

  const getPlanGradient = () => {
    const planName = subscription.plan.name.toLowerCase();
    if (planName.includes('business'))
      return 'from-yellow-500/10 via-yellow-50 to-orange-50 dark:from-yellow-500/5 dark:via-yellow-950 dark:to-orange-950';
    if (planName.includes('pro'))
      return 'from-purple-500/10 via-purple-50 to-pink-50 dark:from-purple-500/5 dark:via-purple-950 dark:to-pink-950';
    return 'from-blue-500/10 via-blue-50 to-cyan-50 dark:from-blue-500/5 dark:via-blue-950 dark:to-cyan-950';
  };

  return (
    <Card className={`border-2 bg-gradient-to-br ${getPlanGradient()} ${
      isExpiringSoon ? 'border-orange-400' : isExpired ? 'border-red-400' : 'border-primary-400'
    }`}>
      <CardHeader className="flex-col items-start gap-3 pb-4">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
              {getPlanIcon()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {subscription.plan.name} Plan
                {subscription.status === 'ACTIVE' && !isExpired && (
                  <Chip size="sm" color="success" variant="flat">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={12} />
                      Active
                    </div>
                  </Chip>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.plan.description || `₱${subscription.plan.price} per ${subscription.billing_cycle.toLowerCase()}`}
              </p>
            </div>
          </div>

          {subscription.status !== 'CANCELLED' && !isExpired && showUpgradeButton && onUpgrade && (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={onUpgrade}
            >
              Upgrade
            </Button>
          )}
        </div>

        {/* Expiry Warning */}
        {isExpiringSoon && subscription.status === 'ACTIVE' && (
          <div className="w-full bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">
                Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="w-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <XCircle size={18} />
              <span className="text-sm font-medium">
                Your subscription has expired
              </span>
            </div>
          </div>
        )}

        {subscription.cancelled_at && subscription.status !== 'CANCELLED' && (
          <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">
                Subscription will cancel at period end ({formatDate(subscription.current_period_end)})
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Subscription Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
              <Calendar size={14} />
              Billing
            </div>
            <div className="font-semibold text-gray-900 dark:text-white capitalize">
              {subscription.billing_cycle.toLowerCase()}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
              <Clock size={14} />
              {subscription.status === 'ACTIVE' ? 'Renews' : 'Expires'}
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatDate(subscription.current_period_end || subscription.expires_at)}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Price
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              ₱{subscription.plan.price}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Auto-Renew
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {subscription.auto_renew ? 'On' : 'Off'}
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        {userLimits && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Usage</h4>

            {/* Listings Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Active Listings</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {userLimits.usedListings} / {subscription.plan.max_listings === -1 ? '∞' : subscription.plan.max_listings}
                </span>
              </div>
              {subscription.plan.max_listings !== -1 && (
                <Progress
                  value={getListingsProgress()}
                  color={getListingsProgress() > 80 ? 'danger' : getListingsProgress() > 60 ? 'warning' : 'success'}
                  size="sm"
                  className="w-full"
                />
              )}
            </div>

            {/* Featured Listings Usage */}
            {subscription.plan.max_featured_listings > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Featured Listings</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {userLimits.usedFeatured} / {subscription.plan.max_featured_listings}
                  </span>
                </div>
                <Progress
                  value={getFeaturedProgress()}
                  color={getFeaturedProgress() > 80 ? 'danger' : getFeaturedProgress() > 60 ? 'warning' : 'success'}
                  size="sm"
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {subscription.status === 'ACTIVE' && !subscription.cancelled_at && onCancel && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              size="sm"
              variant="bordered"
              color="danger"
              onPress={onCancel}
              isLoading={loading}
              className="w-full"
            >
              Cancel Subscription
            </Button>
          </div>
        )}

        {isExpired && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              size="lg"
              color="primary"
              onPress={() => router.push('/subscription')}
              className="w-full"
            >
              Renew Subscription
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ActiveSubscriptionCard;
