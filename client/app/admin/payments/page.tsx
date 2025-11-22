// ==========================================
// app/admin/payments/page.tsx - Payment Verification Dashboard (Redesigned)
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import {
  CheckCircle, XCircle, Clock, DollarSign, User,
  Calendar, AlertCircle, FileText, Eye, TrendingUp,
  BadgeCheck, QrCode
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import QRCodeSettings from '@/components/admin/QRCodeSettings';

interface Payment {
  payment_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  plan_name: string;
  amount: number;
  currency: string;
  reference_number: string;
  payment_method: string;
  status: string;
  submitted_at: string;
  created_at: string;
}

interface PaymentStats {
  pending_count: number;
  verified_today: number;
  total_verified: number;
  revenue_today: number;
  total_revenue: number;
}

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationReference, setVerificationReference] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState<PaymentStats | null>(null);

  const { isOpen: isVerifyOpen, onOpen: onVerifyOpen, onOpenChange: onVerifyOpenChange } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

  useEffect(() => {
    if (user && !authLoading) {
      loadPayments();
      loadStatistics();
    }
  }, [user, authLoading]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingPayments(100, 0);
      if (response.success && response.data) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiService.getPaymentStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;

    try {
      setActionLoading(true);
      console.log('DEBUG: Verifying payment', {
        paymentId: selectedPayment.payment_id,
        action: 'approve',
        verification_reference: verificationReference
      });
      const response = await apiService.verifyPayment(selectedPayment.payment_id, {
        action: 'approve',
        admin_notes: verificationReference ? `Verification Reference: ${verificationReference}` : '',
      });
      console.log('DEBUG: Response received', response);

      if (response.success) {
        setPayments(prev => prev.filter(p => p.payment_id !== selectedPayment.payment_id));
        setVerificationReference('');
        setSelectedPayment(null);
        onVerifyOpenChange();
        loadStatistics();
        alert('Payment verified successfully');
      } else {
        // Handle error - convert to string if it's an object
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : typeof response.error === 'object' && response.error !== null
          ? JSON.stringify(response.error)
          : 'Failed to verify payment';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.verifyPayment(selectedPayment.payment_id, {
        action: 'reject',
        rejection_reason: rejectionReason,
        admin_notes: verificationReference ? `Verification Reference: ${verificationReference}` : '',
      });

      if (response.success) {
        setPayments(prev => prev.filter(p => p.payment_id !== selectedPayment.payment_id));
        setRejectionReason('');
        setVerificationReference('');
        setSelectedPayment(null);
        onRejectOpenChange();
        loadStatistics();
        alert('Payment rejected successfully');
      } else {
        // Handle error - convert to string if it's an object
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : typeof response.error === 'object' && response.error !== null
          ? JSON.stringify(response.error)
          : 'Failed to reject payment';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 60) return `${diffInMins} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${diffInDays} days ago`;
  };

  const getStatusColor = (status: string): "success" | "warning" | "danger" | "default" => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-md border border-yellow-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-yellow-400" />
                  <p className="text-xs text-yellow-300 font-medium">Pending</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.pending_count || 0}</p>
                <p className="text-xs text-yellow-300/70 mt-1">Awaiting review</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-green-400" />
                  <p className="text-xs text-green-300 font-medium">Verified Today</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.verified_today || 0}</p>
                <p className="text-xs text-green-300/70 mt-1">Processed today</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck size={18} className="text-blue-400" />
                  <p className="text-xs text-blue-300 font-medium">Total Verified</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total_verified || 0}</p>
                <p className="text-xs text-blue-300/70 mt-1">All time</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border border-purple-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={18} className="text-purple-400" />
                  <p className="text-xs text-purple-300 font-medium">Revenue Today</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats.revenue_today || 0)}
                </p>
                <p className="text-xs text-purple-300/70 mt-1">Today's earnings</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border border-red-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-red-400" />
                  <p className="text-xs text-red-300 font-medium">Total Revenue</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats.total_revenue || 0)}
                </p>
                <p className="text-xs text-red-300/70 mt-1">All time earnings</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Tabs for Payment Verification and QR Settings */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardBody className="p-2">
            <Tabs
              aria-label="Payment Management"
              variant="underlined"
              classNames={{
                tabList: "gap-6",
                cursor: "bg-red-500",
                tab: "px-4 py-3",
                tabContent: "group-data-[selected=true]:text-white"
              }}
            >
              <Tab
                key="verifications"
                title={
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>Payment Verifications</span>
                    {stats && <Chip size="sm" color="warning" variant="flat">{stats.pending_count}</Chip>}
                  </div>
                }
              >
                {/* Pending Payments Table */}
                <Card className="bg-black/40 backdrop-blur-md border border-gray-700 mt-4">
                  <CardHeader className="border-b border-gray-700 p-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-xl font-bold text-white">Pending Verifications</h2>
                        <Chip size="sm" className="bg-yellow-600 text-white ml-2">
                          {payments.length}
                        </Chip>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={loadPayments}
                        startContent={<AlertCircle size={16} />}
                        className="text-white"
                      >
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    {loading ? (
                      <div className="flex justify-center items-center p-16">
                        <Spinner size="lg" color="primary" />
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                        <p className="text-gray-400">No pending payment verifications at the moment.</p>
                      </div>
                    ) : (
                      <Table
                        removeWrapper
                        classNames={{
                          th: "bg-black/20 text-gray-300 font-semibold text-xs uppercase",
                          td: "text-gray-200 py-4",
                        }}
                      >
                        <TableHeader>
                          <TableColumn width={200}>USER</TableColumn>
                          <TableColumn width={120}>PLAN</TableColumn>
                          <TableColumn width={140}>AMOUNT</TableColumn>
                          <TableColumn width={180}>REFERENCE #</TableColumn>
                          <TableColumn width={100}>METHOD</TableColumn>
                          <TableColumn width={180}>SUBMITTED</TableColumn>
                          <TableColumn width={280}>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow
                              key={payment.payment_id}
                              className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium text-white">{payment.user_name}</p>
                                  <p className="text-sm text-gray-400">{payment.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip size="sm" color="primary" variant="flat" className="font-medium">
                                  {payment.plan_name}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <code className="bg-gray-800/50 px-2 py-1 rounded text-primary-500 font-mono text-sm">
                                  {payment.reference_number}
                                </code>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-300 capitalize">{payment.payment_method}</span>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm text-gray-300">{formatDate(payment.submitted_at)}</p>
                                  <p className="text-xs text-gray-500">{getTimeAgo(payment.submitted_at)}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    startContent={<Eye size={14} />}
                                    onPress={() => {
                                      setSelectedPayment(payment);
                                      onDetailOpen();
                                    }}
                                    className="text-white"
                                  >
                                    Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="success"
                                    variant="flat"
                                    startContent={<CheckCircle size={14} />}
                                    onPress={() => {
                                      setSelectedPayment(payment);
                                      onVerifyOpen();
                                    }}
                                  >
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    startContent={<XCircle size={14} />}
                                    onPress={() => {
                                      setSelectedPayment(payment);
                                      onRejectOpen();
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
              </Tab>

              <Tab
                key="qr-settings"
                title={
                  <div className="flex items-center gap-2">
                    <QrCode size={16} />
                    <span>QR Code Settings</span>
                  </div>
                }
              >
                <div className="mt-4">
                  <QRCodeSettings />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>

      {/* Verify Modal */}
      <Modal
        isOpen={isVerifyOpen}
        onOpenChange={onVerifyOpenChange}
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
                <div className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="text-green-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Verify Payment</h3>
                  <p className="text-sm text-gray-400 font-normal">
                    Payment #{selectedPayment?.payment_id}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-4">
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-primary-500" />
                          Payment Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">User</p>
                            <p className="text-white font-medium">{selectedPayment.user_name}</p>
                            <p className="text-gray-500 text-xs">{selectedPayment.user_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Plan</p>
                            <Chip size="sm" color="primary" variant="flat" className="font-medium">
                              {selectedPayment.plan_name}
                            </Chip>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Amount</p>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 font-bold text-xl">
                              {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Reference Number</p>
                            <code className="text-primary-500 font-mono text-sm">
                              {selectedPayment.reference_number}
                            </code>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Payment Method</p>
                            <p className="text-white capitalize">{selectedPayment.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Submitted</p>
                            <p className="text-white text-sm">{formatDate(selectedPayment.submitted_at)}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Input
                      label="Verification Reference Number (Optional)"
                      labelPlacement="outside"
                      placeholder="Enter bank transaction ID or verification reference..."
                      value={verificationReference}
                      onChange={(e) => setVerificationReference(e.target.value)}
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300 font-medium"
                      }}
                      description="Enter the bank transaction ID or internal reference number for auditing"
                    />

                    <div className="bg-green-900/20 border border-green-600/30 p-4 rounded-lg">
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        Confirming this will activate the user's subscription and send them a confirmation email.
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="font-medium"
                >
                  Cancel
                </Button>
                <Button
                  color="success"
                  onPress={handleVerifyPayment}
                  isLoading={actionLoading}
                  startContent={!actionLoading && <CheckCircle size={18} />}
                  className="font-medium"
                >
                  Confirm Verification
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
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
                  <h3 className="text-lg font-bold">Reject Payment</h3>
                  <p className="text-sm text-gray-400 font-normal">
                    Payment #{selectedPayment?.payment_id}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-4">
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-primary-500" />
                          Payment Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">User</p>
                            <p className="text-white font-medium">{selectedPayment.user_name}</p>
                            <p className="text-gray-500 text-xs">{selectedPayment.user_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Amount</p>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 font-bold text-xl">
                              {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-400 mb-1">Reference Number</p>
                            <code className="text-primary-500 font-mono text-sm">
                              {selectedPayment.reference_number}
                            </code>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Textarea
                      label={
                        <span className="text-gray-300 font-medium">
                          Rejection Reason <span className="text-red-500">*</span>
                        </span>
                      }
                      labelPlacement="outside"
                      placeholder="e.g., Reference number not found, Payment amount mismatch, Invalid payment proof..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      isRequired
                      minRows={3}
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                      }}
                    />

                    <Textarea
                      label="Additional Notes (Optional)"
                      labelPlacement="outside"
                      placeholder="Any additional information for the user..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      minRows={3}
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300 font-medium"
                      }}
                    />

                    <div className="bg-red-900/20 border border-red-600/30 p-4 rounded-lg">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        The user will be notified via email with the rejection reason.
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="font-medium"
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleRejectPayment}
                  isLoading={actionLoading}
                  isDisabled={!rejectionReason.trim()}
                  startContent={!actionLoading && <XCircle size={18} />}
                  className="font-medium"
                >
                  Confirm Rejection
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onOpenChange={onDetailOpenChange}
        size="3xl"
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header: "border-b border-gray-700",
          body: "py-6",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <FileText className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Details</h3>
                  <p className="text-sm text-gray-400 font-normal">
                    Complete payment information
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-4">
                    {/* User Information */}
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <User size={18} className="text-primary-500" />
                          User Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Name</p>
                            <p className="text-white font-medium">{selectedPayment.user_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Email</p>
                            <p className="text-white font-medium">{selectedPayment.user_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">User ID</p>
                            <code className="text-white font-mono text-sm">#{selectedPayment.user_id}</code>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Payment Information */}
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <DollarSign size={18} className="text-primary-500" />
                          Payment Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Plan</p>
                            <Chip size="sm" color="primary" variant="flat" className="font-medium mt-1">
                              {selectedPayment.plan_name}
                            </Chip>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Amount</p>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 font-bold text-2xl mt-1">
                              {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Payment Method</p>
                            <p className="text-white font-medium capitalize">{selectedPayment.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Reference Number</p>
                            <code className="text-primary-500 font-mono text-base block mt-1">
                              {selectedPayment.reference_number}
                            </code>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Status</p>
                            <Chip
                              size="sm"
                              color={getStatusColor(selectedPayment.status)}
                              variant="flat"
                              className="font-medium mt-1 capitalize"
                            >
                              {selectedPayment.status}
                            </Chip>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Payment ID</p>
                            <code className="text-white font-mono text-sm">#{selectedPayment.payment_id}</code>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Timeline */}
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Calendar size={18} className="text-primary-500" />
                          Timeline
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Created</span>
                            <span className="text-white font-medium">{formatDate(selectedPayment.created_at)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Submitted</span>
                            <span className="text-white font-medium">{formatDate(selectedPayment.submitted_at)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                            <span className="text-gray-400">Time Elapsed</span>
                            <span className="text-yellow-500 font-bold">{getTimeAgo(selectedPayment.submitted_at)}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
