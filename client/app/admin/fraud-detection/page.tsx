// ==========================================
// app/admin/fraud-detection/page.tsx - Fraud Detection Dashboard (Redesigned)
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import {
  AlertTriangle, Shield, CheckCircle, User, Car,
  Calendar, FileText, Eye, Flag, XCircle, TrendingUp
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FraudIndicator {
  id: number;
  user_id?: number;
  car_id?: number;
  indicator_type: string;
  severity: string;
  description: string;
  detected_at: string;
}

interface FraudStats {
  total: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
}

export default function FraudDetectionPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [indicators, setIndicators] = useState<FraudIndicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<FraudIndicator | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('');

  // Form states for flagging fraud
  const [flagUserId, setFlagUserId] = useState('');
  const [flagCarId, setFlagCarId] = useState('');
  const [flagType, setFlagType] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [flagDescription, setFlagDescription] = useState('');

  // Resolution form states
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const { isOpen: isFlagOpen, onOpen: onFlagOpen, onOpenChange: onFlagOpenChange } = useDisclosure();
  const { isOpen: isResolveOpen, onOpen: onResolveOpen, onOpenChange: onResolveOpenChange } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

  useEffect(() => {
    if (user && !authLoading) {
      loadIndicators();
      loadStatistics();
    }
  }, [user, authLoading, severityFilter]);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFraudIndicators(100, severityFilter || undefined);
      if (response.success && response.data) {
        setIndicators(response.data);
      }
    } catch (error) {
      console.error('Error loading fraud indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiService.getFraudStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleFlagFraud = async () => {
    try {
      setActionLoading(true);
      const response = await apiService.createFraudIndicator({
        user_id: flagUserId ? parseInt(flagUserId) : undefined,
        car_id: flagCarId ? parseInt(flagCarId) : undefined,
        indicator_type: flagType,
        severity: flagSeverity,
        description: flagDescription,
      });

      if (response.success) {
        // Reset form
        setFlagUserId('');
        setFlagCarId('');
        setFlagType('');
        setFlagSeverity('medium');
        setFlagDescription('');

        // Reload data
        await loadIndicators();
        await loadStatistics();
        onFlagOpenChange();
      } else {
        alert('Failed to flag fraud: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error flagging fraud:', error);
      alert('An error occurred while flagging fraud');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedIndicator || !resolutionNotes.trim()) {
      alert('Please provide resolution notes');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.resolveFraudIndicator(selectedIndicator.id, {
        resolution_notes: resolutionNotes,
        action_taken: actionTaken,
      });

      if (response.success) {
        setResolutionNotes('');
        setActionTaken('');
        setSelectedIndicator(null);

        // Reload data
        await loadIndicators();
        await loadStatistics();
        onResolveOpenChange();
      } else {
        alert('Failed to resolve indicator: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error resolving fraud:', error);
      alert('An error occurred while resolving fraud indicator');
    } finally {
      setActionLoading(false);
    }
  };

  const openResolveModal = (indicator: FraudIndicator) => {
    setSelectedIndicator(indicator);
    onResolveOpen();
  };

  const openDetailModal = (indicator: FraudIndicator) => {
    setSelectedIndicator(indicator);
    onDetailOpen();
  };

  const getSeverityColor = (severity: string): "danger" | "warning" | "default" => {
    // FIX: Use toUpperCase() for enum comparison
    const upperSeverity = severity?.toUpperCase();
    switch (upperSeverity) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'default';
      default: return 'default';
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

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Action Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Monitor and manage fraud indicators</p>
          </div>
          <Button
            className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
            startContent={<Flag size={18} />}
            onPress={onFlagOpen}
          >
            Flag Fraud
          </Button>
        </div>

        {/* Statistics Cards with Gradients */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300 font-medium mb-1">Total Indicators</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <AlertTriangle className="text-blue-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border border-red-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-300 font-medium mb-1">High Severity</p>
                    <p className="text-3xl font-bold text-white">{stats.high_severity}</p>
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
                    <p className="text-sm text-yellow-300 font-medium mb-1">Medium Severity</p>
                    <p className="text-3xl font-bold text-white">{stats.medium_severity}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <AlertTriangle className="text-yellow-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-gray-600/20 to-gray-800/20 backdrop-blur-md border border-gray-500/30">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 font-medium mb-1">Low Severity</p>
                    <p className="text-3xl font-bold text-white">{stats.low_severity}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <Shield className="text-gray-400" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Tabs Filter */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardBody className="p-2">
            <Tabs
              selectedKey={severityFilter}
              onSelectionChange={(key) => setSeverityFilter(key as string)}
              variant="underlined"
              classNames={{
                tabList: "gap-6",
                cursor: "bg-red-500",
                tab: "px-4 py-3",
                tabContent: "group-data-[selected=true]:text-white"
              }}
            >
              <Tab
                key=""
                title={
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span>All Indicators</span>
                    {stats && <Chip size="sm" variant="flat">{stats.total}</Chip>}
                  </div>
                }
              />
              <Tab
                key="high"
                title={
                  <div className="flex items-center gap-2">
                    <XCircle size={16} />
                    <span>High Severity</span>
                    {stats && <Chip size="sm" color="danger" variant="flat">{stats.high_severity}</Chip>}
                  </div>
                }
              />
              <Tab
                key="medium"
                title={
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>Medium Severity</span>
                    {stats && <Chip size="sm" color="warning" variant="flat">{stats.medium_severity}</Chip>}
                  </div>
                }
              />
              <Tab
                key="low"
                title={
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} />
                    <span>Low Severity</span>
                    {stats && <Chip size="sm" variant="flat">{stats.low_severity}</Chip>}
                  </div>
                }
              />
            </Tabs>
          </CardBody>
        </Card>

        {/* Fraud Indicators Table */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardHeader className="border-b border-gray-700 p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {severityFilter ? `${severityFilter.charAt(0).toUpperCase() + severityFilter.slice(1)} Severity` : 'All'} Indicators
                </h2>
                <p className="text-sm text-gray-400 mt-1">{indicators.length} indicators found</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-16">
                <Spinner size="lg" color="danger" />
              </div>
            ) : indicators.length === 0 ? (
              <div className="text-center p-16">
                <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-green-500" size={40} />
                </div>
                <p className="text-white text-lg font-medium mb-2">No fraud indicators found</p>
                <p className="text-sm text-gray-500">
                  {severityFilter ? 'Try selecting a different severity level' : 'All clear! No fraud detected'}
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
                  <TableColumn width={80}>ID</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn width={120}>SEVERITY</TableColumn>
                  <TableColumn width={100}>USER ID</TableColumn>
                  <TableColumn width={100}>CAR ID</TableColumn>
                  <TableColumn width={180}>DETECTED AT</TableColumn>
                  <TableColumn width={240}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {indicators.map((indicator) => (
                    <TableRow key={indicator.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <code className="bg-gray-800/50 px-2 py-1 rounded text-xs text-gray-300">
                          #{indicator.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-white">{indicator.indicator_type}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getSeverityColor(indicator.severity)}
                          variant="flat"
                          size="sm"
                          className="font-medium"
                        >
                          {indicator.severity.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {indicator.user_id ? (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-500" />
                            <span className="text-sm">#{indicator.user_id}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {indicator.car_id ? (
                          <div className="flex items-center gap-2">
                            <Car size={14} className="text-gray-500" />
                            <span className="text-sm">#{indicator.car_id}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} className="text-gray-500" />
                          {formatDate(indicator.detected_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-gray-800/50 border border-gray-700 text-white hover:border-blue-500"
                            startContent={<Eye size={14} />}
                            onPress={() => openDetailModal(indicator)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<CheckCircle size={14} />}
                            onPress={() => openResolveModal(indicator)}
                          >
                            Resolve
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
      </div>

      {/* Flag Fraud Modal */}
      <Modal
        isOpen={isFlagOpen}
        onOpenChange={onFlagOpenChange}
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
                <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                  <Flag className="text-red-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Flag Fraud Indicator</h3>
                  <p className="text-sm text-gray-400 font-normal">Create a new fraud indicator</p>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="User ID (optional)"
                      placeholder="Enter user ID"
                      value={flagUserId}
                      onChange={(e) => setFlagUserId(e.target.value)}
                      type="number"
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300"
                      }}
                    />
                    <Input
                      label="Car ID (optional)"
                      placeholder="Enter car ID"
                      value={flagCarId}
                      onChange={(e) => setFlagCarId(e.target.value)}
                      type="number"
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300"
                      }}
                    />
                  </div>

                  <Input
                    label="Indicator Type"
                    placeholder="e.g., suspicious_listing, fake_documents, price_manipulation"
                    value={flagType}
                    onChange={(e) => setFlagType(e.target.value)}
                    isRequired
                    classNames={{
                      input: "bg-gray-800 text-white",
                      inputWrapper: "bg-gray-800 border-gray-700",
                      label: "text-gray-300"
                    }}
                  />

                  <Select
                    label="Severity"
                    placeholder="Select severity level"
                    selectedKeys={[flagSeverity]}
                    onChange={(e) => setFlagSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    classNames={{
                      trigger: "bg-gray-800 border-gray-700",
                      value: "text-white",
                      label: "text-gray-300"
                    }}
                  >
                    <SelectItem key="low">Low</SelectItem>
                    <SelectItem key="medium">Medium</SelectItem>
                    <SelectItem key="high">High</SelectItem>
                  </Select>

                  <Textarea
                    label="Description"
                    placeholder="Detailed description of the fraud indicator..."
                    value={flagDescription}
                    onChange={(e) => setFlagDescription(e.target.value)}
                    minRows={4}
                    isRequired
                    classNames={{
                      input: "bg-gray-800 text-white",
                      inputWrapper: "bg-gray-800 border-gray-700",
                      label: "text-gray-300"
                    }}
                  />
                </div>
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
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white font-medium"
                  onPress={handleFlagFraud}
                  isLoading={actionLoading}
                  isDisabled={!flagType.trim() || !flagDescription.trim()}
                  startContent={!actionLoading && <Flag size={16} />}
                >
                  Flag Fraud
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveOpen}
        onOpenChange={onResolveOpenChange}
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
                <div className="w-10 h-10 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="text-green-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Resolve Fraud Indicator</h3>
                  <p className="text-sm text-gray-400 font-normal">Indicator #{selectedIndicator?.id}</p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedIndicator && (
                  <div className="space-y-4">
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white font-medium">{selectedIndicator.indicator_type}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Severity:</span>
                          <Chip color={getSeverityColor(selectedIndicator.severity)} size="sm" variant="flat">
                            {selectedIndicator.severity.toUpperCase()}
                          </Chip>
                        </div>
                        <div className="pt-3 border-t border-gray-700">
                          <p className="text-sm text-gray-400 mb-2">Description:</p>
                          <p className="text-white text-sm leading-relaxed">{selectedIndicator.description}</p>
                        </div>
                      </CardBody>
                    </Card>

                    <Input
                      label="Action Taken (optional)"
                      placeholder="e.g., account_suspended, listing_removed, warning_sent"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300"
                      }}
                    />

                    <Textarea
                      label="Resolution Notes"
                      placeholder="Explain how this fraud indicator was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      minRows={4}
                      isRequired
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300"
                      }}
                    />

                    <div className="bg-green-900/20 border border-green-600/30 p-4 rounded-lg">
                      <p className="text-green-500 text-sm">
                        This will mark the fraud indicator as resolved and remove it from the active list.
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
                  onPress={handleResolve}
                  isLoading={actionLoading}
                  isDisabled={!resolutionNotes.trim()}
                  className="font-medium"
                  startContent={!actionLoading && <CheckCircle size={16} />}
                >
                  Resolve Indicator
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
        size="2xl"
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
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <FileText className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Fraud Indicator Details</h3>
                  <p className="text-sm text-gray-400 font-normal">Full information</p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedIndicator && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Indicator ID</p>
                        <code className="text-white font-mono text-lg">
                          #{selectedIndicator.id}
                        </code>
                      </div>
                      <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Severity</p>
                        <Chip color={getSeverityColor(selectedIndicator.severity)} variant="flat" className="mt-1">
                          {selectedIndicator.severity.toUpperCase()}
                        </Chip>
                      </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-2">Type</p>
                      <p className="text-white font-medium">
                        {selectedIndicator.indicator_type}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">User ID</p>
                        <p className="text-white font-medium">
                          {selectedIndicator.user_id ? `#${selectedIndicator.user_id}` : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Car ID</p>
                        <p className="text-white font-medium">
                          {selectedIndicator.car_id ? `#${selectedIndicator.car_id}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-2">Description</p>
                      <div className="text-white leading-relaxed">
                        {selectedIndicator.description}
                      </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-2">Detected At</p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar size={16} className="text-gray-500" />
                        {formatDate(selectedIndicator.detected_at)}
                      </div>
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
                  Close
                </Button>
                <Button
                  color="success"
                  variant="flat"
                  startContent={<CheckCircle size={16} />}
                  onPress={() => {
                    onClose();
                    if (selectedIndicator) {
                      openResolveModal(selectedIndicator);
                    }
                  }}
                  className="font-medium"
                >
                  Resolve Indicator
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
