// app/subscription/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { CheckIcon } from "@/components/icons";
import { apiService, SubscriptionPlan, Subscription } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionData();
    }
  }, [isAuthenticated]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [plansResponse, currentSubResponse, limitsResponse] = await Promise.all([
        apiService.getSubscriptionPlans(),
        apiService.getCurrentSubscription(),
        apiService.getUserLimits()
      ]);

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data);
      }

      if (currentSubResponse.success && currentSubResponse.data) {
        setCurrentSubscription(currentSubResponse.data);
      }

      if (limitsResponse.success && limitsResponse.data) {
        setUserLimits(limitsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setActionLoading(planId);
      const response = await apiService.subscribe(planId);
      
      if (response.success) {
        await fetchSubscriptionData();
      } else {
        throw new Error(response.error || 'Subscription failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setActionLoading(planId);
      const response = await apiService.upgradeSubscription(planId);
      
      if (response.success) {
        await fetchSubscriptionData();
      } else {
        throw new Error(response.error || 'Upgrade failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading('cancel');
      const response = await apiService.cancelSubscription();
      
      if (response.success) {
        await fetchSubscriptionData();
      } else {
        throw new Error(response.error || 'Cancellation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-autohub-accent2-500/10 text-autohub-accent2-600 px-4 py-2 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-autohub-accent2-500 rounded-full animate-pulse"></span>
          Premium Memberships
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
          AutoHub
          <span className="bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent ml-3">
            Premium
          </span>
        </h1>
        <p className="text-xl text-autohub-accent1-600 max-w-3xl mx-auto">
          Unlock the full potential of your automotive business with our premium subscription plans
        </p>
      </div>

      {error && (
        <div className="bg-autohub-primary-50 border-l-4 border-autohub-primary-500 text-autohub-primary-700 px-6 py-4 rounded">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="border border-autohub-accent2-300 bg-gradient-to-br from-autohub-accent2-50 to-autohub-neutral-50 dark:from-autohub-accent2-950 dark:to-autohub-secondary-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-autohub-accent2-500 rounded-xl flex items-center justify-center">
                <span className="text-autohub-secondary-900 font-bold text-lg">★</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                  Current Subscription
                </h3>
                <p className="text-autohub-accent1-600">Your premium membership</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-2xl font-bold text-autohub-primary-500">
                    {currentSubscription.plan.name}
                  </h4>
                  <p className="text-autohub-accent1-600">{currentSubscription.plan.description}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-autohub-accent1-600">Status:</span>
                    <Chip 
                      size="sm"
                      className={`${
                        currentSubscription.status === 'ACTIVE' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {currentSubscription.status}
                    </Chip>
                  </div>
                  <div className="text-autohub-accent1-600">
                    <span>Renews:</span> <span className="font-medium">{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</span>
                  </div>
                  {userLimits && (
                    <div className="text-autohub-accent1-600">
                      <span>Listings:</span> <span className="font-medium">{userLimits.usedListings} / {currentSubscription.plan.maxListings === -1 ? '∞' : currentSubscription.plan.maxListings}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right space-y-3">
                <div>
                  <p className="text-3xl font-bold text-autohub-primary-500">
                    ${currentSubscription.plan.price}
                  </p>
                  <p className="text-autohub-accent1-600">per {currentSubscription.plan.interval.toLowerCase()}</p>
                </div>
                {currentSubscription.status === 'ACTIVE' && !currentSubscription.cancelAtPeriodEnd && (
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={handleCancelSubscription}
                    isLoading={actionLoading === 'cancel'}
                    className="border-autohub-primary-500 text-autohub-primary-500 hover:bg-autohub-primary-500 hover:text-white"
                  >
                    Cancel Subscription
                  </Button>
                )}
                {currentSubscription.cancelAtPeriodEnd && (
                  <Chip color="warning" size="sm" className="bg-amber-500 text-white">
                    Cancels at period end
                  </Chip>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans
          .sort((a, b) => a.price - b.price)
          .map((plan) => {
            const isCurrent = currentSubscription?.planId === plan.id;
            const canUpgrade = currentSubscription && 
              currentSubscription.plan.price < plan.price && 
              !isCurrent;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-autohub ${
                  plan.priority === 1 
                    ? 'border-2 border-autohub-accent2-500 shadow-gold' 
                    : 'border border-autohub-accent1-200 hover:border-autohub-primary-500/50'
                }`}
              >
                {plan.priority === 1 && (
                  <>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Chip className="bg-autohub-accent2-500 text-autohub-secondary-900 font-bold" size="lg">
                        Most Popular
                      </Chip>
                    </div>
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-autohub-accent2-500">
                      <span className="absolute -bottom-12 -right-3 text-autohub-secondary-900 font-bold text-lg rotate-45">★</span>
                    </div>
                  </>
                )}
                
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                      {plan.name}
                    </h3>
                    <p className="text-autohub-accent1-600">{plan.description}</p>
                  </div>
                </CardHeader>
                
                <CardBody className="space-y-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-autohub-primary-500 mb-2">
                      ${plan.price}
                    </div>
                    <div className="text-autohub-accent1-600">
                      per {plan.interval.toLowerCase()}
                    </div>
                  </div>

                  <Divider className="bg-autohub-accent1-200" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                      <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                        {plan.maxListings === -1 ? 'Unlimited' : plan.maxListings} premium listings
                      </span>
                    </div>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                        <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    {isCurrent ? (
                      <Button 
                        className="w-full bg-autohub-accent1-200 text-autohub-accent1-700 cursor-not-allowed" 
                        disabled
                        size="lg"
                      >
                        Current Plan
                      </Button>
                    ) : canUpgrade ? (
                      <Button
                        className="w-full bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold shadow-autohub transition-all duration-200 hover:shadow-lg hover:scale-105"
                        size="lg"
                        onPress={() => handleUpgrade(plan.id)}
                        isLoading={actionLoading === plan.id}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    ) : !currentSubscription ? (
                      <Button
                        className={`w-full font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                          plan.priority === 1
                            ? 'bg-autohub-accent2-500 hover:bg-autohub-accent2-600 text-autohub-secondary-900 shadow-gold'
                            : 'bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white shadow-autohub'
                        }`}
                        size="lg"
                        onPress={() => handleSubscribe(plan.id)}
                        isLoading={actionLoading === plan.id}
                      >
                        Get Started
                      </Button>
                    ) : (
                      <Button 
                        variant="bordered"
                        className="w-full border-autohub-accent1-300 text-autohub-accent1-600 cursor-not-allowed" 
                        disabled
                        size="lg"
                      >
                        {currentSubscription.plan.price > plan.price ? 'Lower Tier' : 'Contact Support'}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
      </div>

      {/* Features Comparison */}
      <Card className="border border-autohub-accent1-200">
        <CardHeader>
          <h3 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Detailed Comparison
          </h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-autohub-accent1-200">
                  <th className="text-left py-4 px-2 text-autohub-secondary-900 dark:text-autohub-neutral-50 font-semibold">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-2 text-autohub-secondary-900 dark:text-autohub-neutral-50 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-autohub-accent1-200">
                  <td className="py-4 px-2 text-autohub-accent1-700 font-medium">Vehicle Listings</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4 px-2 text-autohub-secondary-900 dark:text-autohub-neutral-50">
                      <span className="font-semibold">
                        {plan.maxListings === -1 ? 'Unlimited' : plan.maxListings}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-autohub-accent1-200">
                  <td className="py-4 px-2 text-autohub-accent1-700 font-medium">Photo Uploads</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4 px-2">
                      <CheckIcon className="text-autohub-accent2-500 mx-auto" size={20} />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-autohub-accent1-200">
                  <td className="py-4 px-2 text-autohub-accent1-700 font-medium">Featured Listings</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4 px-2">
                      {plan.features.includes('Featured listings') ? (
                        <CheckIcon className="text-autohub-accent2-500 mx-auto" size={20} />
                      ) : (
                        <span className="text-autohub-accent1-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-autohub-accent1-200">
                  <td className="py-4 px-2 text-autohub-accent1-700 font-medium">Priority Support</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4 px-2">
                      {plan.features.includes('Priority support') ? (
                        <CheckIcon className="text-autohub-accent2-500 mx-auto" size={20} />
                      ) : (
                        <span className="text-autohub-accent1-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-2 text-autohub-accent1-700 font-medium">Analytics Dashboard</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4 px-2">
                      {plan.features.includes('Advanced analytics') ? (
                        <CheckIcon className="text-autohub-accent2-500 mx-auto" size={20} />
                      ) : (
                        <span className="text-autohub-accent1-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}