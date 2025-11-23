// ==========================================
// app/admin/transaction-history/page.tsx - Payment Transaction History
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import {
  CheckCircle, XCircle, AlertCircle, User, Calendar,
  FileText, DollarSign, Filter, Download, Search, History
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PaymentVerificationLog {
  id: number;
  payment_id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  previous_status: string;
  new_status: string;
  notes: string;
  created_at: string;
}

interface PaymentTransaction {
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

export default function TransactionHistoryPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [logs, setLogs] = useState<PaymentVerificationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<PaymentVerificationLog[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentTransaction[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user && !authLoading) {
      loadTransactionHistory();
      loadAllPayments();
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterLogs();
  }, [logs, actionFilter, searchTerm, dateFilter]);

  useEffect(() => {
    filterPayments();
  }, [allPayments, paymentStatusFilter, searchTerm, dateFilter]);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllPaymentVerificationLogs(500, 0);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPayments = async () => {
    try {
      const response = await apiService.getAllPayments(500, 0);
      if (response.success && response.data) {
        setAllPayments(response.data);
      }
    } catch (error) {
      console.error('Error loading all payments:', error);
    }
  };

  const filterPayments = () => {
    let filtered = [...allPayments];

    // Filter by payment status
    if (paymentStatusFilter && paymentStatusFilter !== 'all') {
      filtered = filtered.filter(p => p.status.toUpperCase() === paymentStatusFilter.toUpperCase());
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.payment_id.toString().includes(search) ||
        p.user_name.toLowerCase().includes(search) ||
        p.user_email.toLowerCase().includes(search) ||
        (p.reference_number && p.reference_number.toLowerCase().includes(search))
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(p => new Date(p.created_at) >= filterDate);
    }

    setFilteredPayments(filtered);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by action
    if (actionFilter && actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Filter by search term (payment ID, admin name, notes)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.payment_id.toString().includes(search) ||
        log.admin_name.toLowerCase().includes(search) ||
        (log.notes && log.notes.toLowerCase().includes(search))
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(log => new Date(log.created_at) >= filterDate);
    }

    setFilteredLogs(filtered);
  };

  const getActionColor = (action: string): "success" | "danger" | "warning" => {
    switch (action?.toUpperCase()) {
      case 'VERIFIED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'REQUESTED_INFO':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'VERIFIED':
        return <CheckCircle size={14} />;
      case 'REJECTED':
        return <XCircle size={14} />;
      case 'REQUESTED_INFO':
        return <AlertCircle size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Payment ID', 'Admin', 'Action', 'Previous Status', 'New Status', 'Notes', 'Date'];
    const csvData = filteredLogs.map(log => [
      log.id,
      log.payment_id,
      log.admin_name,
      log.action,
      log.previous_status || 'N/A',
      log.new_status || 'N/A',
      log.notes || 'N/A',
      formatDate(log.created_at)
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const verified = logs.filter(l => l.action === 'VERIFIED').length;
    const rejected = logs.filter(l => l.action === 'REJECTED').length;
    const requestedInfo = logs.filter(l => l.action === 'REQUESTED_INFO').length;

    // Payment stats
    const totalPayments = allPayments.length;
    const pendingPayments = allPayments.filter(p => p.status === 'PENDING').length;
    const verifiedPayments = allPayments.filter(p => p.status === 'VERIFIED').length;
    const rejectedPayments = allPayments.filter(p => p.status === 'REJECTED').length;

    return {
      verified,
      rejected,
      requestedInfo,
      total: logs.length,
      totalPayments,
      pendingPayments,
      verifiedPayments,
      rejectedPayments
    };
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const stats = getStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <History size={24} className="text-white" />
              </div>
              Transaction History
            </h1>
            <p className="text-gray-400">Complete audit trail of all payment verifications and actions</p>
            <p className="text-gray-500 text-sm mt-1">
              Note: This page shows <strong>admin actions</strong> (approvals/rejections). To see pending payments awaiting verification, visit the <a href="/admin/payments" className="text-primary-400 underline">Payments page</a>.
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Download size={18} />}
            onPress={exportToCSV}
            isDisabled={filteredLogs.length === 0}
          >
            Export CSV
          </Button>
        </div>

        {/* Payment Statistics */}
        <Card className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md border border-purple-500/20 mb-4">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Payments</p>
                <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingPayments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-green-400">{stats.verifiedPayments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{stats.rejectedPayments}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Verification Log Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300 font-medium mb-1">Admin Actions</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <History className="text-blue-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/30">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300 font-medium mb-1">Verified</p>
                  <p className="text-3xl font-bold text-white">{stats.verified}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border border-red-500/30">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-300 font-medium mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-white">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="text-red-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-md border border-yellow-500/30">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-300 font-medium mb-1">Info Requested</p>
                  <p className="text-3xl font-bold text-white">{stats.requestedInfo}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <AlertCircle className="text-yellow-400" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardHeader className="border-b border-gray-700 p-6">
            <div className="flex items-center gap-2 text-white">
              <Filter size={20} />
              <h2 className="text-xl font-semibold">Filters</h2>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by Payment ID, Admin, or Notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search size={18} className="text-gray-500" />}
                classNames={{
                  input: "bg-gray-800 text-white",
                  inputWrapper: "bg-gray-800 border-gray-700",
                }}
              />

              <Select
                placeholder="Filter by Action"
                selectedKeys={actionFilter ? [actionFilter] : []}
                onChange={(e) => setActionFilter(e.target.value)}
                classNames={{
                  trigger: "bg-gray-800 border-gray-700",
                  value: "text-white",
                }}
              >
                <SelectItem key="all" value="all">All Actions</SelectItem>
                <SelectItem key="VERIFIED" value="VERIFIED">Verified</SelectItem>
                <SelectItem key="REJECTED" value="REJECTED">Rejected</SelectItem>
                <SelectItem key="REQUESTED_INFO" value="REQUESTED_INFO">Info Requested</SelectItem>
              </Select>

              <Select
                placeholder="Filter by Date"
                selectedKeys={dateFilter ? [dateFilter] : ['all']}
                onChange={(e) => setDateFilter(e.target.value)}
                classNames={{
                  trigger: "bg-gray-800 border-gray-700",
                  value: "text-white",
                }}
              >
                <SelectItem key="all" value="all">All Time</SelectItem>
                <SelectItem key="today" value="today">Today</SelectItem>
                <SelectItem key="week" value="week">Last 7 Days</SelectItem>
                <SelectItem key="month" value="month">Last 30 Days</SelectItem>
              </Select>
            </div>

            {(searchTerm || actionFilter || dateFilter !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {filteredLogs.length} of {logs.length} transactions
                </p>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    setSearchTerm('');
                    setActionFilter('');
                    setDateFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Transaction History Table */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardHeader className="border-b border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white">
              Payment Verification Logs
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-16">
                <Spinner size="lg" color="primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-16">
                <div className="w-20 h-20 rounded-full bg-gray-700/20 border border-gray-600/30 flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-gray-500" size={40} />
                </div>
                <p className="text-white text-lg font-medium mb-2">No transactions found</p>
                <p className="text-sm text-gray-500">
                  {logs.length === 0
                    ? 'No payment verifications have been recorded yet'
                    : 'Try adjusting your filters to see more results'}
                </p>
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
                  <TableColumn width={80}>LOG ID</TableColumn>
                  <TableColumn width={120}>PAYMENT ID</TableColumn>
                  <TableColumn width={150}>ADMIN</TableColumn>
                  <TableColumn width={120}>ACTION</TableColumn>
                  <TableColumn width={120}>STATUS CHANGE</TableColumn>
                  <TableColumn>NOTES</TableColumn>
                  <TableColumn width={180}>DATE</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <code className="bg-gray-800/50 px-2 py-1 rounded text-xs text-gray-300">
                          #{log.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-gray-500" />
                          <span className="font-medium text-white">#{log.payment_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-500" />
                          <span className="text-sm">{log.admin_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getActionColor(log.action)}
                          variant="flat"
                          size="sm"
                          className="font-medium"
                          startContent={getActionIcon(log.action)}
                        >
                          {log.action}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {log.previous_status && log.new_status ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">{log.previous_status}</span>
                            <span className="text-gray-600">→</span>
                            <span className="text-white font-medium">{log.new_status}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.notes ? (
                          <p className="text-sm text-gray-400 line-clamp-2 max-w-md">
                            {log.notes}
                          </p>
                        ) : (
                          <span className="text-gray-500 text-xs">No notes</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} className="text-gray-500" />
                          {formatDate(log.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
