// ==========================================
// app/admin/reviews/page.tsx - Review Moderation Dashboard
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
import {Select, SelectItem} from "@heroui/select";
import {
  Star, Check, X, EyeOff, Eye, BadgeCheck, MessageCircle,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAdmin } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Review {
  id: number;
  car_id?: number;
  seller_id: number;
  buyer_id: number;
  rating: number;
  title?: string;
  comment?: string;
  verified_purchase: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
  verified_purchases: number;
  average_rating: number;
}

export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useRequireAdmin();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [moderationAction, setModerationAction] = useState<'approved' | 'rejected' | 'hidden' | 'pending'>('approved');

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (user && !authLoading) {
      loadReviews();
      loadStatistics();
    }
  }, [user, authLoading, statusFilter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminReviews({
        status: statusFilter || undefined,
        limit: 100,
      });

      if (response.success && response.data) {
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiService.getReviewStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const openModerationModal = (review: Review, action: 'approved' | 'rejected' | 'hidden') => {
    setSelectedReview(review);
    setModerationAction(action);
    setAdminNotes('');
    onOpen();
  };

  const handleModerateReview = async () => {
    if (!selectedReview) return;

    try {
      setActionLoading(true);
      const response = await apiService.moderateReview(selectedReview.id, {
        status: moderationAction,
        admin_notes: adminNotes.trim() || undefined,
      });

      if (response.success) {
        // Remove from current list
        setReviews(prev => prev.filter(r => r.id !== selectedReview.id));
        setSelectedReview(null);
        setAdminNotes('');

        // Reload statistics
        await loadStatistics();
        onOpenChange();

        alert(`Review ${moderationAction} successfully`);
      } else {
        alert(response.error || 'Failed to moderate review');
      }
    } catch (error) {
      console.error('Error moderating review:', error);
      alert('An error occurred while moderating the review');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "danger" | "default" => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'hidden': return 'default';
      default: return 'default';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}
          />
        ))}
      </div>
    );
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
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageCircle className="text-blue-500" size={32} />
            Review Moderation Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Manage and moderate customer reviews</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-gray-400">Total Reviews</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-yellow-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-green-500">Approved</p>
                <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-red-500">Rejected</p>
                <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-gray-500">Hidden</p>
                <p className="text-2xl font-bold text-gray-400">{stats.hidden}</p>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-blue-500">Verified</p>
                <p className="text-2xl font-bold text-blue-500">{stats.verified_purchases}</p>
              </CardBody>
            </Card>

            <Card className="bg-dark-900 border border-dark-700">
              <CardBody className="p-4">
                <p className="text-xs text-gray-400">Avg Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">{stats.average_rating.toFixed(1)}</p>
                  <Star size={16} className="fill-yellow-500 text-yellow-500" />
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card className="bg-dark-900 border border-dark-700">
          <CardBody className="p-4">
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-400">Filter by status:</span>
              <Select
                placeholder="Select status"
                className="max-w-xs"
                classNames={{
                  trigger: "bg-dark-800 border-dark-600",
                  value: "text-white",
                }}
                selectedKeys={statusFilter ? [statusFilter] : []}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <SelectItem key="">All</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="approved">Approved</SelectItem>
                <SelectItem key="rejected">Rejected</SelectItem>
                <SelectItem key="hidden">Hidden</SelectItem>
              </Select>
              {statusFilter && (
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-dark-700"
                  onPress={() => setStatusFilter('')}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Reviews Table */}
        <Card className="bg-dark-900 border border-dark-700">
          <CardHeader className="border-b border-dark-700 p-6">
            <h2 className="text-xl font-semibold text-white">
              Reviews {statusFilter && `- ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center p-12">
                <MessageCircle className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No reviews found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {statusFilter ? 'Try adjusting your filters' : 'No reviews in the system yet'}
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
                  <TableColumn>RATING</TableColumn>
                  <TableColumn>COMMENT</TableColumn>
                  <TableColumn>BUYER</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className="border-b border-dark-700 hover:bg-dark-800">
                      <TableCell>
                        <code className="bg-dark-800 px-2 py-1 rounded text-xs">
                          #{review.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-semibold">{review.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          {review.title && (
                            <p className="font-semibold text-sm mb-1">{review.title}</p>
                          )}
                          <p className="text-sm text-gray-400 line-clamp-2">{review.comment}</p>
                          {review.verified_purchase && (
                            <Chip size="sm" color="success" variant="flat" startContent={<BadgeCheck size={12} />} className="mt-1">
                              Verified
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Buyer #{review.buyer_id}</span>
                      </TableCell>
                      <TableCell>
                        <Chip color={getStatusColor(review.status)} variant="flat" size="sm">
                          {review.status.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {review.status !== 'approved' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              startContent={<Check size={14} />}
                              onPress={() => openModerationModal(review, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {review.status !== 'rejected' && (
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              startContent={<X size={14} />}
                              onPress={() => openModerationModal(review, 'rejected')}
                            >
                              Reject
                            </Button>
                          )}
                          {review.status !== 'hidden' && (
                            <Button
                              size="sm"
                              variant="flat"
                              className="bg-dark-700"
                              startContent={<EyeOff size={14} />}
                              onPress={() => openModerationModal(review, 'hidden')}
                            >
                              Hide
                            </Button>
                          )}
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

      {/* Moderation Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
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
                {moderationAction === 'approved' && <Check className="text-green-500" size={20} />}
                {moderationAction === 'rejected' && <X className="text-red-500" size={20} />}
                {moderationAction === 'hidden' && <EyeOff className="text-gray-500" size={20} />}
                {moderationAction.charAt(0).toUpperCase() + moderationAction.slice(1)} Review
              </ModalHeader>
              <ModalBody>
                {selectedReview && (
                  <div className="space-y-4">
                    <Card className="bg-dark-800 border border-dark-700">
                      <CardBody className="p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Review ID:</span>
                          <span className="text-white">#{selectedReview.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rating:</span>
                          <div className="flex items-center gap-2">
                            {renderStars(selectedReview.rating)}
                            <span>{selectedReview.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        {selectedReview.title && (
                          <div className="pt-2 border-t border-dark-600">
                            <p className="text-sm text-gray-400 mb-1">Title:</p>
                            <p className="text-white font-semibold">{selectedReview.title}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-dark-600">
                          <p className="text-sm text-gray-400 mb-1">Comment:</p>
                          <p className="text-white">{selectedReview.comment}</p>
                        </div>
                      </CardBody>
                    </Card>

                    <Textarea
                      label="Admin Notes (optional)"
                      placeholder="Add notes about this moderation decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      minRows={3}
                      maxLength={500}
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
                  className={
                    moderationAction === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                    moderationAction === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-gray-600 hover:bg-gray-700'
                  }
                  onPress={handleModerateReview}
                  isLoading={actionLoading}
                >
                  {moderationAction.charAt(0).toUpperCase() + moderationAction.slice(1)} Review
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
