// ==========================================
// app/seller/transactions/page.tsx - Seller Transactions Page
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
  Package, DollarSign, Calendar, User, Car, CheckCircle,
  XCircle, Clock, AlertCircle, FileText, Eye
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Transaction } from '@/types';
import { useRequireSeller } from '@/contexts/AuthContext';
import SellerLayout from '@/components/seller/SellerLayout';

export default function SellerTransactionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireSeller();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (user && !authLoading) {
      loadTransactions();
    }
  }, [user, authLoading, selectedStatus]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const response = await apiService.getTransactions('sales', status);

      if (response.success && response.data?.items) {
        setTransactions(response.data.items);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'CONFIRMED':
        return 'primary';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'DISPUTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'PENDING':
        return 'warning';
      case 'REFUNDED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SALE':
        return <CheckCircle size={18} />;
      case 'RESERVATION':
        return <Clock size={18} />;
      case 'DEPOSIT':
        return <DollarSign size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  const filteredTransactions = selectedStatus === 'all'
    ? transactions
    : transactions.filter(t => t.status.toLowerCase() === selectedStatus.toLowerCase());

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Loading transactions..." />
      </div>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your sales transactions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle size={24} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold">
                  {transactions.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Clock size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold">
                  {transactions.filter(t => t.status === 'PENDING').length}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatPrice(
                    transactions
                      .filter(t => t.status === 'COMPLETED')
                      .reduce((sum, t) => sum + (t.final_amount || t.agreed_price), 0)
                  )}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-danger/10 rounded-lg">
                <XCircle size={24} className="text-danger" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold">
                  {transactions.filter(t => t.status === 'CANCELLED' || t.status === 'DISPUTED').length}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-6">
          <CardBody>
            <Tabs
              selectedKey={selectedStatus}
              onSelectionChange={(key) => setSelectedStatus(key as string)}
              variant="underlined"
            >
              <Tab key="all" title="All Transactions" />
              <Tab key="pending" title="Pending" />
              <Tab key="confirmed" title="Confirmed" />
              <Tab key="completed" title="Completed" />
              <Tab key="cancelled" title="Cancelled" />
            </Tabs>
          </CardBody>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedStatus === 'all'
                  ? 'You haven\'t made any sales yet.'
                  : `No ${selectedStatus} transactions at this time.`}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Car Image */}
                    {transaction.car && (
                      <div className="w-full lg:w-48 h-32 flex-shrink-0">
                        <img
                          src={getImageUrl(transaction.car.main_image)}
                          alt={transaction.car.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Transaction Details */}
                    <div className="flex-grow space-y-4">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            {getTransactionTypeIcon(transaction.transaction_type)}
                            <h3 className="text-lg font-semibold">
                              {transaction.car?.title || 'Car Listing'}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Chip
                              color={getStatusColor(transaction.status)}
                              variant="flat"
                              size="sm"
                            >
                              {transaction.status}
                            </Chip>
                            <Chip
                              color={getPaymentStatusColor(transaction.payment_status)}
                              variant="flat"
                              size="sm"
                            >
                              Payment: {transaction.payment_status}
                            </Chip>
                            <Chip variant="flat" size="sm">
                              {transaction.transaction_type}
                            </Chip>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-success">
                            {formatPrice(transaction.final_amount || transaction.agreed_price)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.payment_method}
                          </p>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Buyer</p>
                            <p className="font-medium">
                              {transaction.buyer
                                ? `${transaction.buyer.first_name} ${transaction.buyer.last_name}`
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Created</p>
                            <p className="font-medium">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>

                        {transaction.completed_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-success" />
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Completed</p>
                              <p className="font-medium">{formatDate(transaction.completed_at)}</p>
                            </div>
                          </div>
                        )}

                        {transaction.deposit_amount && (
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-gray-400" />
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Deposit</p>
                              <p className="font-medium">{formatPrice(transaction.deposit_amount)}</p>
                            </div>
                          </div>
                        )}

                        {transaction.has_trade_in && transaction.trade_in_value && (
                          <div className="flex items-center gap-2">
                            <Car size={16} className="text-gray-400" />
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Trade-in Value</p>
                              <p className="font-medium">{formatPrice(transaction.trade_in_value)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {transaction.seller_notes && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText size={16} className="text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Your Notes:
                              </p>
                              <p className="text-sm">{transaction.seller_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<Eye size={16} />}
                          onPress={() => router.push(`/transactions/${transaction.id}`)}
                        >
                          View Details
                        </Button>

                        {transaction.car && (
                          <Button
                            size="sm"
                            variant="light"
                            startContent={<Car size={16} />}
                            onPress={() => router.push(`/cars/${transaction.car_id}`)}
                          >
                            View Car
                          </Button>
                        )}

                        {transaction.buyer && (
                          <Button
                            size="sm"
                            variant="light"
                            startContent={<User size={16} />}
                            onPress={() => router.push(`/seller/${transaction.buyer_id}`)}
                          >
                            View Buyer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination could be added here if needed */}
      </div>
    </SellerLayout>
  );
}
