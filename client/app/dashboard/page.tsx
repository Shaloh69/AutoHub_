// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { PlusIcon, EditIcon, DeleteIcon, VerticalDotsIcon, EyeIcon, DashboardIcon } from "@/components/icons";
import { apiService, getImageUrl } from '@/services/api';
import { Car } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyListings();
    }
  }, [isAuthenticated]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getMyListings();
      
      if (response.success && Array.isArray(response.data)) {
        setMyListings(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch listings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async () => {
    if (!deletingCar) return;

    try {
      await apiService.deleteCar(deletingCar.id);
      setMyListings(prev => prev.filter(car => car.id !== deletingCar.id));
      setDeletingCar(null);
      onDeleteOpenChange();
    } catch (err) {
      console.error('Failed to delete car:', err);
    }
  };

  const handleMarkAsSold = async (carId: string) => {
    try {
      await apiService.markCarAsSold(carId);
      fetchMyListings();
    } catch (err) {
      console.error('Failed to mark as sold:', err);
    }
  };

  const openDeleteModal = (car: Car) => {
    setDeletingCar(car);
    onDeleteOpen();
  };

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const activeListings = myListings.filter(car => car.status === 'ACTIVE').length;
  const soldListings = myListings.filter(car => car.status === 'SOLD').length;
  const totalValue = myListings.reduce((sum, car) => sum + car.price, 0);

  return (
    <div className="space-y-8">
      {/* Header with Welcome */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-autohub-accent2-500/10 text-autohub-accent2-600 px-4 py-2 rounded-full text-sm font-medium">
          <DashboardIcon size={16} />
          Premium Dashboard
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
          Welcome back,
          <span className="bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent ml-3">
            {user?.firstName}
          </span>
        </h1>
        <p className="text-xl text-autohub-accent1-600">
          Manage your luxury vehicle listings and account
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-autohub-accent1-200 hover:border-autohub-primary-500/50 transition-colors bg-gradient-to-br from-autohub-neutral-50 to-autohub-neutral-100 dark:from-autohub-secondary-800 dark:to-autohub-secondary-900">
          <CardBody className="text-center p-6">
            <div className="w-12 h-12 bg-autohub-primary-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">{myListings.length}</span>
            </div>
            <p className="text-sm text-autohub-accent1-600 font-medium">Total Listings</p>
          </CardBody>
        </Card>
        
        <Card className="border border-autohub-accent1-200 hover:border-autohub-accent2-500/50 transition-colors bg-gradient-to-br from-autohub-accent2-50 to-autohub-accent2-100 dark:from-autohub-accent2-950 dark:to-autohub-secondary-900">
          <CardBody className="text-center p-6">
            <div className="w-12 h-12 bg-autohub-accent2-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-autohub-secondary-900 font-bold text-xl">{activeListings}</span>
            </div>
            <p className="text-sm text-autohub-accent1-600 font-medium">Active Listings</p>
          </CardBody>
        </Card>
        
        <Card className="border border-autohub-accent1-200 hover:border-green-500/50 transition-colors bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-autohub-secondary-900">
          <CardBody className="text-center p-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">{soldListings}</span>
            </div>
            <p className="text-sm text-autohub-accent1-600 font-medium">Sold Vehicles</p>
          </CardBody>
        </Card>
        
        <Card className="border border-autohub-accent1-200 hover:border-autohub-accent1-500/50 transition-colors bg-gradient-to-br from-autohub-accent1-50 to-autohub-accent1-100 dark:from-autohub-accent1-950 dark:to-autohub-secondary-900">
          <CardBody className="text-center p-6">
            <div className="w-12 h-12 bg-autohub-accent1-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <p className="text-sm text-autohub-accent1-600 font-medium">Portfolio Value</p>
            <p className="text-xs text-autohub-accent1-500 mt-1">{formatPrice(totalValue)}</p>
          </CardBody>
        </Card>
      </div>

      <Tabs
        items={[
          {
        key: "listings",
        title: "My Listings",
        content: (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">Vehicle Listings</h2>
            <p className="text-autohub-accent1-600">{myListings.length} total vehicles in your portfolio</p>
          </div>
          <Button
            className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold shadow-autohub transition-all duration-200 hover:shadow-lg hover:scale-105"
            startContent={<PlusIcon />}
            onPress={() => router.push('/dashboard/create-listing')}
            size="lg"
          >
            List New Vehicle
          </Button>
            </div>

            {/* Listings */}
            {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="primary" />
          </div>
            ) : error ? (
          <div className="text-center py-16">
            <p className="text-autohub-primary-500 text-lg mb-4">Error: {error}</p>
            <Button
              className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white"
              onPress={fetchMyListings}
            >
              Try Again
            </Button>
          </div>
            ) : myListings.length === 0 ? (
          <Card className="border border-autohub-accent1-200">
            <CardBody className="text-center py-16">
              <div className="w-20 h-20 bg-autohub-accent1-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlusIcon className="text-autohub-accent1-500" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50 mb-2">
                No listings yet
              </h3>
              <p className="text-autohub-accent1-600 mb-6 max-w-md mx-auto">
                Start building your automotive portfolio by listing your first premium vehicle
              </p>
              <Button
                className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold"
                size="lg"
                onPress={() => router.push('/dashboard/create-listing')}
              >
                Create First Listing
              </Button>
            </CardBody>
          </Card>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map((car) => (
              <Card 
            key={car.id} 
            className="group hover:shadow-autohub transition-all duration-300 hover:-translate-y-1 border border-autohub-accent1-200 hover:border-autohub-primary-500/50"
              >
            <CardBody className="p-0">
              <div className="relative">
                <Image
              src={getImageUrl(car.images?.[0]?.image_url)}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              radius="none"
                />
                <div className="absolute top-3 left-3 flex gap-2">
              {car.isFeatured && (
                <Chip className="bg-autohub-accent2-500 text-autohub-secondary-900 font-semibold" size="sm">
                  Featured
                </Chip>
              )}
              <Chip
                size="sm"
                className={`font-medium ${
                  car.status === 'ACTIVE' 
                ? 'bg-green-500 text-white' 
                : car.status === 'SOLD' 
                ? 'bg-autohub-accent1-500 text-white' 
                : 'bg-amber-500 text-white'
                }`}
              >
                {car.status}
              </Chip>
                </div>
                <div className="absolute top-3 right-3">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                isIconOnly 
                size="sm" 
                className="bg-autohub-neutral-50/90 hover:bg-autohub-neutral-50 text-autohub-secondary-900"
                  >
                <VerticalDotsIcon />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Car actions">
                  <DropdownItem
                key="view"
                startContent={<EyeIcon />}
                onPress={() => router.push(`/cars/${car.id}`)}
                  >
                View Listing
                  </DropdownItem>
                  <DropdownItem
                key="edit"
                startContent={<EditIcon />}
                onPress={() => router.push(`/dashboard/edit-listing/${car.id}`)}
                  >
                Edit Details
                  </DropdownItem>
                  {car.status === 'ACTIVE' && (
                <DropdownItem
                  key="sold"
                  onPress={() => handleMarkAsSold(car.id)}
                  className="text-green-600"
                >
                  Mark as Sold
                </DropdownItem>
                  )}
                  <DropdownItem
                key="delete"
                className="text-autohub-primary-500"
                onPress={() => openDeleteModal(car)}
                  >
                Delete Listing
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-autohub-secondary-900 dark:text-autohub-neutral-50">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-2xl font-bold text-autohub-primary-500">
                  {formatPrice(car.price)}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-autohub-accent1-600">
                    <span>{new Intl.NumberFormat().format(car.mileage)} miles</span>
                    <span>{car.location}</span>
                  </div>
                  <div className="flex justify-between text-sm text-autohub-accent1-600">
                    <span>Listed: {new Date(car.createdAt).toLocaleDateString()}</span>
                    <span>{car.fuelType}</span>
                  </div>
                </div>
              </div>
            </CardBody>
              </Card>
            ))}
          </div>
            )}
          </div>
        ),
          },
          {
        key: "profile",
        title: "Profile",
        content: (
          <Card className="border border-autohub-accent1-200">
            <CardHeader>
          <h3 className="text-xl font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Account Information
          </h3>
            </CardHeader>
            <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
            <label className="text-sm font-medium text-autohub-accent1-600">Full Name</label>
            <p className="text-lg text-autohub-secondary-900 dark:text-autohub-neutral-50">
              {user?.firstName} {user?.lastName}
            </p>
              </div>
              <div>
            <label className="text-sm font-medium text-autohub-accent1-600">Email Address</label>
            <p className="text-lg text-autohub-secondary-900 dark:text-autohub-neutral-50">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
            <label className="text-sm font-medium text-autohub-accent1-600">Member Since</label>
            <p className="text-lg text-autohub-secondary-900 dark:text-autohub-neutral-50">
              {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
              </div>
              <div>
            <label className="text-sm font-medium text-autohub-accent1-600">Account Status</label>
            <div className="flex items-center gap-2">
              <Chip 
                color={user?.isVerified ? 'success' : 'warning'} 
                size="sm"
                className={user?.isVerified ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}
              >
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </Chip>
            </div>
              </div>
            </div>
          </div>
          <Button 
            className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white" 
            onPress={() => router.push('/dashboard/profile')}
          >
            Edit Profile
          </Button>
            </CardBody>
          </Card>
        ),
          },
          {
        key: "subscription",
        title: "Premium",
        content: (
          <Card className="border border-autohub-accent2-300 bg-gradient-to-br from-autohub-accent2-50 to-autohub-neutral-50 dark:from-autohub-accent2-950 dark:to-autohub-secondary-900">
            <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-autohub-accent2-500 rounded-lg flex items-center justify-center">
              <span className="text-autohub-secondary-900 font-bold">★</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Premium Membership
              </h3>
              <p className="text-autohub-accent1-600">Unlock exclusive features</p>
            </div>
          </div>
            </CardHeader>
            <CardBody>
          <div className="text-center py-8">
            <p className="text-autohub-accent1-600 mb-6">
              Upgrade to AutoHub Premium for enhanced listing features, priority support, and exclusive benefits
            </p>
            <Button 
              className="bg-autohub-accent2-500 hover:bg-autohub-accent2-600 text-autohub-secondary-900 font-semibold shadow-gold"
              size="lg"
              onPress={() => router.push('/subscription')}
            >
              View Premium Plans
            </Button>
          </div>
            </CardBody>
          </Card>
        ),
          },
        ]}
        aria-label="Dashboard sections"
        color="primary"
        variant="underlined"
        size="lg"
      />

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteOpen} 
        onOpenChange={onDeleteOpenChange}
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
                Confirm Deletion
              </ModalHeader>
              <ModalBody>
                <p className="text-autohub-accent1-700">
                  Are you sure you want to delete the listing for{' '}
                  <strong className="text-autohub-secondary-900 dark:text-autohub-neutral-50">
                    {deletingCar?.year} {deletingCar?.make} {deletingCar?.model}
                  </strong>?
                </p>
                <p className="text-autohub-primary-500 text-sm font-medium">
                  This action cannot be undone.
                </p>
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
                  onPress={handleDeleteCar}
                >
                  Delete Listing
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}