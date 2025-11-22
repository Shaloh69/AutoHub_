// ==========================================
// app/admin/cars/page.tsx - Admin Cars Management
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Textarea } from '@heroui/input';
import {
  Car, Search, Filter, Eye, Trash2, CheckCircle,
  XCircle, AlertCircle, FileText, ExternalLink, Calendar, DollarSign,
  FileCheck, ImageIcon, User
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Car as CarType } from '@/types';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminCarsPage() {
  const [mounted, setMounted] = useState(false);
  const { user, loading: authLoading } = useRequireAdmin();

  const [cars, setCars] = useState<CarType[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [documentToView, setDocumentToView] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { isOpen: isViewOpen, onOpen: onViewOpen, onOpenChange: onViewOpenChange } = useDisclosure();
  const { isOpen: isDocOpen, onOpen: onDocOpen, onOpenChange: onDocOpenChange } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      loadCars();
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterCars();
  }, [cars, searchTerm, statusFilter, approvalFilter]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminCars();
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

    // Filter by approval status
    if (approvalFilter !== 'all') {
      filtered = filtered.filter(car => {
        const approvalStatus = car.approval_status?.toUpperCase() || 'PENDING';
        return approvalStatus === approvalFilter.toUpperCase();
      });
    }

    // Filter by search term - FIXED: using 'title' instead of 'listing_title'
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(car =>
        car.title?.toLowerCase().includes(search) ||
        car.brand_rel?.name?.toLowerCase().includes(search) ||
        car.model_rel?.name?.toLowerCase().includes(search) ||
        car.year?.toString().includes(search) ||
        car.seller?.first_name?.toLowerCase().includes(search) ||
        car.seller?.last_name?.toLowerCase().includes(search)
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
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getApprovalColor = (approvalStatus: string) => {
    const upperStatus = approvalStatus?.toUpperCase() || 'PENDING';
    switch (upperStatus) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const viewCarDetails = (car: CarType) => {
    setSelectedCar(car);
    onViewOpen();
  };

  const viewDocuments = (car: CarType) => {
    const documentImages = car.images?.filter(img => img.image_type?.toUpperCase() === 'DOCUMENT') || [];
    const actualDocuments = car.documents || [];

    // Prioritize actual documents over images
    if (actualDocuments.length > 0) {
      setSelectedCar(car);
      setDocumentToView(actualDocuments[0].document_url);
      onDocOpen();
    } else if (documentImages.length > 0) {
      setSelectedCar(car);
      setDocumentToView(documentImages[0].image_url);
      onDocOpen();
    }
  };

  const handleApproveCar = async (carId: number) => {
    if (!confirm('Are you sure you want to approve this car listing?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.approveCar(carId);

      if (response.success) {
        // Update the car in the list
        setCars(prev => prev.map(car =>
          car.id === carId
            ? { ...car, approval_status: 'APPROVED', status: 'ACTIVE' }
            : car
        ));
        alert('Car listing approved successfully!');
      } else {
        alert(response.error || 'Failed to approve car');
      }
    } catch (error) {
      console.error('Error approving car:', error);
      alert('An error occurred while approving the car');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (car: CarType) => {
    setSelectedCar(car);
    setRejectReason('');
    onRejectOpen();
  };

  const handleRejectCar = async () => {
    if (!selectedCar) return;

    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.rejectCar(selectedCar.id, rejectReason);

      if (response.success) {
        // Update the car in the list
        setCars(prev => prev.map(car =>
          car.id === selectedCar.id
            ? { ...car, approval_status: 'REJECTED', status: 'INACTIVE', rejection_reason: rejectReason }
            : car
        ));
        setSelectedCar(null);
        setRejectReason('');
        onRejectOpenChange();
        alert('Car listing rejected successfully!');
      } else {
        alert(response.error || 'Failed to reject car');
      }
    } catch (error) {
      console.error('Error rejecting car:', error);
      alert('An error occurred while rejecting the car');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCar = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this car listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deleteCar(carId);
      if (response.success) {
        setCars(prev => prev.filter(car => car.id !== carId));
        alert('Car listing deleted successfully!');
      } else {
        alert(response.error || 'Failed to delete car');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('An error occurred while deleting the car');
    }
  };

  // Prevent SSR rendering issues
  if (!mounted || authLoading || loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  const stats = {
    total: cars.length,
    active: cars.filter(c => c.status?.toUpperCase() === 'ACTIVE').length,
    pending: cars.filter(c => c.approval_status?.toUpperCase() === 'PENDING').length,
    rejected: cars.filter(c => c.approval_status?.toUpperCase() === 'REJECTED').length,
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
                  <p className="text-sm text-yellow-300 font-medium mb-1">Pending Approval</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by title, brand, model, year, or seller..."
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
                <SelectItem key="all" value="all">All Status</SelectItem>
                <SelectItem key="active" value="active">Active</SelectItem>
                <SelectItem key="pending" value="pending">Pending</SelectItem>
                <SelectItem key="sold" value="sold">Sold</SelectItem>
                <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
              </Select>

              <Select
                placeholder="Filter by approval"
                selectedKeys={[approvalFilter]}
                onChange={(e) => setApprovalFilter(e.target.value)}
                startContent={<FileCheck size={18} className="text-gray-400" />}
                classNames={{
                  trigger: "bg-black/40 border-gray-700",
                  value: "text-white"
                }}
              >
                <SelectItem key="all" value="all">All Approval Status</SelectItem>
                <SelectItem key="pending" value="pending">Pending</SelectItem>
                <SelectItem key="approved" value="approved">Approved</SelectItem>
                <SelectItem key="rejected" value="rejected">Rejected</SelectItem>
              </Select>

              <div className="flex items-center justify-end gap-2 text-sm text-gray-400">
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
                  {searchTerm || statusFilter !== 'all' || approvalFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No car listings available'}
                </p>
              </CardBody>
            </Card>
          ) : (
            filteredCars.map(car => {
              const mainImage = car.main_image || car.images?.find(img => img.is_main)?.image_url || car.images?.[0]?.image_url;
              const documentImages = car.images?.filter(img => img.image_type?.toUpperCase() === 'DOCUMENT') || [];
              const actualDocuments = car.documents || [];
              const totalDocuments = documentImages.length + actualDocuments.length;
              const isPending = car.approval_status?.toUpperCase() === 'PENDING';
              const isRejected = car.approval_status?.toUpperCase() === 'REJECTED';

              return (
                <Card
                  key={car.id}
                  className={`bg-black/40 backdrop-blur-xl border transition-all ${
                    isPending ? 'border-yellow-500/40 hover:border-yellow-500/60' :
                    isRejected ? 'border-red-500/40 hover:border-red-500/60' :
                    'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <CardBody className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Image */}
                      <div className="w-full lg:w-72 h-48 bg-black/20 rounded-xl overflow-hidden flex-shrink-0 relative">
                        {mainImage ? (
                          <img
                            src={getImageUrl(mainImage)}
                            alt={car.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="text-gray-600" size={48} />
                          </div>
                        )}
                        {/* Image count badge */}
                        {car.images && car.images.length > 0 && (
                          <div className="absolute top-2 left-2">
                            <Chip size="sm" className="bg-black/60 text-white backdrop-blur-sm">
                              <ImageIcon size={12} className="mr-1" />
                              {car.images.length}
                            </Chip>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-4">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1 truncate">
                              {car.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">
                              {car.brand_rel?.name} {car.model_rel?.name} • {car.year}
                            </p>
                            {car.seller && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <User size={14} />
                                <span>{car.seller.first_name} {car.seller.last_name}</span>
                                {car.seller.email_verified && (
                                  <Chip size="sm" color="success" variant="flat" className="text-xs">
                                    Verified
                                  </Chip>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 items-end">
                            <Chip
                              size="sm"
                              color={getStatusColor(car.status || 'PENDING')}
                              variant="flat"
                              className="font-medium"
                            >
                              {car.status?.toUpperCase() || 'PENDING'}
                            </Chip>
                            <Chip
                              size="sm"
                              color={getApprovalColor(car.approval_status || 'PENDING')}
                              variant="flat"
                              className="font-medium"
                            >
                              {car.approval_status?.toUpperCase() || 'PENDING'}
                            </Chip>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <DollarSign size={12} />
                              Price
                            </p>
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
                            <p className="text-xs text-gray-500 mb-1">Fuel / Trans</p>
                            <p className="text-white font-semibold text-sm truncate capitalize">
                              {car.fuel_type} / {car.transmission}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <FileText size={12} />
                              Documents
                            </p>
                            <p className="text-white font-semibold">
                              {documentImages.length} file{documentImages.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Rejection Reason */}
                        {isRejected && car.rejection_reason && (
                          <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                            <p className="text-xs text-red-300 font-medium mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-200">{car.rejection_reason}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {/* Approve/Reject buttons for pending cars */}
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                color="success"
                                onPress={() => handleApproveCar(car.id)}
                                isLoading={actionLoading}
                                startContent={<CheckCircle size={16} />}
                                className="font-medium"
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
                                className="font-medium"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {/* View Details Button */}
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<Eye size={16} />}
                            onPress={() => viewCarDetails(car)}
                          >
                            Details
                          </Button>

                          {/* View Documents Button - Always show for verification */}
                          <Button
                            size="sm"
                            color={totalDocuments > 0 ? "warning" : "default"}
                            variant="flat"
                            startContent={<FileText size={16} />}
                            onPress={() => totalDocuments > 0 ? viewDocuments(car) : alert('No documents uploaded for this car')}
                          >
                            Documents ({totalDocuments})
                          </Button>

                          {/* Public Page Button */}
                          <Button
                            size="sm"
                            variant="flat"
                            startContent={<ExternalLink size={16} />}
                            as="a"
                            href={`/cars/${car.id}`}
                            target="_blank"
                          >
                            Public View
                          </Button>

                          {/* Delete Button */}
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

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onOpenChange={onRejectOpenChange}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-red-600">Reject Car Listing</h2>
                {selectedCar && (
                  <p className="text-sm text-gray-500 font-normal">
                    {selectedCar.title}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">
                      <strong>Warning:</strong> This will reject the car listing and notify the seller.
                      Please provide a clear reason for rejection.
                    </p>
                  </div>

                  <Textarea
                    label="Rejection Reason"
                    placeholder="Enter the reason for rejecting this listing..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    minRows={4}
                    isRequired
                    description="This message will be sent to the seller"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleRejectCar}
                  isLoading={actionLoading}
                  startContent={<XCircle size={16} />}
                >
                  Reject Listing
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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
                <h2 className="text-2xl font-bold">{selectedCar?.title}</h2>
                <p className="text-sm text-gray-500">
                  ID: #{selectedCar?.id} • Status: {selectedCar?.status?.toUpperCase()} •
                  Approval: {selectedCar?.approval_status?.toUpperCase()}
                </p>
              </ModalHeader>
              <ModalBody>
                {selectedCar && (
                  <div className="space-y-6">
                    {/* Main Image */}
                    {(selectedCar.main_image || selectedCar.images?.[0]) && (
                      <div className="w-full h-64 bg-black/20 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(selectedCar.main_image || selectedCar.images?.[0]?.image_url)}
                          alt={selectedCar.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Brand & Model</p>
                        <p className="font-semibold">{selectedCar.brand_rel?.name} {selectedCar.model_rel?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Year</p>
                        <p className="font-semibold">{selectedCar.year}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Price</p>
                        <p className="font-semibold">₱{selectedCar.price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Mileage</p>
                        <p className="font-semibold">{selectedCar.mileage?.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Transmission</p>
                        <p className="font-semibold capitalize">{selectedCar.transmission}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Fuel Type</p>
                        <p className="font-semibold capitalize">{selectedCar.fuel_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Condition</p>
                        <p className="font-semibold capitalize">{selectedCar.car_condition?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Views</p>
                        <p className="font-semibold">{selectedCar.views_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Inquiries</p>
                        <p className="font-semibold">{selectedCar.inquiry_count || 0}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-500 mb-2 font-medium">Description</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedCar.description || 'No description provided'}</p>
                    </div>

                    {/* Features */}
                    {selectedCar.features && selectedCar.features.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2 font-medium">Features</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCar.features.map(feature => (
                            <Chip key={feature.id} size="sm" variant="flat">
                              {feature.name}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seller Information */}
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500 mb-3 font-medium">Seller Information</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="font-semibold">
                            {selectedCar.seller?.first_name} {selectedCar.seller?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-semibold">{selectedCar.seller?.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
                          <Chip size="sm" variant="flat" className="capitalize">
                            {selectedCar.seller?.role?.toLowerCase()}
                          </Chip>
                        </div>
                        {selectedCar.seller?.business_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Business:</span>
                            <span className="font-semibold">{selectedCar.seller.business_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vehicle History */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Accident History</p>
                        <Chip size="sm" color={selectedCar.accident_history ? 'danger' : 'success'}>
                          {selectedCar.accident_history ? 'Yes' : 'No'}
                        </Chip>
                      </div>
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Flood History</p>
                        <Chip size="sm" color={selectedCar.flood_history ? 'danger' : 'success'}>
                          {selectedCar.flood_history ? 'Yes' : 'No'}
                        </Chip>
                      </div>
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">LTO Registered</p>
                        <Chip size="sm" color={selectedCar.lto_registered ? 'success' : 'warning'}>
                          {selectedCar.lto_registered ? 'Yes' : 'No'}
                        </Chip>
                      </div>
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Number of Owners</p>
                        <p className="font-semibold">{selectedCar.number_of_owners}</p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  as="a"
                  href={`/cars/${selectedCar?.id}`}
                  target="_blank"
                  startContent={<ExternalLink size={16} />}
                >
                  View Public Page
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
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div>
                  <h2 className="text-xl font-bold">Document Viewer</h2>
                  {selectedCar && (
                    <p className="text-sm text-gray-500 font-normal mt-1">
                      {selectedCar.title}
                    </p>
                  )}
                </div>
              </ModalHeader>
              <ModalBody>
                {/* Main Document View */}
                {documentToView && (
                  <div className="w-full h-[60vh] bg-black/20 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(documentToView)}
                      alt="Document"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* All Documents Thumbnails */}
                {selectedCar && (
                  <div className="mt-4">
                    {(() => {
                      const documentImages = selectedCar.images?.filter(img => img.image_type?.toUpperCase() === 'DOCUMENT') || [];
                      const actualDocuments = selectedCar.documents || [];
                      const totalDocs = documentImages.length + actualDocuments.length;

                      return (
                        <>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            All Documents ({totalDocs}):
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Actual CarDocument records */}
                            {actualDocuments.map((doc, idx) => (
                              <button
                                key={`doc-${doc.id}`}
                                onClick={() => setDocumentToView(doc.document_url)}
                                className={`aspect-video bg-black/20 rounded-lg overflow-hidden hover:ring-2 ring-primary-500 transition-all ${
                                  documentToView === doc.document_url ? 'ring-2 ring-primary-500' : ''
                                }`}
                              >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                  <FileText size={32} className="text-blue-500 mb-2" />
                                  <p className="text-xs text-gray-300 text-center truncate w-full">
                                    {doc.title || doc.file_name || doc.document_type}
                                  </p>
                                  {doc.is_verified && (
                                    <CheckCircle size={12} className="text-green-500 mt-1" />
                                  )}
                                </div>
                              </button>
                            ))}

                            {/* Document images */}
                            {documentImages.map((img, idx) => (
                              <button
                                key={`img-${img.id}`}
                                onClick={() => setDocumentToView(img.image_url)}
                                className={`aspect-video bg-black/20 rounded-lg overflow-hidden hover:ring-2 ring-primary-500 transition-all ${
                                  documentToView === img.image_url ? 'ring-2 ring-primary-500' : ''
                                }`}
                              >
                                <img
                                  src={getImageUrl(img.image_url)}
                                  alt={`Document ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {img.caption && (
                                  <p className="text-xs text-gray-500 mt-1 px-2 truncate">
                                    {img.caption}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
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
