// ==========================================
// app/seller/dashboard/page.tsx - Seller Dashboard
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Tabs, Tab } from '@heroui/tabs';
import {
  Plus, Car, Eye, MessageCircle, Heart, TrendingUp,
  DollarSign, Clock, CheckCircle, XCircle, Crown, ArrowRight
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Car as CarType, Analytics, Subscription } from '@/types';
import { useRequireSeller } from '@/contexts/AuthContext';
import { ActiveSubscriptionCard } from '@/components/subscription/ActiveSubscriptionCard';
import SellerLayout from '@/components/seller/SellerLayout';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, canListCars } = useRequireSeller();

  const [cars, setCars] = useState<CarType[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [carsResponse, analyticsResponse, subscriptionResponse] = await Promise.all([
        apiService.getUserListings(),
        apiService.getDashboard(),
        apiService.getCurrentSubscription(),
      ]);

      if (carsResponse.success && carsResponse.data) {
        setCars(carsResponse.data);
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }

      if (subscriptionResponse.success && subscriptionResponse.data) {
        setSubscription(subscriptionResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const response = await apiService.deleteCar(carId);
      if (response.success) {
        setCars(prev => prev.filter(car => car.id !== carId));
      }
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
      case 'DRAFT':
        return 'warning';
      case 'SOLD':
        return 'primary';
      case 'EXPIRED':
      case 'REMOVED':
      case 'INACTIVE':
      case 'REJECTED':
        return 'danger';
      case 'RESERVED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const filteredCars = cars.filter(car => {
    if (selectedTab === 'all') return true;
    return car.status?.toUpperCase() === selectedTab.toUpperCase();
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Seller Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your listings and track performance
            </p>
          </div>

          <Button
            color="primary"
            size="lg"
            startContent={<Plus size={20} />}
            onPress={() => router.push('/seller/new')}
            isDisabled={!canListCars}
          >
            Create Listing
          </Button>
        </div>

        {/* Verification Warning */}
        {!canListCars && (
          <Card className="mb-6 bg-yellow-600/10 backdrop-blur-md border border-yellow-500/30">
            <CardBody>
              <div className="flex items-start gap-3">
                <Clock size={24} className="text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                    Email Verification Required
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please verify your email address to start listing vehicles.
                  </p>
                  <Button
                    size="sm"
                    variant="flat"
                    className="mt-2"
                    onPress={() => router.push('/profile/verification')}
                  >
                    Verify Now
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Active Subscription Card - Enhanced */}
        <div className="mb-6">
          <ActiveSubscriptionCard
            subscription={subscription}
            userLimits={analytics ? {
              usedListings: analytics.active_listings || 0,
              usedFeatured: 0, // You can add this to analytics if needed
              remainingListings: subscription?.plan ? (subscription.plan.max_listings === -1 ? Infinity : subscription.plan.max_listings - (analytics.active_listings || 0)) : 0,
              remainingFeatured: subscription?.plan ? subscription.plan.max_featured_listings : 0
            } : null}
            showUpgradeButton={true}
            onUpgrade={() => router.push('/subscription')}
            onCancel={async () => {
              if (confirm('Are you sure you want to cancel your subscription?')) {
                try {
                  await apiService.cancelSubscription();
                  await loadDashboardData();
                } catch (error) {
                  console.error('Failed to cancel subscription:', error);
                }
              }
            }}
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-6 bg-black/20 backdrop-blur-2xl border border-green-700/30">
          <CardBody className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                className="flex-col h-20 bg-green-600/10 backdrop-blur-sm hover:bg-green-600/20 border border-green-500/30 transition-all"
                onPress={() => router.push('/seller/new')}
              >
                <Plus size={24} className="text-green-400 mb-1" />
                <span className="text-sm font-semibold text-white">New Listing</span>
              </Button>
              <Button
                className="flex-col h-20 bg-blue-600/10 backdrop-blur-sm hover:bg-blue-600/20 border border-blue-500/30 transition-all"
                onPress={() => router.push('/seller/inquiries')}
              >
                <MessageCircle size={24} className="text-blue-400 mb-1" />
                <span className="text-sm font-semibold text-white">Inquiries</span>
              </Button>
              <Button
                className="flex-col h-20 bg-emerald-600/10 backdrop-blur-sm hover:bg-emerald-600/20 border border-emerald-500/30 transition-all"
                onPress={() => router.push('/seller/transactions')}
              >
                <DollarSign size={24} className="text-emerald-400 mb-1" />
                <span className="text-sm font-semibold text-white">Transactions</span>
              </Button>
              <Button
                className="flex-col h-20 bg-purple-600/10 backdrop-blur-sm hover:bg-purple-600/20 border border-purple-500/30 transition-all"
                onPress={() => router.push('/subscription')}
              >
                <Crown size={24} className="text-purple-400 mb-1" />
                <span className="text-sm font-semibold text-white">Subscription</span>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Listings
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.total_listings}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Car className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/30">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Active Listings
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.active_listings}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border border-purple-500/30">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Views
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.total_views}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Eye className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-md border border-orange-500/30">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Inquiries
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.total_inquiries}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <MessageCircle className="text-orange-600 dark:text-orange-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Listings */}
        <Card className="bg-black/20 backdrop-blur-2xl border border-green-700/30">
          <CardHeader>
            <h2 className="text-2xl font-bold text-white">My Listings</h2>
          </CardHeader>
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-4"
            >
              <Tab key="all" title={`All (${cars.length})`} />
              <Tab
                key="active"
                title={`Active (${cars.filter(c => c.status?.toUpperCase() === 'ACTIVE').length})`}
              />
              <Tab
                key="pending"
                title={`Pending (${cars.filter(c => c.status?.toUpperCase() === 'PENDING').length})`}
              />
              <Tab
                key="sold"
                title={`Sold (${cars.filter(c => c.status?.toUpperCase() === 'SOLD').length})`}
              />
            </Tabs>

            {filteredCars.length === 0 ? (
              <div className="text-center py-12">
                <Car className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No listings found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedTab === 'all'
                    ? 'Start by creating your first listing'
                    : `No ${selectedTab} listings at the moment`}
                </p>
                {canListCars && (
                  <Button
                    color="primary"
                    onPress={() => router.push('/seller/new')}
                  >
                    Create Listing
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCars.map(car => (
                  <Card key={car.id} className="bg-black/40 backdrop-blur-md border border-green-700/20 hover:border-green-500/40 transition-all">
                    <CardBody>
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Image */}
                        <div className="w-full md:w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {car.main_image || car.images?.[0] ? (
                            <img
                              src={getImageUrl(car.main_image || car.images?.[0]?.image_url)}
                              alt={car.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="text-gray-400" size={48} />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {car.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {car.brand?.name} {car.model?.name} • {car.year}
                              </p>
                            </div>
                            <Chip color={getStatusColor(car.status)} variant="flat">
                              {car.status}
                            </Chip>
                          </div>

                          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye size={16} />
                              {car.views_count || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart size={16} />
                              {car.favorite_count || 0} saves
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={16} />
                              {car.contact_count || 0} contacts
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {formatPrice(car.price)}
                            </span>

                            <div className="flex gap-2 ml-auto">
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => router.push(`/cars/${car.id}`)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => router.push(`/seller/cars/${car.id}/edit`)}
                                isDisabled={car.status?.toUpperCase() === 'SOLD'}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() => handleDeleteCar(car.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </SellerLayout>
  );
}