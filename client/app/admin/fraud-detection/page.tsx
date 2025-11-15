// ==========================================
// app/admin/fraud-detection/page.tsx - Fraud Detection Dashboard
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody} from "@heroui/card";
import {Button} from "@heroui/button";
import {Chip} from "@heroui/chip";
import {Spinner} from "@heroui/spinner";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@heroui/table";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure} from "@heroui/modal";
import {Textarea, Input} from "@heroui/input";
import {Select, SelectItem} from "@heroui/select";
import {
  AlertTriangle, Shield, CheckCircle, User, Car,
  Calendar, FileText, Eye, Flag, XCircle
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
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'default';
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
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="text-red-500" size={32} />
              Fraud Detection Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Monitor and manage fraud indicators</p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            startContent={<Flag size={18} />}
            onPress={onFlagOpen}
          >
            Flag Fraud
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="flex flex-row items-center justify-between p-6">
                <div>
                  <p className="text-sm text-gray-400">Total Indicators</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <AlertTriangle className="text-blue-500" size={28} />
                </div>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="flex flex-row items-center justify-between p-6">
                <div>
                  <p className="text-sm text-gray-400">High Severity</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">{stats.high_severity}</p>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <XCircle className="text-red-500" size={28} />
                </div>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="flex flex-row items-center justify-between p-6">
                <div>
                  <p className="text-sm text-gray-400">Medium Severity</p>
                  <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.medium_severity}</p>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <AlertTriangle className="text-yellow-500" size={28} />
                </div>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="flex flex-row items-center justify-between p-6">
                <div>
                  <p className="text-sm text-gray-400">Low Severity</p>
                  <p className="text-3xl font-bold text-gray-400 mt-1">{stats.low_severity}</p>
                </div>
                <div className="bg-gray-500/10 p-3 rounded-lg">
                  <Shield className="text-gray-400" size={28} />
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-dark-900 border border-dark-700">
          <CardBody className="p-4">
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-400">Filter by severity:</span>
              <Select
                placeholder="All severities"
                className="max-w-xs"
                classNames={{
                  trigger: "bg-dark-800 border-dark-600",
                  value: "text-white",
                }}
                selectedKeys={severityFilter ? [severityFilter] : []}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <SelectItem key="" value="">All</SelectItem>
                <SelectItem key="high" value="high">High</SelectItem>
                <SelectItem key="medium" value="medium">Medium</SelectItem>
                <SelectItem key="low" value="low">Low</SelectItem>
              </Select>
              {severityFilter && (
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-dark-700"
                  onPress={() => setSeverityFilter('')}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Fraud Indicators Table */}
        <Card className="bg-dark-900 border border-dark-700">
          <CardHeader className="border-b border-dark-700 p-6">
            <h2 className="text-xl font-semibold text-white">Fraud Indicators</h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Spinner size="lg" color="danger" />
              </div>
            ) : indicators.length === 0 ? (
              <div className="text-center p-12">
                <Shield className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No fraud indicators found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {severityFilter ? 'Try adjusting your filters' : 'All clear!'}
                </p>
              </div>
            ) : (
              <Table
                removeWrapper
                classNames={{
                  th: "bg-dark-800 text-gray-300 font-semibold",
                  td: "text-gray-200",
                }}
              >
                <TableHeader>
                  <TableColumn>ID</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>SEVERITY</TableColumn>
                  <TableColumn>USER ID</TableColumn>
                  <TableColumn>CAR ID</TableColumn>
                  <TableColumn>DETECTED AT</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {indicators.map((indicator) => (
                    <TableRow key={indicator.id} className="border-b border-dark-700 hover:bg-dark-800">
                      <TableCell>
                        <code className="bg-dark-800 px-2 py-1 rounded text-xs">
                          #{indicator.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{indicator.indicator_type}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getSeverityColor(indicator.severity)}
                          variant="flat"
                          size="sm"
                        >
                          {indicator.severity.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {indicator.user_id ? (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-500" />
                            <span>#{indicator.user_id}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {indicator.car_id ? (
                          <div className="flex items-center gap-2">
                            <Car size={14} className="text-gray-500" />
                            <span>#{indicator.car_id}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-gray-500" />
                          {formatDate(indicator.detected_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-dark-700 hover:bg-dark-600"
                            startContent={<Eye size={14} />}
                            onPress={() => openDetailModal(indicator)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
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
          base: "bg-dark-900 border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
          footer: "border-t border-dark-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white flex items-center gap-2">
                <Flag className="text-red-500" size={20} />
                Flag Fraud Indicator
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
                        input: "bg-dark-800 text-white",
                        inputWrapper: "bg-dark-800 border-dark-600",
                      }}
                    />
                    <Input
                      label="Car ID (optional)"
                      placeholder="Enter car ID"
                      value={flagCarId}
                      onChange={(e) => setFlagCarId(e.target.value)}
                      type="number"
                      classNames={{
                        input: "bg-dark-800 text-white",
                        inputWrapper: "bg-dark-800 border-dark-600",
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
                      input: "bg-dark-800 text-white",
                      inputWrapper: "bg-dark-800 border-dark-600",
                    }}
                  />

                  <Select
                    label="Severity"
                    placeholder="Select severity level"
                    selectedKeys={[flagSeverity]}
                    onChange={(e) => setFlagSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    classNames={{
                      trigger: "bg-dark-800 border-dark-600",
                      value: "text-white",
                    }}
                  >
                    <SelectItem key="low" value="low">Low</SelectItem>
                    <SelectItem key="medium" value="medium">Medium</SelectItem>
                    <SelectItem key="high" value="high">High</SelectItem>
                  </Select>

                  <Textarea
                    label="Description"
                    placeholder="Detailed description of the fraud indicator..."
                    value={flagDescription}
                    onChange={(e) => setFlagDescription(e.target.value)}
                    minRows={4}
                    isRequired
                    classNames={{
                      input: "bg-dark-800 text-white",
                      inputWrapper: "bg-dark-800 border-dark-600",
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} className="bg-dark-700">
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onPress={handleFlagFraud}
                  isLoading={actionLoading}
                  isDisabled={!flagType.trim() || !flagDescription.trim()}
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
          base: "bg-dark-900 border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
          footer: "border-t border-dark-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                Resolve Fraud Indicator
              </ModalHeader>
              <ModalBody>
                {selectedIndicator && (
                  <div className="space-y-4">
                    <Card className="bg-dark-800 border border-dark-700">
                      <CardBody className="p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-white">#{selectedIndicator.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white">{selectedIndicator.indicator_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Severity:</span>
                          <Chip color={getSeverityColor(selectedIndicator.severity)} size="sm">
                            {selectedIndicator.severity.toUpperCase()}
                          </Chip>
                        </div>
                        <div className="pt-2 border-t border-dark-600">
                          <p className="text-sm text-gray-400 mb-1">Description:</p>
                          <p className="text-white text-sm">{selectedIndicator.description}</p>
                        </div>
                      </CardBody>
                    </Card>

                    <Input
                      label="Action Taken (optional)"
                      placeholder="e.g., account_suspended, listing_removed, warning_sent"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      classNames={{
                        input: "bg-dark-800 text-white",
                        inputWrapper: "bg-dark-800 border-dark-600",
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
                        input: "bg-dark-800 text-white",
                        inputWrapper: "bg-dark-800 border-dark-600",
                      }}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} className="bg-dark-700">
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onPress={handleResolve}
                  isLoading={actionLoading}
                  isDisabled={!resolutionNotes.trim()}
                >
                  Resolve
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
          base: "bg-dark-900 border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
          footer: "border-t border-dark-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white flex items-center gap-2">
                <FileText className="text-blue-500" size={20} />
                Fraud Indicator Details
              </ModalHeader>
              <ModalBody>
                {selectedIndicator && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Indicator ID</p>
                        <code className="bg-dark-800 px-3 py-2 rounded block">
                          #{selectedIndicator.id}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Severity</p>
                        <Chip color={getSeverityColor(selectedIndicator.severity)} variant="flat">
                          {selectedIndicator.severity.toUpperCase()}
                        </Chip>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Type</p>
                      <p className="text-white bg-dark-800 px-3 py-2 rounded">
                        {selectedIndicator.indicator_type}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">User ID</p>
                        <p className="text-white bg-dark-800 px-3 py-2 rounded">
                          {selectedIndicator.user_id ? `#${selectedIndicator.user_id}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Car ID</p>
                        <p className="text-white bg-dark-800 px-3 py-2 rounded">
                          {selectedIndicator.car_id ? `#${selectedIndicator.car_id}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Description</p>
                      <div className="text-white bg-dark-800 px-3 py-2 rounded min-h-[100px]">
                        {selectedIndicator.description}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Detected At</p>
                      <div className="flex items-center gap-2 text-white bg-dark-800 px-3 py-2 rounded">
                        <Calendar size={16} className="text-gray-500" />
                        {formatDate(selectedIndicator.detected_at)}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} className="bg-dark-700">
                  Close
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  startContent={<CheckCircle size={16} />}
                  onPress={() => {
                    onClose();
                    if (selectedIndicator) {
                      openResolveModal(selectedIndicator);
                    }
                  }}
                >
                  Resolve
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
