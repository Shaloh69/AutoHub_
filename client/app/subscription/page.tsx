// app/subscription/page.tsx - IMPROVED VERSION
"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { CheckIcon } from "@/components/icons";
import { apiService, getImageUrl } from '@/services/api';
import { SubscriptionPlan, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PaymentQRModal from '@/components/PaymentQRModal';
import { ActiveSubscriptionCard } from '@/components/subscription/ActiveSubscriptionCard';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Crown, Sparkles, Zap, TrendingUp, CheckCircle as CheckCircleIcon, Clock, AlertCircle } from 'lucide-react';

interface PaymentHistory {
  id: number;
  amount: number;
  currency_id: number;
  payment_method: string;
  status: string;
  reference_number: string | null;
  submitted_at: string | null;
  admin_verified_at: string | null;
  created_at: string;
}

export default function SubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [pendingSubscription, setPendingSubscription] = useState<{
    paymentId: number;
    planName: string;
    amount: number;
    qrCodeUrl: string;
    instructions: string;
  } | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentHistory[]>([]);
  const [dismissedPayments, setDismissedPayments] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchSubscriptionData();
  }, [isAuthenticated, router]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, currentSubResponse, limitsResponse, paymentsResponse] = await Promise.all([
        apiService.getSubscriptionPlans(),
        apiService.getCurrentSubscription(),
        apiService.getUserLimits(),
        apiService.getPaymentHistory()
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

      if (paymentsResponse.success && paymentsResponse.data) {
        setPaymentHistory(paymentsResponse.data);
        const pending = paymentsResponse.data.filter(
          (p: PaymentHistory) => p.status === 'PENDING' && !p.admin_verified_at
        );
        setPendingPayments(pending);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleDismissPayment = (paymentId: number) => {
    setDismissedPayments(prev => new Set(prev).add(paymentId));
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPlan) return;

    try {
      setActionLoading(selectedPlan.id.toString());
      setError(null);

      const response = await apiService.subscribe({
        plan_id: selectedPlan.id,
        billing_cycle: 'MONTHLY',
        payment_method: 'QR_CODE'
      });

      if (response.success && response.data) {
        if (response.data.qr_code_url) {
          setPendingSubscription({
            paymentId: response.data.payment_id,
            planName: selectedPlan.name,
            amount: typeof response.data.amount === 'number' ? response.data.amount : parseFloat(response.data.amount),
            qrCodeUrl: response.data.qr_code_url,
            instructions: response.data.instructions || 'Please scan the QR code and submit your payment reference number.'
          });
          setShowPaymentModal(true);
        } else {
          throw new Error('QR code not available. Please contact support.');
        }
      } else {
        throw new Error(response.error || 'Subscription failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (planId: number) => {
    try {
      setActionLoading(planId.toString());
      setError(null);

      const response = await apiService.upgradeSubscription(planId);

      if (response.success && response.data) {
        const plan = plans.find(p => p.id === planId);
        if (plan && response.data.qr_code_url) {
          setPendingSubscription({
            paymentId: response.data.payment_id,
            planName: plan.name,
            amount: typeof response.data.amount === 'number' ? response.data.amount : parseFloat(response.data.amount),
            qrCodeUrl: response.data.qr_code_url,
            instructions: response.data.instructions || 'Please scan the QR code and submit your payment reference number.'
          });
          setShowPaymentModal(true);
        } else {
          throw new Error('QR code not available. Please contact support.');
        }
      } else {
        throw new Error(response.error || 'Upgrade failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentSubmitted = async () => {
    setShowPaymentModal(false);
    setPendingSubscription(null);
    setSelectedPlan(null);
    // Refresh subscription data to show updated status
    await fetchSubscriptionData();
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You can continue using it until the end of your billing period.')) {
      return;
    }

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

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('business')) return <Crown size={24} className="text-yellow-500" />;
    if (name.includes('pro')) return <Zap size={24} className="text-purple-500" />;
    if (name.includes('basic')) return <Sparkles size={24} className="text-blue-500" />;
    return <TrendingUp size={24} className="text-gray-500" />;
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 text-primary-600 px-4 py-2 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          Premium Memberships
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
          Choose Your
          <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent ml-3">
            Perfect Plan
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Unlock the full potential of your automotive business with our premium subscription plans
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-6 py-4 rounded">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Current Subscription Status - NEW DESIGN */}
      <ActiveSubscriptionCard
        subscription={currentSubscription}
        userLimits={userLimits}
        showUpgradeButton={true}
        onUpgrade={() => {
          const nextPlan = plans.find(p =>
            currentSubscription?.plan && p.price > (currentSubscription.plan.price || 0)
          );
          if (nextPlan) {
            handleUpgrade(nextPlan.id);
          }
        }}
        onCancel={handleCancelSubscription}
        loading={actionLoading === 'cancel'}
      />

      {/* Selected Plan Preview - NEW */}
      {selectedPlan && !currentSubscription && (
        <Card className="border-2 border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950">
          <CardBody className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getPlanIcon(selectedPlan.name)}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedPlan.name} Selected
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedPlan.description || `Perfect for ${selectedPlan.name.toLowerCase()} users`}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                    ₱{selectedPlan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    per {selectedPlan.billing_cycle?.toLowerCase() || 'month'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="bordered"
                  onPress={() => setSelectedPlan(null)}
                >
                  Change Plan
                </Button>
                <Button
                  color="primary"
                  size="lg"
                  onPress={handleConfirmSubscribe}
                  isLoading={actionLoading === selectedPlan.id.toString()}
                  startContent={<Crown size={20} />}
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pending Payments Section */}
      {pendingPayments.filter(p => !dismissedPayments.has(p.id)).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Status
          </h2>
          {pendingPayments
            .filter(p => !dismissedPayments.has(p.id))
            .map((payment) => (
              <PendingPaymentCard
                key={payment.id}
                payment={payment}
                onPaymentSubmitted={fetchSubscriptionData}
                onDismiss={() => handleDismissPayment(payment.id)}
              />
            ))}
        </div>
      )}

      {/* Subscription Plans Grid - IMPROVED */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Available Plans
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the plan that best fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans
            .sort((a, b) => a.price - b.price)
            .map((plan) => {
              const isCurrent = currentSubscription?.plan_id === plan.id;
              const canUpgrade = currentSubscription &&
                currentSubscription.plan &&
                (currentSubscription.plan?.price ?? 0) < plan.price &&
                !isCurrent;

              const isSelected = selectedPlan?.id === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    isCurrent
                      ? 'border-4 border-primary-500 shadow-xl ring-2 ring-primary-300'
                      : isSelected
                      ? 'border-4 border-secondary-500 shadow-xl ring-2 ring-secondary-300 scale-105'
                      : plan.is_popular
                      ? 'border-2 border-secondary-500 shadow-xl'
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.is_popular && !isCurrent && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Chip className="bg-secondary-500 text-white font-bold shadow-lg" size="lg">
                        Most Popular
                      </Chip>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-success-500 text-white px-3 py-1 rounded-bl-lg font-semibold text-sm">
                      Current Plan
                    </div>
                  )}

                  <CardHeader className="text-center pb-4 pt-10">
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-2xl flex items-center justify-center mx-auto">
                        {getPlanIcon(plan.name)}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {plan.description || `Perfect for ${plan.name.toLowerCase()} users`}
                      </p>
                    </div>
                  </CardHeader>

                  <CardBody className="space-y-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {plan.price === 0 ? 'Free' : `₱${plan.price.toLocaleString()}`}
                      </div>
                      {plan.price > 0 && (
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                          per {plan.billing_cycle?.toLowerCase() || 'month'}
                        </div>
                      )}
                    </div>

                    <Divider />

                    <div className="space-y-3">
                      <FeatureItem
                        text={`${plan.max_listings === -1 ? 'Unlimited' : plan.max_listings} active listings`}
                        included={true}
                      />
                      <FeatureItem
                        text={`${plan.max_photos_per_listing} photos per listing`}
                        included={true}
                      />
                      <FeatureItem
                        text={`${plan.max_featured_listings} featured listings`}
                        included={plan.max_featured_listings > 0}
                      />
                      <FeatureItem
                        text="Video uploads"
                        included={plan.can_add_video}
                      />
                      <FeatureItem
                        text="Virtual tour"
                        included={plan.can_add_virtual_tour}
                      />
                      <FeatureItem
                        text="Priority support"
                        included={plan.priority_support}
                      />
                      <FeatureItem
                        text="Advanced analytics"
                        included={plan.advanced_analytics}
                      />
                      <FeatureItem
                        text="Featured badge"
                        included={plan.featured_badge}
                      />
                    </div>

                    <div className="pt-4">
                      {isCurrent ? (
                        <Button
                          className="w-full"
                          variant="bordered"
                          size="lg"
                          isDisabled
                        >
                          Current Plan
                        </Button>
                      ) : canUpgrade ? (
                        <Button
                          className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:shadow-lg"
                          size="lg"
                          onPress={() => handleUpgrade(plan.id)}
                          isLoading={actionLoading === plan.id.toString()}
                        >
                          Upgrade Now
                        </Button>
                      ) : !currentSubscription ? (
                        <Button
                          className={`w-full font-semibold ${
                            isSelected
                              ? 'bg-success-500 text-white shadow-lg'
                              : plan.is_popular
                              ? 'bg-secondary-500 text-white shadow-lg hover:shadow-xl'
                              : 'bg-primary-500 text-white hover:bg-primary-600'
                          }`}
                          size="lg"
                          onPress={() => handlePlanSelect(plan)}
                          isLoading={actionLoading === plan.id.toString()}
                        >
                          {isSelected ? '✓ Selected' : 'Select Plan'}
                        </Button>
                      ) : (
                        <Button
                          variant="bordered"
                          className="w-full"
                          isDisabled
                          size="lg"
                        >
                          {currentSubscription.plan && (currentSubscription.plan?.price ?? 0) > plan.price ? 'Lower Tier' : 'Not Available'}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Comparison Table - Kept from original */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detailed Feature Comparison
          </h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-2 text-gray-900 dark:text-white font-semibold">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-2 text-gray-900 dark:text-white font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Vehicle Listings"
                  plans={plans}
                  getValue={(plan) => plan.max_listings === -1 ? 'Unlimited' : plan.max_listings.toString()}
                />
                <ComparisonRow
                  label="Photos per Listing"
                  plans={plans}
                  getValue={(plan) => plan.max_photos_per_listing.toString()}
                />
                <ComparisonRow
                  label="Featured Listings"
                  plans={plans}
                  getValue={(plan) => plan.max_featured_listings > 0 ? plan.max_featured_listings.toString() : '—'}
                />
                <ComparisonRow
                  label="Video Uploads"
                  plans={plans}
                  getValue={(plan) => plan.can_add_video ? '✓' : '—'}
                />
                <ComparisonRow
                  label="Priority Support"
                  plans={plans}
                  getValue={(plan) => plan.priority_support ? '✓' : '—'}
                />
                <ComparisonRow
                  label="Advanced Analytics"
                  plans={plans}
                  getValue={(plan) => plan.advanced_analytics ? '✓' : '—'}
                />
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Payment QR Modal */}
      {pendingSubscription && (
        <PaymentQRModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentId={pendingSubscription.paymentId}
          planName={pendingSubscription.planName}
          amount={pendingSubscription.amount}
          qrCodeUrl={pendingSubscription.qrCodeUrl}
          instructions={pendingSubscription.instructions}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      )}
    </div>
  );
}

// Helper Components
function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {included ? (
        <CheckIcon className="text-success-500 flex-shrink-0" size={20} />
      ) : (
        <span className="text-gray-300 dark:text-gray-700 flex-shrink-0">—</span>
      )}
      <span className={`text-sm ${included ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
        {text}
      </span>
    </div>
  );
}

function ComparisonRow({
  label,
  plans,
  getValue
}: {
  label: string;
  plans: SubscriptionPlan[];
  getValue: (plan: SubscriptionPlan) => string;
}) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="py-4 px-2 text-gray-700 dark:text-gray-300 font-medium">{label}</td>
      {plans.map(plan => {
        const value = getValue(plan);
        return (
          <td key={plan.id} className="text-center py-4 px-2 text-gray-900 dark:text-white">
            {value === '✓' ? (
              <CheckIcon className="text-success-500 mx-auto" size={20} />
            ) : (
              <span className={value === '—' ? 'text-gray-400' : 'font-semibold'}>
                {value}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

// Pending Payment Card Component (kept from original)
function PendingPaymentCard({
  payment,
  onPaymentSubmitted,
  onDismiss
}: {
  payment: PaymentHistory;
  onPaymentSubmitted: () => void;
  onDismiss?: () => void;
}) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoadingQR(true);

        // Use public subscription QR code endpoint (no auth required)
        const response = await apiService.getPaymentQRCode();

        console.log('QR Code API Response:', response);

        if (response.success && response.data) {
          // Backend returns { success: true, data: {...} }
          // Frontend wraps it again, so we need response.data.data
          const qrData = response.data.data || response.data;

          console.log('QR Data:', qrData);
          console.log('QR Code URL received:', qrData.qr_code_url);
          console.log('Instructions received:', qrData.instructions);

          // Backend now returns raw relative path for frontend URL handling
          setQrCodeUrl(qrData.qr_code_url); // Raw relative path like '/uploads/qr/file.png'
          setInstructions(qrData.instructions);
        } else {
          console.error('QR Code fetch unsuccessful:', response);
        }
      } catch (err) {
        console.error('Failed to load QR code:', err);
      } finally {
        setLoadingQR(false);
      }
    };

    fetchQRCode();
  }, []);

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter the reference number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiService.submitPaymentReference({
        payment_id: payment.id,
        reference_number: referenceNumber.trim()
      });

      if (response.success) {
        // Auto-refresh page data after 2 seconds to show updated status
        setTimeout(() => {
          onPaymentSubmitted();
        }, 2000);
      } else {
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : typeof response.error === 'object' && response.error !== null
          ? JSON.stringify(response.error)
          : 'Failed to submit payment reference';
        setError(errorMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment reference');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSubmittedReference = !!payment.reference_number;
  const isVerified = !!payment.admin_verified_at;

  // Determine status: Pending -> Completed Transaction -> Reviewed
  const getPaymentStatus = () => {
    if (isVerified) return 'Reviewed';
    if (hasSubmittedReference) return 'Completed Transaction';
    return 'Pending';
  };

  const getStatusColor = () => {
    if (isVerified) return 'success';
    if (hasSubmittedReference) return 'primary';
    return 'warning';
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Card className={`border-2 ${
      isVerified
        ? 'border-green-500 bg-green-50 dark:bg-green-950'
        : hasSubmittedReference
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
        : 'border-orange-500 bg-orange-50 dark:bg-orange-950'
    }`}>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Payment Status: {paymentStatus}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Amount: ₱{payment.amount.toLocaleString()} • Created: {new Date(payment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip color={getStatusColor()} size="md" variant="flat">
              {paymentStatus}
            </Chip>
            {!hasSubmittedReference && onDismiss && (
              <Button
                size="sm"
                variant="light"
                color="danger"
                onPress={onDismiss}
                title="Dismiss this payment"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {isVerified ? (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Verified & Approved!
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Reference Number: <span className="font-bold">{payment.reference_number}</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Verified: {payment.admin_verified_at ? new Date(payment.admin_verified_at).toLocaleString() : 'N/A'}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-3 font-medium">
                  ✓ Your subscription is now active. Refresh the page to see your new plan!
                </p>
                <Button
                  color="success"
                  size="sm"
                  className="mt-3"
                  onPress={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        ) : hasSubmittedReference ? (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Transaction Completed - Awaiting Review
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Reference Number: <span className="font-bold">{payment.reference_number}</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Submitted: {payment.submitted_at ? new Date(payment.submitted_at).toLocaleString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
                  Your payment reference has been received and is being verified by our admin team. You'll be notified once approved.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Payment Instructions:
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {instructions || 'Please scan the QR code and enter the reference number from your payment confirmation.'}
              </p>
            </div>

            {loadingQR ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : qrCodeUrl ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border-2 border-primary-200 dark:border-primary-700 w-full max-w-md mx-auto">
                  <ResponsiveImage
                    src={qrCodeUrl}
                    alt="GCash Payment QR Code"
                    aspectRatio="square"
                    objectFit="contain"
                    className="rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-4">
                  Scan this QR code with your GCash app to make payment
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-semibold mb-2">
                  QR Code Not Configured
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  The admin hasn't uploaded a payment QR code yet. Please contact support to complete your payment or wait for the QR code to be configured.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Enter Payment Reference Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., REF123456789"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  isDisabled={!referenceNumber.trim()}
                >
                  Submit
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                After completing payment via GCash, enter the reference number from your payment confirmation
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
