// ==========================================
// app/admin/page.tsx - Redesigned Admin Dashboard
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
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
  XCircle, AlertCircle, Shield, Eye, CreditCard, MessageSquare,
  Activity, BarChart3, ArrowUpRight, UserCheck
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Car as CarType, User as UserType, DashboardStats } from '@/types';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

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
        setUsers(usersResponse.data.items || []);
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

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" color="primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-4">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button color="primary" onPress={loadAdminData}>
            Try Again
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Key Metrics - Gradient Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="text-blue-400" size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <ArrowUpRight size={16} />
                    <span className="text-xs font-medium">+{stats.new_users_today || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-blue-300 font-medium mb-1">Total Users</p>
                  <p className="text-4xl font-bold text-white">{stats.total_users || 0}</p>
                  <p className="text-xs text-blue-400 mt-2">
                    {stats.new_users_today || 0} new today
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Car className="text-green-400" size={24} />
                  </div>
                  <Activity className="text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-green-300 font-medium mb-1">Active Listings</p>
                  <p className="text-4xl font-bold text-white">{stats.active_cars || 0}</p>
                  <p className="text-xs text-green-400 mt-2">
                    {stats.new_cars_today || 0} new today
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-md border border-yellow-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="text-yellow-400" size={24} />
                  </div>
                  <Chip size="sm" color="warning" variant="flat">
                    Action Needed
                  </Chip>
                </div>
                <div>
                  <p className="text-sm text-yellow-300 font-medium mb-1">Pending Approvals</p>
                  <p className="text-4xl font-bold text-white">{stats.pending_approval_cars || 0}</p>
                  <p className="text-xs text-yellow-400 mt-2">
                    Awaiting review
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border border-purple-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <DollarSign className="text-purple-400" size={24} />
                  </div>
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-purple-300 font-medium mb-1">Total Revenue</p>
                  <p className="text-4xl font-bold text-white">₱0</p>
                  <p className="text-xs text-purple-400 mt-2">
                    From subscriptions
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Action Items - Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/payments" className="block group">
            <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border border-red-500/30 hover:border-red-400/50 transition-all">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <CreditCard className="text-red-400" size={20} />
                  </div>
                  <ArrowUpRight className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                </div>
                <p className="text-sm text-red-300 font-medium mb-2">Pending Payments</p>
                <p className="text-3xl font-bold text-white mb-1">{pendingPaymentsCount}</p>
                <p className="text-xs text-red-400">Needs verification</p>
              </CardBody>
            </Card>
          </Link>

          <Link href="/admin/fraud-detection" className="block group">
            <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-md border border-orange-500/30 hover:border-orange-400/50 transition-all">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Shield className="text-orange-400" size={20} />
                  </div>
                  <ArrowUpRight className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                </div>
                <p className="text-sm text-orange-300 font-medium mb-2">Fraud Indicators</p>
                <p className="text-3xl font-bold text-white mb-1">{fraudIndicatorCount}</p>
                <p className="text-xs text-orange-400">Requires attention</p>
              </CardBody>
            </Card>
          </Link>

          <Link href="/admin/reviews" className="block group">
            <Card className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 backdrop-blur-md border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <MessageSquare className="text-indigo-400" size={20} />
                  </div>
                  <ArrowUpRight className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                </div>
                <p className="text-sm text-indigo-300 font-medium mb-2">Pending Reviews</p>
                <p className="text-3xl font-bold text-white mb-1">{pendingReviewsCount}</p>
                <p className="text-xs text-indigo-400">Needs moderation</p>
              </CardBody>
            </Card>
          </Link>
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardBody className="p-2">
            <Tabs
              aria-label="Admin sections"
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full",
                cursor: "bg-red-500",
                tab: "px-4 py-3",
                tabContent: "group-data-[selected=true]:text-white"
              }}
            >
              <Tab
                key="pending"
                title={
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>Pending Approvals</span>
                    <Chip size="sm" color="warning" variant="flat">{pendingCars.length}</Chip>
                  </div>
                }
              >
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Pending Car Listings</h2>
                    <p className="text-sm text-gray-400">Review and approve new car listings</p>
                  </div>

                  {pendingCars.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-500" size={40} />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        All caught up!
                      </h3>
                      <p className="text-gray-400">
                        No pending listings to review
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingCars.map(car => (
                        <Card key={car.id} className="bg-gradient-to-br from-yellow-600/10 to-yellow-800/10 backdrop-blur-md border border-yellow-500/20">
                          <CardBody className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Image */}
                              <div className="w-full md:w-56 h-40 bg-black/20 rounded-xl overflow-hidden flex-shrink-0">
                                {car.main_image || car.images?.[0] ? (
                                  <img
                                    src={getImageUrl(car.main_image || car.images?.[0]?.image_url)}
                                    alt={car.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Car className="text-gray-600" size={48} />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">
                                      {car.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                      {car.brand?.name || 'Unknown Brand'} {car.model?.name || ''} • {car.year || 'N/A'}
                                    </p>
                                    {car.seller && (
                                      <p className="text-sm text-gray-400 flex items-center gap-2">
                                        <UserCheck size={14} />
                                        Seller: {car.seller.first_name} {car.seller.last_name}
                                      </p>
                                    )}
                                  </div>
                                  <Chip color="warning" variant="flat" className="font-medium">
                                    Pending Review
                                  </Chip>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-400" />
                                    <span className="font-semibold text-white">{formatPrice(car.price || 0)}</span>
                                  </div>
                                  <div className="w-px h-4 bg-gray-700" />
                                  <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-blue-400" />
                                    <span>{(car.mileage || 0).toLocaleString()} km</span>
                                  </div>
                                  <div className="w-px h-4 bg-gray-700" />
                                  <span className="capitalize">{car.fuel_type || 'N/A'}</span>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                  <Button
                                    size="sm"
                                    color="success"
                                    onPress={() => handleApproveCar(car.id)}
                                    isLoading={actionLoading}
                                    startContent={<CheckCircle size={16} />}
                                    className="font-medium"
                                  >
                                    Approve Listing
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    onPress={() => openRejectModal(car)}
                                    isLoading={actionLoading}
                                    startContent={<XCircle size={16} />}
                                    className="font-medium"
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
                                    className="font-medium"
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
                </div>
              </Tab>

              <Tab
                key="users"
                title={
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>Users</span>
                    <Chip size="sm" variant="flat">{users.length}</Chip>
                  </div>
                }
              >
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
                    <p className="text-sm text-gray-400">Manage platform users and permissions</p>
                  </div>

                  <Card className="bg-black/20 backdrop-blur-md border border-gray-700">
                    <CardBody className="p-0">
                      <Table
                        removeWrapper
                        classNames={{
                          th: "bg-black/20 text-gray-300 font-semibold text-xs uppercase",
                          td: "text-gray-200 py-4",
                        }}
                      >
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
                            <TableRow
                              key={user.id}
                              className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                            >
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-gray-800/50 px-2 py-1 rounded text-gray-400">
                                      #{user.id}
                                    </code>
                                    <p className="font-semibold text-white">
                                      {user.first_name} {user.last_name}
                                    </p>
                                  </div>
                                  {user.business_name && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {user.business_name}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-400">{user.email}</span>
                              </TableCell>
                              <TableCell>
                                <Chip size="sm" variant="flat" className="capitalize font-medium">
                                  {user.role?.toLowerCase() || 'N/A'}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.is_banned ? (
                                    <Chip size="sm" color="danger" variant="flat">
                                      Banned
                                    </Chip>
                                  ) : user.is_active ? (
                                    <Chip size="sm" color="success" variant="flat">
                                      Active
                                    </Chip>
                                  ) : (
                                    <Chip size="sm" color="default" variant="flat">
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
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-white">{user.total_listings ?? user.active_listings ?? 0}</span>
                                  {(user.active_listings !== undefined && user.active_listings !== user.total_listings) && (
                                    <span className="text-xs text-gray-500">
                                      {user.active_listings} active
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {user.is_banned ? (
                                    <Button
                                      size="sm"
                                      color="success"
                                      variant="flat"
                                      onPress={() => handleUnbanUser(user.id)}
                                      className="font-medium"
                                    >
                                      Unban
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="flat"
                                      onPress={() => handleBanUser(user.id, '')}
                                      className="font-medium"
                                    >
                                      Ban User
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
                </div>
              </Tab>

              <Tab
                key="analytics"
                title={
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    <span>Analytics</span>
                  </div>
                }
              >
                <div className="p-6 space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Platform Analytics</h2>
                    <p className="text-sm text-gray-400">Insights and performance metrics</p>
                  </div>

                  {stats && (
                    <>
                      {/* Today's Performance */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Today's Performance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
                            <CardBody className="p-6 text-center">
                              <p className="text-sm text-blue-300 font-medium mb-2">New Users</p>
                              <p className="text-4xl font-bold text-white mb-1">{stats.new_users_today || 0}</p>
                              <p className="text-xs text-blue-400">
                                +{((stats.new_users_today || 0) / Math.max((stats.total_users || 1), 1) * 100).toFixed(1)}% growth
                              </p>
                            </CardBody>
                          </Card>

                          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/30">
                            <CardBody className="p-6 text-center">
                              <p className="text-sm text-green-300 font-medium mb-2">New Listings</p>
                              <p className="text-4xl font-bold text-white mb-1">{stats.new_cars_today || 0}</p>
                              <p className="text-xs text-green-400">Active engagement</p>
                            </CardBody>
                          </Card>

                          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border border-purple-500/30">
                            <CardBody className="p-6 text-center">
                              <p className="text-sm text-purple-300 font-medium mb-2">Revenue</p>
                              <p className="text-4xl font-bold text-white mb-1">₱0</p>
                              <p className="text-xs text-purple-400">From subscriptions</p>
                            </CardBody>
                          </Card>

                          <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-md border border-orange-500/30">
                            <CardBody className="p-6 text-center">
                              <p className="text-sm text-orange-300 font-medium mb-2">Pending Actions</p>
                              <p className="text-4xl font-bold text-white mb-1">
                                {(stats.pending_approval_cars || 0) + pendingPaymentsCount + pendingReviewsCount}
                              </p>
                              <p className="text-xs text-orange-400">Requires attention</p>
                            </CardBody>
                          </Card>
                        </div>
                      </div>

                      {/* Platform Health */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Platform Health</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-md border border-cyan-500/30">
                            <CardBody className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-cyan-300 mb-2 font-medium">Active Sellers</p>
                                  <p className="text-3xl font-bold text-white">
                                    {users.filter(u => u.role?.toLowerCase() === 'seller' || u.role?.toLowerCase() === 'dealer').length}
                                  </p>
                                  <p className="text-xs text-cyan-400 mt-2">Total seller accounts</p>
                                </div>
                                <Users className="text-cyan-400 opacity-30" size={48} />
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 backdrop-blur-md border border-emerald-500/30">
                            <CardBody className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-emerald-300 mb-2 font-medium">Conversion Rate</p>
                                  <p className="text-3xl font-bold text-white">
                                    {stats.active_cars > 0 ? ((stats.active_cars / (stats.total_users || 1)) * 100).toFixed(1) : 0}%
                                  </p>
                                  <p className="text-xs text-emerald-400 mt-2">Users to listings</p>
                                </div>
                                <TrendingUp className="text-emerald-400 opacity-30" size={48} />
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 backdrop-blur-md border border-violet-500/30">
                            <CardBody className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-violet-300 mb-2 font-medium">Avg. Listing Value</p>
                                  <p className="text-3xl font-bold text-white">₱0</p>
                                  <p className="text-xs text-violet-400 mt-2">Platform average</p>
                                </div>
                                <DollarSign className="text-violet-400 opacity-30" size={48} />
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>

                      {/* Platform Activity Summary */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                            <CardBody className="p-6">
                              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Users size={18} className="text-blue-400" />
                                User Activity
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                  <span className="text-gray-400">Verified Users:</span>
                                  <span className="font-semibold text-white">
                                    {users.filter(u => u.email_verified).length}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                  <span className="text-gray-400">Banned Users:</span>
                                  <span className="font-semibold text-red-400">
                                    {users.filter(u => u.is_banned).length}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-400">Total Sellers:</span>
                                  <span className="font-semibold text-white">
                                    {users.filter(u => u.role?.toLowerCase() === 'seller' || u.role?.toLowerCase() === 'dealer').length}
                                  </span>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                            <CardBody className="p-6">
                              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Car size={18} className="text-green-400" />
                                Listing Activity
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                  <span className="text-gray-400">Active Listings:</span>
                                  <span className="font-semibold text-green-400">
                                    {stats.active_cars || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                  <span className="text-gray-400">Pending Approval:</span>
                                  <span className="font-semibold text-yellow-400">
                                    {stats.pending_approval_cars || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-400">Total Revenue:</span>
                                  <span className="font-semibold text-white">₱0</span>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>

      {/* Reject Car Modal */}
      <Modal
        isOpen={isRejectOpen}
        onOpenChange={onRejectOpenChange}
        size="2xl"
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                  <XCircle className="text-red-500" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Reject Listing</h3>
                  <p className="text-sm text-gray-400 font-normal mt-1">
                    {selectedCar?.title}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                <Card className="bg-black/40 backdrop-blur-md border border-gray-700 mb-4">
                  <CardBody className="p-4">
                    <p className="text-sm text-gray-400">
                      Please provide a detailed reason for rejecting this listing. This will help the seller understand what needs to be improved.
                    </p>
                  </CardBody>
                </Card>

                <Textarea
                  label="Reason for Rejection"
                  labelPlacement="outside"
                  placeholder="Enter a detailed reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  minRows={5}
                  isRequired
                  classNames={{
                    input: "bg-gray-800 text-white",
                    inputWrapper: "bg-gray-800 border-gray-700",
                    label: "text-gray-300 font-medium"
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  This message will be sent to the seller
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  isDisabled={actionLoading}
                  className="font-medium"
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleRejectCar}
                  isLoading={actionLoading}
                  isDisabled={!rejectReason.trim()}
                  startContent={<XCircle size={16} />}
                  className="font-medium"
                >
                  Reject Listing
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
