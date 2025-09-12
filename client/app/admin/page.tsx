"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { apiService, Car, User } from '@/services/api';
import { useRequireAdmin } from '@/contexts/AuthContext';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useRequireAdmin();
  
  const [pendingCars, setPendingCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pendingResponse, usersResponse, analyticsResponse] = await Promise.all([
        apiService.getPendingCars(),
        apiService.getUsers(),
        apiService.getAdminAnalytics()
      ]);

      if (pendingResponse.success && Array.isArray(pendingResponse.data)) {
        setPendingCars(pendingResponse.data);
      }

      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        setUsers(usersResponse.data);
      }

      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCar = async (carId: string) => {
    try {
      setActionLoading(true);
      await apiService.approveCar(carId);
      setPendingCars(prev => prev.filter(car => car.id !== carId));
    } catch (err) {
      console.error('Failed to approve car:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCar = async () => {
    if (!selectedCar) return;

    try {
      setActionLoading(true);
      await apiService.rejectCar(selectedCar.id, rejectReason);
      setPendingCars(prev => prev.filter(car => car.id !== selectedCar.id));
      setSelectedCar(null);
      setRejectReason('');
      onRejectOpenChange();
    } catch (err) {
      console.error('Failed to reject car:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      await apiService.banUser(userId, reason);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBanned: true } : user
      ));
    } catch (err) {
      console.error('Failed to ban user:', err);
    }
  };

  const openRejectModal = (car: Car) => {
    setSelectedCar(car);
    onRejectOpen();
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-autohub-primary-500 text-lg mb-4">Error: {error}</p>
          <Button 
            className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white" 
            onPress={fetchData}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-autohub-accent2-500/10 text-autohub-accent2-600 px-4 py-2 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-autohub-accent2-500 rounded-full animate-pulse"></span>
          Administrative Dashboard
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
          AutoHub
          <span className="bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent ml-3">
            Admin Panel
          </span>
        </h1>
        <p className="text-xl text-autohub-accent1-600">
          Manage platform operations, users, and premium listings
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border border-autohub-accent1-200 hover:border-autohub-primary-500/50 transition-colors bg-gradient-to-br from-autohub-primary-50 to-autohub-primary-100 dark:from-autohub-primary-950 dark:to-autohub-secondary-900">
            <CardBody className="text-center p-6">
              <div className="w-12 h-12 bg-autohub-primary-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <p className="text-3xl font-bold text-autohub-primary-500">{analytics.totalUsers || 0}</p>
              <p className="text-sm text-autohub-accent1-600 font-medium">Total Users</p>
            </CardBody>
          </Card>
          
          <Card className="border border-autohub-accent1-200 hover:border-green-500/50 transition-colors bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-autohub-secondary-900">
            <CardBody className="text-center p-6">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm2 10a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1z"/>
                </svg>
              </div>
              <p className="text-3xl font-bold text-green-500">{analytics.totalCars || 0}</p>
              <p className="text-sm text-autohub-accent1-600 font-medium">Total Listings</p>
            </CardBody>
          </Card>
          
          <Card className="border border-autohub-accent1-200 hover:border-amber-500/50 transition-colors bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-autohub-secondary-900">
            <CardBody className="text-center p-6">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">{pendingCars.length}</span>
              </div>
              <p className="text-3xl font-bold text-amber-500">{pendingCars.length}</p>
              <p className="text-sm text-autohub-accent1-600 font-medium">Pending Review</p>
            </CardBody>
          </Card>
          
          <Card className="border border-autohub-accent1-200 hover:border-autohub-accent2-500/50 transition-colors bg-gradient-to-br from-autohub-accent2-50 to-autohub-accent2-100 dark:from-autohub-accent2-950 dark:to-autohub-secondary-900">
            <CardBody className="text-center p-6">
              <div className="w-12 h-12 bg-autohub-accent2-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-autohub-secondary-900 font-bold">★</span>
              </div>
              <p className="text-3xl font-bold text-autohub-accent2-500">{analytics.activeSubscriptions || 0}</p>
              <p className="text-sm text-autohub-accent1-600 font-medium">Premium Members</p>
            </CardBody>
          </Card>
        </div>
      )}

      <Tabs aria-label="Admin sections" color="primary" variant="underlined" size="lg">
        <Tab key="pending" title={`Pending Cars (${pendingCars.length})`}>
          <div className="space-y-6">
            {pendingCars.length === 0 ? (
              <Card className="border border-autohub-accent1-200">
                <CardBody className="text-center py-16">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="text-green-500" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50 mb-2">
                    All listings reviewed
                  </h3>
                  <p className="text-autohub-accent1-600">No vehicles are currently pending approval</p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {pendingCars.map((car) => (
                  <Card 
                    key={car.id} 
                    className="border border-autohub-accent1-200 hover:border-autohub-primary-500/50 hover:shadow-autohub transition-all duration-300"
                  >
                    <CardBody className="space-y-6 p-6">
                      <div className="flex gap-4">
                        <Image
                          src={car.images[0] || '/placeholder-car.jpg'}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <h3 className="font-bold text-lg text-autohub-secondary-900 dark:text-autohub-neutral-50">
                            {car.year} {car.make} {car.model}
                          </h3>
                          <p className="text-2xl font-bold text-autohub-primary-500">
                            {formatPrice(car.price)}
                          </p>
                          <div className="space-y-1 text-sm text-autohub-accent1-600">
                            <p>{new Intl.NumberFormat().format(car.mileage)} miles • {car.location}</p>
                            <p>Listed by: <span className="font-medium">{car.user?.firstName} {car.user?.lastName}</span></p>
                            <p>Submitted: <span className="font-medium">{new Date(car.createdAt).toLocaleDateString()}</span></p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-autohub-accent1-700 line-clamp-3 bg-autohub-neutral-100 dark:bg-autohub-secondary-800 p-3 rounded-lg">
                        {car.description}
                      </p>
                      
                      <div className="flex gap-3">
                        <Button
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold flex-1"
                          onPress={() => handleApproveCar(car.id)}
                          isLoading={actionLoading}
                          size="lg"
                        >
                          Approve Listing
                        </Button>
                        <Button
                          variant="bordered"
                          onPress={() => openRejectModal(car)}
                          isLoading={actionLoading}
                          className="border-autohub-primary-500 text-autohub-primary-500 hover:bg-autohub-primary-500 hover:text-white flex-1"
                          size="lg"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="light"
                          onPress={() => window.open(`/cars/${car.id}`, '_blank')}
                          className="text-autohub-accent1-600 hover:text-autohub-primary-500"
                          size="lg"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        <Tab key="users" title={`Users (${users.length})`}>
          <Card className="border border-autohub-accent1-200">
            <CardBody className="p-0">
              <Table aria-label="Users table" className="min-h-[400px]">
                <TableHeader>
                  <TableColumn className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">USER</TableColumn>
                  <TableColumn className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">EMAIL</TableColumn>
                  <TableColumn className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">ROLE</TableColumn>
                  <TableColumn className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">JOINED</TableColumn>
                  <TableColumn className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">STATUS</TableColumn>
                  <TableColumn className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-autohub-neutral-50 dark:hover:bg-autohub-secondary-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-autohub-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-autohub-secondary-900 dark:text-autohub-neutral-50">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-autohub-accent1-600">{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          className={`${
                            user.role === 'ADMIN' 
                              ? 'bg-autohub-primary-500 text-white' 
                              : user.role === 'MODERATOR' 
                              ? 'bg-autohub-accent2-500 text-autohub-secondary-900' 
                              : 'bg-autohub-accent1-500 text-white'
                          }`}
                        >
                          {user.role}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-autohub-accent1-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          className={`${
                            user.isVerified 
                              ? 'bg-green-500 text-white' 
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.role === 'USER' && (
                            <Button
                              size="sm"
                              variant="bordered"
                              onPress={() => handleBanUser(user.id, 'Banned by admin')}
                              className="border-autohub-primary-500 text-autohub-primary-500 hover:bg-autohub-primary-500 hover:text-white"
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
        </Tab>

        <Tab key="analytics" title="Analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border border-autohub-accent1-200">
              <CardHeader className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">
                <h3 className="text-lg font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                  Platform Statistics
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {analytics ? (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-autohub-accent1-200">
                      <span className="text-autohub-accent1-600">Total Revenue:</span>
                      <span className="font-bold text-autohub-primary-500 text-lg">
                        {formatPrice(analytics.totalRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-autohub-accent1-200">
                      <span className="text-autohub-accent1-600">Active Listings:</span>
                      <span className="font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                        {analytics.activeListings || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-autohub-accent1-200">
                      <span className="text-autohub-accent1-600">Vehicles Sold:</span>
                      <span className="font-bold text-green-500">
                        {analytics.soldCars || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-autohub-accent1-600">Conversion Rate:</span>
                      <span className="font-bold text-autohub-accent2-500">
                        {analytics.conversionRate || 0}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Spinner color="primary" />
                    <p className="text-autohub-accent1-600 mt-2">Loading analytics...</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="border border-autohub-accent1-200">
              <CardHeader className="bg-autohub-neutral-100 dark:bg-autohub-secondary-800">
                <h3 className="text-lg font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                  Recent Activity
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-autohub-accent1-200">
                  <span className="text-autohub-accent1-600">New registrations today:</span>
                  <span className="font-bold text-autohub-primary-500">
                    {analytics?.newUsersToday || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-autohub-accent1-200">
                  <span className="text-autohub-accent1-600">New listings today:</span>
                  <span className="font-bold text-autohub-accent2-500">
                    {analytics?.newListingsToday || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-autohub-accent1-200">
                  <span className="text-autohub-accent1-600">Cars sold today:</span>
                  <span className="font-bold text-green-500">
                    {analytics?.carsSoldToday || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-autohub-accent1-600">Revenue today:</span>
                  <span className="font-bold text-autohub-primary-500">
                    {formatPrice(analytics?.revenueToday || 0)}
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* Reject Car Modal */}
      <Modal 
        isOpen={isRejectOpen} 
        onOpenChange={onRejectOpenChange}
        classNames={{
          base: "border border-autohub-accent1-300",
          header: "border-b border-autohub-accent1-200",
          footer: "border-t border-autohub-accent1-200",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                Reject Vehicle Listing
              </ModalHeader>
              <ModalBody>
                <p className="mb-4 text-autohub-accent1-700">
                  Why are you rejecting the listing for{' '}
                  <strong className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                    {selectedCar?.year} {selectedCar?.make} {selectedCar?.model}
                  </strong>?
                </p>
                <Textarea
                  label="Rejection Reason"
                  placeholder="Please provide a detailed reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  minRows={4}
                  isRequired
                  variant="bordered"
                  classNames={{
                    inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500",
                    input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                    label: "text-autohub-accent1-700",
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={onClose}
                  className="text-autohub-accent1-600"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white"
                  onPress={handleRejectCar}
                  isLoading={actionLoading}
                  disabled={!rejectReason.trim()}
                >
                  Reject Listing
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}