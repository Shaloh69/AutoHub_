// ==========================================
// app/admin/page.tsx - Complete Admin Dashboard
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Tabs, Tab } from '@heroui/tabs';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Textarea } from '@heroui/input';
import {
  Users, Car, DollarSign, TrendingUp, CheckCircle,
  XCircle, AlertCircle, Shield, Eye, CreditCard, MessageSquare
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Car as CarType, User as UserType, DashboardStats } from '@/types';
import { useRequireAdmin } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingCars, setPendingCars] = useState<CarType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);
  const [fraudIndicatorCount, setFraudIndicatorCount] = useState<number>(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();

  useEffect(() => {
    if (user && !authLoading) {
      loadAdminData();
    }
  }, [user, authLoading]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, carsResponse, usersResponse, paymentsResponse, fraudResponse, reviewStatsResponse] = await Promise.all([
        apiService.getAdminAnalytics(),
        apiService.getPendingCars(),
        apiService.getAllUsers(),
        apiService.getPendingPayments(100, 0),
        apiService.getFraudStatistics(),
        apiService.getReviewStatistics(),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (carsResponse.success && carsResponse.data) {
        setPendingCars(carsResponse.data.items || []);
      }

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      }

      if (paymentsResponse.success && paymentsResponse.data) {
        setPendingPaymentsCount(paymentsResponse.data.length || 0);
      }

      if (fraudResponse.success && fraudResponse.data) {
        setFraudIndicatorCount(fraudResponse.data.total || 0);
      }

      if (reviewStatsResponse.success && reviewStatsResponse.data) {
        setPendingReviewsCount(reviewStatsResponse.data.pending || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCar = async (carId: number) => {
    try {
      setActionLoading(true);
      const response = await apiService.approveCar(carId);

      if (response.success) {
        setPendingCars(prev => prev.filter(car => car.id !== carId));
      } else {
        alert(response.error || 'Failed to approve car');
      }
    } catch (err) {
      console.error('Failed to approve car:', err);
      alert('Failed to approve car');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCar = async () => {
    if (!selectedCar) return;

    try {
      setActionLoading(true);
      const response = await apiService.rejectCar(selectedCar.id, rejectReason);

      if (response.success) {
        setPendingCars(prev => prev.filter(car => car.id !== selectedCar.id));
        setSelectedCar(null);
        setRejectReason('');
        onRejectOpenChange();
      } else {
        alert(response.error || 'Failed to reject car');
      }
    } catch (err) {
      console.error('Failed to reject car:', err);
      alert('Failed to reject car');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId: number, reason: string) => {
    const confirmReason = prompt('Enter reason for banning this user:', reason);
    if (!confirmReason) return;

    try {
      const response = await apiService.banUser(userId, confirmReason);

      if (response.success) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, is_banned: true } : u))
        );
      } else {
        alert(response.error || 'Failed to ban user');
      }
    } catch (err) {
      console.error('Failed to ban user:', err);
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
      const response = await apiService.unbanUser(userId);

      if (response.success) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, is_banned: false } : u))
        );
      } else {
        alert(response.error || 'Failed to unban user');
      }
    } catch (err) {
      console.error('Failed to unban user:', err);
      alert('Failed to unban user');
    }
  };

  const openRejectModal = (car: CarType) => {
    setSelectedCar(car);
    onRejectOpen();
  };

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button color="primary" onPress={loadAdminData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield size={16} />
            <span>Administrative Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AutoHub
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-3">
              Admin Panel
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage platform operations, users, and listings
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-blue-500">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.totalUsers || 0}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +{stats.newUsersToday || 0} today
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Users className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-green-500">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Active Listings
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.activeListings || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Car className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-yellow-500">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Pending Approvals
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.pendingApprovals || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-purple-500">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(stats.totalRevenue || 0)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {formatPrice(stats.revenueToday || 0)} today
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <DollarSign className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Link href="/admin/payments" className="block">
              <Card className="border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Pending Payments
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {pendingPaymentsCount}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Needs verification
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <CreditCard className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/admin/fraud-detection" className="block">
              <Card className="border-l-4 border-orange-500 hover:shadow-lg transition-shadow cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Fraud Indicators
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {fraudIndicatorCount}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Requires attention
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <Shield className="text-orange-600 dark:text-orange-400" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/admin/reviews" className="block">
              <Card className="border-l-4 border-indigo-500 hover:shadow-lg transition-shadow cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Pending Reviews
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {pendingReviewsCount}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Needs moderation
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                      <MessageSquare className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        )}

        {/* Main Content */}
        <Tabs aria-label="Admin sections" className="mb-6">
          <Tab key="pending" title={`Pending Approvals (${pendingCars.length})`}>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Pending Car Listings</h2>
              </CardHeader>
              <CardBody>
                {pendingCars.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      All caught up!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No pending listings to review
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCars.map(car => (
                      <Card key={car.id} className="bg-yellow-50 dark:bg-yellow-900/10">
                        <CardBody>
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Image */}
                            <div className="w-full md:w-48 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                              {car.images?.[0] ? (
                                <img
                                  src={getImageUrl(car.images[0].image_url)}
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
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {car.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {car.brand?.name || 'Unknown Brand'} {car.model?.name || ''} • {car.year || 'N/A'}
                                  </p>
                                  {car.seller && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      Seller: {car.seller.first_name} {car.seller.last_name}
                                    </p>
                                  )}
                                </div>
                                <Chip color="warning" variant="flat">
                                  Pending
                                </Chip>
                              </div>

                              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                                <span>{formatPrice(car.price || 0)}</span>
                                <span>•</span>
                                <span>{(car.mileage || 0).toLocaleString()} km</span>
                                <span>•</span>
                                <span className="capitalize">{car.fuel_type || 'N/A'}</span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  color="success"
                                  onPress={() => handleApproveCar(car.id)}
                                  isLoading={actionLoading}
                                  startContent={<CheckCircle size={16} />}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  onPress={() => openRejectModal(car)}
                                  isLoading={actionLoading}
                                  startContent={<XCircle size={16} />}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  as="a"
                                  href={`/cars/${car.id}`}
                                  target="_blank"
                                  startContent={<Eye size={16} />}
                                >
                                  View Details
                                </Button>
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
          </Tab>

          <Tab key="users" title={`Users (${users.length})`}>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">User Management</h2>
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Users table">
                  <TableHeader>
                    <TableColumn>USER</TableColumn>
                    <TableColumn>EMAIL</TableColumn>
                    <TableColumn>ROLE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>LISTINGS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.business_name && (
                              <p className="text-xs text-gray-500">
                                {user.business_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat" className="capitalize">
                            {user.role}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.is_banned ? (
                              <Chip size="sm" color="danger">
                                Banned
                              </Chip>
                            ) : user.is_active ? (
                              <Chip size="sm" color="success">
                                Active
                              </Chip>
                            ) : (
                              <Chip size="sm" color="default">
                                Inactive
                              </Chip>
                            )}
                            {user.email_verified && (
                              <Chip size="sm" color="primary" variant="flat">
                                Verified
                              </Chip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.total_listings || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.is_banned ? (
                              <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                onPress={() => handleUnbanUser(user.id)}
                              >
                                Unban
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={() => handleBanUser(user.id, '')}
                              >
                                Ban
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="analytics" title="Analytics">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Platform Analytics</h2>
              </CardHeader>
              <CardBody>
                {stats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          New Users Today
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.newUsersToday || 0}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Cars Sold Today
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.carsSoldToday || 0}
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Revenue Today
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatPrice(stats.revenueToday || 0)}
                        </p>
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Pending Reviews
                        </p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {stats.pendingApprovals || 0}
                        </p>
                      </div>
                    </div>

                    <div className="text-center py-8 text-gray-500">
                      More detailed analytics coming soon...
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>

          <Tab key="payments" title={`Payments (${pendingPaymentsCount})`}>
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payment Verification</h2>
                <Button
                  as={Link}
                  href="/admin/payments"
                  color="primary"
                  endContent={<CreditCard size={18} />}
                >
                  View Payment Dashboard
                </Button>
              </CardHeader>
              <CardBody>
                <div className="text-center py-12">
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-flex mb-4">
                    <CreditCard className="text-red-600 dark:text-red-400" size={48} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Verification Required
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {pendingPaymentsCount > 0
                      ? `You have ${pendingPaymentsCount} pending payment${pendingPaymentsCount !== 1 ? 's' : ''} waiting for verification`
                      : 'No pending payments at this time'
                    }
                  </p>
                  <Button
                    as={Link}
                    href="/admin/payments"
                    color="primary"
                    size="lg"
                    endContent={<CreditCard size={20} />}
                  >
                    Go to Payment Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="fraud" title={`Fraud Detection (${fraudIndicatorCount})`}>
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Fraud Detection</h2>
                <Button
                  as={Link}
                  href="/admin/fraud-detection"
                  color="warning"
                  endContent={<Shield size={18} />}
                >
                  View Fraud Dashboard
                </Button>
              </CardHeader>
              <CardBody>
                <div className="text-center py-12">
                  <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full inline-flex mb-4">
                    <Shield className="text-orange-600 dark:text-orange-400" size={48} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Fraud Monitoring
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {fraudIndicatorCount > 0
                      ? `There ${fraudIndicatorCount === 1 ? 'is' : 'are'} ${fraudIndicatorCount} fraud indicator${fraudIndicatorCount !== 1 ? 's' : ''} requiring attention`
                      : 'No fraud indicators detected - all systems normal'
                    }
                  </p>
                  <Button
                    as={Link}
                    href="/admin/fraud-detection"
                    color="warning"
                    size="lg"
                    endContent={<Shield size={20} />}
                  >
                    Go to Fraud Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="reviews" title={`Reviews (${pendingReviewsCount})`}>
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Review Moderation</h2>
                <Button
                  as={Link}
                  href="/admin/reviews"
                  color="secondary"
                  endContent={<MessageSquare size={18} />}
                >
                  View Reviews Dashboard
                </Button>
              </CardHeader>
              <CardBody>
                <div className="text-center py-12">
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full inline-flex mb-4">
                    <MessageSquare className="text-indigo-600 dark:text-indigo-400" size={48} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Review Moderation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {pendingReviewsCount > 0
                      ? `You have ${pendingReviewsCount} pending review${pendingReviewsCount !== 1 ? 's' : ''} waiting for moderation`
                      : 'No pending reviews at this time - all reviews have been moderated'
                    }
                  </p>
                  <Button
                    as={Link}
                    href="/admin/reviews"
                    color="secondary"
                    size="lg"
                    endContent={<MessageSquare size={20} />}
                  >
                    Go to Reviews Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Reject Car Modal */}
      <Modal isOpen={isRejectOpen} onOpenChange={onRejectOpenChange}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">Reject Listing</h3>
          </ModalHeader>
          <ModalBody>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Why are you rejecting the listing for{' '}
              <strong className="text-gray-900 dark:text-white">
                {selectedCar?.title}
              </strong>
              ?
            </p>
            <Textarea
              label="Reason for Rejection"
              placeholder="Enter the reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              minRows={4}
              isRequired
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => onRejectOpenChange()}
              isDisabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleRejectCar}
              isLoading={actionLoading}
              isDisabled={!rejectReason.trim()}
            >
              Reject Listing
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}