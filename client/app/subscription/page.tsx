// app/subscription/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { CheckIcon } from "@/components/icons";
import { apiService } from '@/services/api';
import { SubscriptionPlan, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PaymentQRModal from '@/components/PaymentQRModal';

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
  const [pendingSubscription, setPendingSubscription] = useState<{
    paymentId: number;
    planName: string;
    amount: number;
    qrCodeUrl: string;
    instructions: string;
  } | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentHistory[]>([]);

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
        // Filter pending payments that haven't been verified
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

  const handleSubscribe = async (planId: number) => {
    try {
      setActionLoading(planId.toString());
      const response = await apiService.subscribe({
        plan_id: planId,
        billing_cycle: 'monthly',
        payment_method: 'qr_code'
      });

      if (response.success && response.data) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          setPendingSubscription({
            paymentId: response.data.payment_id,
            planName: plan.name,
            amount: response.data.amount,
            qrCodeUrl: response.data.qr_code_url,
            instructions: response.data.instructions
          });
          setShowPaymentModal(true);
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
      const response = await apiService.upgradeSubscription(planId);

      if (response.success && response.data) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          setPendingSubscription({
            paymentId: response.data.payment_id,
            planName: plan.name,
            amount: response.data.amount,
            qrCodeUrl: response.data.qr_code_url,
            instructions: response.data.instructions
          });
          setShowPaymentModal(true);
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

  const handlePaymentSubmitted = () => {
    fetchSubscriptionData();
    setPendingSubscription(null);
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

  if (!isAuthenticated || loading) {
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
        <Card className="border-2 border-autohub-accent2-500 bg-gradient-to-br from-autohub-accent2-50 to-autohub-neutral-50 dark:from-autohub-accent2-950 dark:to-autohub-secondary-900 shadow-lg">
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
                    {currentSubscription.plan?.name || 'Subscription Plan'}
                  </h4>
                  <p className="text-autohub-accent1-600">{currentSubscription.plan?.description || ''}</p>
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
                    <span>Renews:</span> <span className="font-medium">{new Date(currentSubscription.current_period_end || '').toLocaleDateString()}</span>
                  </div>
                  {userLimits && (
                    <div className="text-autohub-accent1-600">
                      <span>Listings:</span> <span className="font-medium">{userLimits.usedListings} / {currentSubscription.plan?.max_listings === -1 ? '∞' : currentSubscription.plan?.max_listings}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right space-y-3">
                <div>
                  <p className="text-3xl font-bold text-autohub-primary-500">
                    ₱{currentSubscription.plan?.price || 0}
                  </p>
                  <p className="text-autohub-accent1-600">per {currentSubscription.billing_cycle?.toLowerCase()}</p>
                </div>
                {currentSubscription.status === 'ACTIVE' && !currentSubscription.cancelled_at && (
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
                {currentSubscription.cancelled_at && currentSubscription.status !== 'CANCELLED' && (
                  <Chip color="warning" size="sm" className="bg-amber-500 text-white">
                    Cancels at period end
                  </Chip>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Pending Payments
          </h2>
          {pendingPayments.map((payment) => (
            <PendingPaymentCard
              key={payment.id}
              payment={payment}
              onPaymentSubmitted={fetchSubscriptionData}
            />
          ))}
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans
          .sort((a, b) => a.price - b.price)
          .map((plan) => {
            const isCurrent = currentSubscription?.plan_id === plan.id;
            const canUpgrade = currentSubscription &&
              currentSubscription.plan &&
              (currentSubscription.plan?.price ?? 0) < plan.price &&
              !isCurrent;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-autohub ${
                  isCurrent
                    ? 'border-4 border-autohub-accent2-500 shadow-gold ring-2 ring-autohub-accent2-300'
                    : plan.is_popular
                    ? 'border-2 border-autohub-accent2-500 shadow-gold'
                    : 'border border-autohub-accent1-200 hover:border-autohub-primary-500/50'
                }`}
              >
                {plan.is_popular && (
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
                      ₱{plan.price}
                    </div>
                    <div className="text-autohub-accent1-600">
                      per {plan.billing_cycle?.toLowerCase()}
                    </div>
                  </div>

                  <Divider className="bg-autohub-accent1-200" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                      <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                        {plan.max_listings === -1 ? 'Unlimited' : plan.max_listings} active listings
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                      <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                        {plan.max_photos_per_listing} photos per listing
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                      <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                        {plan.max_featured_listings} featured listings
                      </span>
                    </div>
                    {plan.can_add_video && (
                      <div className="flex items-center gap-3">
                        <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                        <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                          Video uploads
                        </span>
                      </div>
                    )}
                    {plan.can_add_virtual_tour && (
                      <div className="flex items-center gap-3">
                        <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                        <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                          Virtual tour
                        </span>
                      </div>
                    )}
                    {plan.priority_support && (
                      <div className="flex items-center gap-3">
                        <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                        <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                          Priority support
                        </span>
                      </div>
                    )}
                    {plan.advanced_analytics && (
                      <div className="flex items-center gap-3">
                        <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                        <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                          Advanced analytics
                        </span>
                      </div>
                    )}
                    {plan.featured_badge && (
                      <div className="flex items-center gap-3">
                        <CheckIcon className="text-autohub-accent2-500 flex-shrink-0" size={20} />
                        <span className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                          Featured badge
                        </span>
                      </div>
                    )}
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
                          plan.is_popular
                            ? 'bg-autohub-accent2-500 hover:bg-autohub-accent2-600 text-autohub-secondary-900 shadow-gold'
                            : 'bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white shadow-autohub'
                        }`}
                        size="lg"
                        onPress={() => handleSubscribe(plan.id)}
                        isLoading={actionLoading === plan.id.toString()}
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
                        {currentSubscription.plan && (currentSubscription.plan?.price ?? 0) > plan.price ? 'Lower Tier' : 'Contact Support'}
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
                        {plan.max_listings === -1 ? 'Unlimited' : plan.max_listings}
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
                      {plan.max_featured_listings > 0 ? (
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
                      {plan.priority_support ? (
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
                      {plan.advanced_analytics ? (
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

// Pending Payment Card Component
function PendingPaymentCard({
  payment,
  onPaymentSubmitted
}: {
  payment: PaymentHistory;
  onPaymentSubmitted: () => void;
}) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    // Fetch QR code settings when component mounts
    const fetchQRCode = async () => {
      try {
        setLoadingQR(true);
        const response = await apiService.getPaymentQRCode();
        if (response.success && response.data) {
          setQrCodeUrl(response.data.qr_code_url);
          setInstructions(response.data.instructions);
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
        onPaymentSubmitted();
      } else {
        // Handle error - convert to string if it's an object
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

  return (
    <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
              Payment Pending Verification
            </h3>
            <p className="text-sm text-autohub-accent1-600">
              Amount: ₱{payment.amount} • Created: {new Date(payment.created_at).toLocaleDateString()}
            </p>
          </div>
          <Chip color="warning" size="sm">
            {hasSubmittedReference ? 'Under Review' : 'Awaiting Payment'}
          </Chip>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {hasSubmittedReference ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-autohub-secondary-900 mb-2">
              Payment Reference Submitted
            </h4>
            <p className="text-sm text-autohub-accent1-700">
              Reference Number: <span className="font-bold">{payment.reference_number}</span>
            </p>
            <p className="text-sm text-autohub-accent1-700 mt-2">
              Submitted: {payment.submitted_at ? new Date(payment.submitted_at).toLocaleString() : 'N/A'}
            </p>
            <p className="text-sm text-autohub-accent1-700 mt-3">
              Your payment is being verified by our admin team. You'll be notified once approved.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-autohub-secondary-900 mb-2">
                Payment Instructions:
              </h4>
              <p className="text-sm text-autohub-accent1-700 whitespace-pre-line">
                {instructions || 'Please scan the QR code and enter the reference number from your payment confirmation.'}
              </p>
            </div>

            {loadingQR ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : qrCodeUrl ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border-2 border-autohub-primary-200 w-full max-w-md mx-auto">
                  <div className="relative w-full aspect-square">
                    <img
                      src={qrCodeUrl}
                      alt="GCash Payment QR Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
                <p className="text-sm text-autohub-accent1-600 text-center px-4">
                  Scan this QR code with your GCash app to make payment
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  QR code not available. Please contact support.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-autohub-secondary-900 dark:text-autohub-neutral-50">
                Enter Payment Reference Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., REF123456789"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-autohub-accent1-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-autohub-primary-500"
                />
                <Button
                  className="bg-autohub-primary-500 text-white"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  isDisabled={!referenceNumber.trim()}
                >
                  Submit
                </Button>
              </div>
              <p className="text-xs text-autohub-accent1-600">
                After completing payment via GCash, enter the reference number from your payment confirmation
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}