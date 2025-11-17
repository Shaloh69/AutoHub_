// components/subscription/SubscriptionBadge.tsx
'use client';

import { Chip } from '@heroui/chip';
import { Crown, Sparkles, Zap, AlertCircle, Clock } from 'lucide-react';
import { Subscription } from '@/types';

interface SubscriptionBadgeProps {
  subscription: Subscription | null;
  size?: 'sm' | 'md' | 'lg';
  showExpiry?: boolean;
  className?: string;
}

export function SubscriptionBadge({
  subscription,
  size = 'md',
  showExpiry = false,
  className = ''
}: SubscriptionBadgeProps) {
  if (!subscription || !subscription.plan) {
    return (
      <Chip
        size={size}
        variant="flat"
        className={`bg-gray-100 text-gray-600 ${className}`}
      >
        Free Plan
      </Chip>
    );
  }

  const getPlanIcon = () => {
    const planName = subscription.plan?.name?.toLowerCase() || '';
    if (planName.includes('business')) return <Crown size={16} />;
    if (planName.includes('pro')) return <Zap size={16} />;
    if (planName.includes('basic')) return <Sparkles size={16} />;
    return null;
  };

  const getPlanColor = (): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    const planName = subscription.plan?.name?.toLowerCase() || '';
    if (planName.includes('business')) return 'warning';
    if (planName.includes('pro')) return 'secondary';
    if (planName.includes('basic')) return 'primary';
    return 'default';
  };

  const getStatusColor = (): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (subscription.status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const isExpiringSoon = () => {
    if (!subscription.current_period_end && !subscription.expires_at) return false;
    const expiryDate = new Date(subscription.current_period_end || subscription.expires_at || '');
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const formatExpiryDate = () => {
    const expiryDate = subscription.current_period_end || subscription.expires_at;
    if (!expiryDate) return null;
    return new Date(expiryDate).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <Chip
        size={size}
        color={getPlanColor()}
        variant="flat"
        startContent={getPlanIcon()}
        className="font-semibold"
      >
        {subscription.plan.name}
      </Chip>

      {showExpiry && (subscription.current_period_end || subscription.expires_at) && (
        <div className="flex items-center gap-1 text-xs">
          {subscription.status === 'ACTIVE' && (
            <>
              {isExpiringSoon() ? (
                <Chip
                  size="sm"
                  color="warning"
                  variant="flat"
                  startContent={<AlertCircle size={12} />}
                  className="text-[10px]"
                >
                  Expires {formatExpiryDate()}
                </Chip>
              ) : (
                <Chip
                  size="sm"
                  color="default"
                  variant="flat"
                  startContent={<Clock size={12} />}
                  className="text-[10px]"
                >
                  Until {formatExpiryDate()}
                </Chip>
              )}
            </>
          )}
          {subscription.status === 'CANCELLED' && subscription.cancelled_at && (
            <Chip
              size="sm"
              color="danger"
              variant="flat"
              className="text-[10px]"
            >
              Cancelled
            </Chip>
          )}
          {subscription.status === 'EXPIRED' && (
            <Chip
              size="sm"
              color="danger"
              variant="flat"
              className="text-[10px]"
            >
              Expired
            </Chip>
          )}
        </div>
      )}

      {subscription.status !== 'ACTIVE' && (
        <Chip
          size="sm"
          color={getStatusColor()}
          variant="bordered"
          className="text-[10px]"
        >
          {subscription.status}
        </Chip>
      )}
    </div>
  );
}

export default SubscriptionBadge;
