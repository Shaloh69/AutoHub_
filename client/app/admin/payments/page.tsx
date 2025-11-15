// ==========================================
// app/admin/payments/page.tsx - Payment Verification Dashboard
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody} from "@heroui/card";
import {Button} from "@heroui/button";
import {Chip} from "@heroui/chip";
import {Spinner} from "@heroui/spinner";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@heroui/table";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure} from "@heroui/modal";
import {Textarea} from "@heroui/input";
import {
  CheckCircle, XCircle, Clock, DollarSign, User,
  Calendar, AlertCircle, FileText, Eye
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Payment {
  id: number;
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

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState<any>(null);

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
      const response = await apiService.verifyPayment(selectedPayment.id, {
        action: 'verify',
        admin_notes: adminNotes,
      });

      if (response.success) {
        setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
        setAdminNotes('');
        setSelectedPayment(null);
        onVerifyOpenChange();
        loadStatistics();
      } else {
        alert(response.error || 'Failed to verify payment');
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
      const response = await apiService.verifyPayment(selectedPayment.id, {
        action: 'reject',
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });

      if (response.success) {
        setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
        setRejectionReason('');
        setAdminNotes('');
        setSelectedPayment(null);
        onRejectOpenChange();
        loadStatistics();
      } else {
        alert(response.error || 'Failed to reject payment');
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

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen label="Loading payment verifications..." />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Verification</h1>
          <p className="text-gray-400">Review and verify subscription payments</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-dark-900 border border-dark-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending_count || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-dark-900 border border-dark-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Verified Today</p>
                  <p className="text-2xl font-bold text-green-500">{stats.verified_today || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-dark-900 border border-dark-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Verified</p>
                  <p className="text-2xl font-bold text-primary-500">{stats.total_verified || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-primary-500" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-dark-900 border border-dark-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Revenue Today</p>
                  <p className="text-2xl font-bold text-gradient-red">
                    {formatCurrency(stats.revenue_today || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary-500" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Pending Payments Table */}
      <Card className="bg-dark-900 border border-dark-700">
        <CardHeader className="border-b border-dark-700 p-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Pending Verifications</h2>
              <Chip size="sm" className="bg-yellow-600 text-white ml-2">
                {payments.length}
              </Chip>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
              <p className="text-gray-400">No pending payment verifications at the moment.</p>
            </div>
          ) : (
            <Table aria-label="Pending payments table" className="min-w-full">
              <TableHeader>
                <TableColumn>USER</TableColumn>
                <TableColumn>PLAN</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>REFERENCE #</TableColumn>
                <TableColumn>METHOD</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="border-b border-dark-800 hover:bg-dark-800 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{payment.user_name}</p>
                        <p className="text-sm text-gray-400">{payment.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" className="bg-primary-600 text-white">
                        {payment.plan_name}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-gradient-red">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="bg-dark-800 px-2 py-1 rounded text-primary-500 font-mono text-sm">
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
                          className="bg-dark-800 border border-dark-700 text-white hover:border-primary-500"
                          startContent={<Eye size={16} />}
                          onPress={() => {
                            setSelectedPayment(payment);
                            onDetailOpen();
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          startContent={<CheckCircle size={16} />}
                          onPress={() => {
                            setSelectedPayment(payment);
                            onVerifyOpen();
                          }}
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 text-white hover:bg-red-700"
                          startContent={<XCircle size={16} />}
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

      {/* Verify Modal */}
      <Modal
        isOpen={isVerifyOpen}
        onOpenChange={onVerifyOpenChange}
        size="2xl"
        classNames={{
          base: "bg-dark-900 border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
          footer: "border-t border-dark-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-white">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Verify Payment
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-4">
                    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                      <h3 className="font-bold text-white mb-3">Payment Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">User</p>
                          <p className="text-white font-medium">{selectedPayment.user_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Plan</p>
                          <p className="text-white font-medium">{selectedPayment.plan_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Amount</p>
                          <p className="text-gradient-red font-bold">
                            {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Reference Number</p>
                          <code className="text-primary-500 font-mono">
                            {selectedPayment.reference_number}
                          </code>
                        </div>
                        <div>
                          <p className="text-gray-400">Payment Method</p>
                          <p className="text-white capitalize">{selectedPayment.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Submitted</p>
                          <p className="text-white">{formatDate(selectedPayment.submitted_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <Textarea
                        value={adminNotes}
                        onValueChange={setAdminNotes}
                        placeholder="Add any notes about this verification..."
                        className="w-full"
                        classNames={{
                          input: "bg-dark-800 text-white",
                          inputWrapper: "bg-dark-800 border-dark-700",
                        }}
                      />
                    </div>

                    <div className="bg-green-900/20 border border-green-600/30 p-4 rounded-lg">
                      <p className="text-green-500 text-sm">
                        ✓ Confirming this will activate the user's subscription and send them a confirmation email.
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="bg-dark-800 border border-dark-700 text-white"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 text-white"
                  onPress={handleVerifyPayment}
                  isLoading={actionLoading}
                  startContent={!actionLoading && <CheckCircle size={18} />}
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
          base: "bg-dark-900 border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
          footer: "border-t border-dark-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-white">
                <XCircle className="w-5 h-5 text-red-500" />
                Reject Payment
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-4">
                    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                      <h3 className="font-bold text-white mb-3">Payment Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">User</p>
                          <p className="text-white font-medium">{selectedPayment.user_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Amount</p>
                          <p className="text-gradient-red font-bold">
                            {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400">Reference Number</p>
                          <code className="text-primary-500 font-mono">
                            {selectedPayment.reference_number}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        value={rejectionReason}
                        onValueChange={setRejectionReason}
                        placeholder="e.g., Reference number not found, Payment amount mismatch, Invalid payment proof..."
                        isRequired
                        className="w-full"
                        classNames={{
                          input: "bg-dark-800 text-white",
                          inputWrapper: "bg-dark-800 border-dark-700",
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <Textarea
                        value={adminNotes}
                        onValueChange={setAdminNotes}
                        placeholder="Any additional information for the user..."
                        className="w-full"
                        classNames={{
                          input: "bg-dark-800 text-white",
                          inputWrapper: "bg-dark-800 border-dark-700",
                        }}
                      />
                    </div>

                    <div className="bg-red-900/20 border border-red-600/30 p-4 rounded-lg">
                      <p className="text-red-500 text-sm">
                        ⚠️ The user will be notified via email with the rejection reason.
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="bg-dark-800 border border-dark-700 text-white"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onPress={handleRejectPayment}
                  isLoading={actionLoading}
                  isDisabled={!rejectionReason.trim()}
                  startContent={!actionLoading && <XCircle size={18} />}
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
          base: "bg-dark-900 border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-white">
                <FileText className="w-5 h-5 text-primary-500" />
                Payment Details
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-6">
                    {/* User Information */}
                    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                        <User size={18} className="text-primary-500" />
                        User Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Name</p>
                          <p className="text-white font-medium">{selectedPayment.user_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Email</p>
                          <p className="text-white font-medium">{selectedPayment.user_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">User ID</p>
                          <p className="text-white font-mono">#{selectedPayment.user_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                        <DollarSign size={18} className="text-primary-500" />
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Plan</p>
                          <Chip size="sm" className="bg-primary-600 text-white mt-1">
                            {selectedPayment.plan_name}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-gray-400">Amount</p>
                          <p className="text-gradient-red font-bold text-xl mt-1">
                            {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Payment Method</p>
                          <p className="text-white font-medium capitalize">{selectedPayment.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Reference Number</p>
                          <code className="text-primary-500 font-mono text-lg block mt-1">
                            {selectedPayment.reference_number}
                          </code>
                        </div>
                        <div>
                          <p className="text-gray-400">Status</p>
                          <Chip size="sm" className="bg-yellow-600 text-white mt-1">
                            {selectedPayment.status}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-gray-400">Payment ID</p>
                          <p className="text-white font-mono">#{selectedPayment.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-primary-500" />
                        Timeline
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created</span>
                          <span className="text-white">{formatDate(selectedPayment.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Submitted</span>
                          <span className="text-white">{formatDate(selectedPayment.submitted_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time Elapsed</span>
                          <span className="text-yellow-500 font-medium">{getTimeAgo(selectedPayment.submitted_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
