// ==========================================
// app/admin/cars/page.tsx - Admin Cars Management
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import {
  Car, Search, Filter, Eye, Trash2, CheckCircle,
  XCircle, AlertCircle, FileText, ExternalLink, Calendar, DollarSign
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Car as CarType } from '@/types';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminCarsPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [cars, setCars] = useState<CarType[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [documentToView, setDocumentToView] = useState<string | null>(null);

  const { isOpen: isViewOpen, onOpen: onViewOpen, onOpenChange: onViewOpenChange } = useDisclosure();
  const { isOpen: isDocOpen, onOpen: onDocOpen, onOpenChange: onDocOpenChange } = useDisclosure();

  useEffect(() => {
    if (user && !authLoading) {
      loadCars();
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterCars();
  }, [cars, searchTerm, statusFilter]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllCars();
      if (response.success && response.data) {
        setCars(response.data);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = [...cars];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => {
        const status = car.status?.toUpperCase() || 'PENDING';
        return status === statusFilter.toUpperCase();
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(car =>
        car.listing_title?.toLowerCase().includes(search) ||
        car.brand?.name?.toLowerCase().includes(search) ||
        car.model?.name?.toLowerCase().includes(search) ||
        car.year?.toString().includes(search)
      );
    }

    setFilteredCars(filtered);
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase() || 'PENDING';
    switch (upperStatus) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      case 'SOLD':
        return 'default';
      default:
        return 'default';
    }
  };

  const viewCarDetails = (car: CarType) => {
    setSelectedCar(car);
    onViewOpen();
  };

  const viewDocument = (imageUrl: string) => {
    setDocumentToView(imageUrl);
    onDocOpen();
  };

  const handleDeleteCar = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this car listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deleteCar(carId);
      if (response.success) {
        setCars(prev => prev.filter(car => car.id !== carId));
      } else {
        alert(response.error || 'Failed to delete car');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('An error occurred while deleting the car');
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  const stats = {
    total: cars.length,
    active: cars.filter(c => c.status?.toUpperCase() === 'ACTIVE').length,
    pending: cars.filter(c => c.status?.toUpperCase() === 'PENDING').length,
    rejected: cars.filter(c => c.status?.toUpperCase() === 'REJECTED').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Cars Management</h1>
            <p className="text-gray-400">View and manage all car listings on the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300 font-medium mb-1">Total Cars</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Car className="text-blue-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300 font-medium mb-1">Active</p>
                  <p className="text-3xl font-bold text-white">{stats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-md border border-yellow-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-300 font-medium mb-1">Pending</p>
                  <p className="text-3xl font-bold text-white">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <AlertCircle className="text-yellow-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border border-red-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-300 font-medium mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-white">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <XCircle className="text-red-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by title, brand, model, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search size={18} className="text-gray-400" />}
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-black/40 border-gray-700"
                }}
              />

              <Select
                placeholder="Filter by status"
                selectedKeys={[statusFilter]}
                onChange={(e) => setStatusFilter(e.target.value)}
                startContent={<Filter size={18} className="text-gray-400" />}
                classNames={{
                  trigger: "bg-black/40 border-gray-700",
                  value: "text-white"
                }}
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="rejected">Rejected</SelectItem>
                <SelectItem key="sold">Sold</SelectItem>
              </Select>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Showing {filteredCars.length} of {cars.length} cars</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Cars List */}
        <div className="space-y-4">
          {filteredCars.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
              <CardBody className="p-12 text-center">
                <Car className="text-gray-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No cars found
                </h3>
                <p className="text-gray-400">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No car listings available'}
                </p>
              </CardBody>
            </Card>
          ) : (
            filteredCars.map(car => {
              const mainImage = car.main_image || car.images?.find(img => img.is_main)?.image_url || car.images?.[0]?.image_url;
              const documentImages = car.images?.filter(img => img.image_type === 'document') || [];

              return (
                <Card key={car.id} className="bg-black/40 backdrop-blur-xl border border-gray-700 hover:border-gray-600 transition-all">
                  <CardBody className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Image */}
                      <div className="w-full md:w-64 h-48 bg-black/20 rounded-xl overflow-hidden flex-shrink-0">
                        {mainImage ? (
                          <img
                            src={getImageUrl(mainImage)}
                            alt={car.listing_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="text-gray-600" size={48} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1 truncate">
                              {car.listing_title}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {car.brand?.name} {car.model?.name} • {car.year}
                            </p>
                          </div>
                          <Chip
                            size="sm"
                            color={getStatusColor(car.status || 'PENDING')}
                            variant="flat"
                            className="ml-2 flex-shrink-0"
                          >
                            {car.status?.toUpperCase() || 'PENDING'}
                          </Chip>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price</p>
                            <p className="text-white font-semibold">
                              ₱{car.price?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Mileage</p>
                            <p className="text-white font-semibold">
                              {car.mileage?.toLocaleString()} km
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Seller</p>
                            <p className="text-white font-semibold truncate">
                              {car.seller?.first_name} {car.seller?.last_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Documents</p>
                            <p className="text-white font-semibold">
                              {documentImages.length} file{documentImages.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<Eye size={16} />}
                            onPress={() => viewCarDetails(car)}
                          >
                            View Details
                          </Button>

                          {documentImages.length > 0 && (
                            <Button
                              size="sm"
                              color="warning"
                              variant="flat"
                              startContent={<FileText size={16} />}
                              onPress={() => {
                                setSelectedCar(car);
                                viewDocument(documentImages[0].image_url);
                              }}
                            >
                              View Documents ({documentImages.length})
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="flat"
                            startContent={<ExternalLink size={16} />}
                            as="a"
                            href={`/cars/${car.id}`}
                            target="_blank"
                          >
                            Public Page
                          </Button>

                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            startContent={<Trash2 size={16} />}
                            onPress={() => handleDeleteCar(car.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* View Car Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onOpenChange={onViewOpenChange}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">{selectedCar?.listing_title}</h2>
                <p className="text-sm text-gray-500">
                  ID: #{selectedCar?.id} • Status: {selectedCar?.status?.toUpperCase()}
                </p>
              </ModalHeader>
              <ModalBody>
                {selectedCar && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Brand & Model</p>
                        <p className="font-semibold">{selectedCar.brand?.name} {selectedCar.model?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Year</p>
                        <p className="font-semibold">{selectedCar.year}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-semibold">₱{selectedCar.price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mileage</p>
                        <p className="font-semibold">{selectedCar.mileage?.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Transmission</p>
                        <p className="font-semibold">{selectedCar.transmission}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fuel Type</p>
                        <p className="font-semibold">{selectedCar.fuel_type}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">Description</p>
                      <p className="text-sm">{selectedCar.description || 'No description provided'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">Seller Information</p>
                      <p className="font-semibold">
                        {selectedCar.seller?.first_name} {selectedCar.seller?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{selectedCar.seller?.email}</p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Document Modal */}
      <Modal
        isOpen={isDocOpen}
        onOpenChange={onDocOpenChange}
        size="5xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Document Viewer
                {selectedCar && (
                  <p className="text-sm text-gray-500 font-normal">
                    {selectedCar.listing_title}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                {documentToView && (
                  <div className="w-full h-[70vh] bg-black/20 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(documentToView)}
                      alt="Document"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Show all documents for this car */}
                {selectedCar && selectedCar.images && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">All Documents:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCar.images
                        .filter(img => img.image_type === 'document')
                        .map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setDocumentToView(img.image_url)}
                            className="aspect-video bg-black/20 rounded-lg overflow-hidden hover:ring-2 ring-primary-500 transition-all"
                          >
                            <img
                              src={getImageUrl(img.image_url)}
                              alt={`Document ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  as="a"
                  href={getImageUrl(documentToView || '')}
                  target="_blank"
                  startContent={<ExternalLink size={16} />}
                >
                  Open in New Tab
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
