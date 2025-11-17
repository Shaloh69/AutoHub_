// ==========================================
// app/admin/reviews/page.tsx - Review Moderation Dashboard (Redesigned)
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Star, Check, X, EyeOff, MessageCircle, BadgeCheck,
  TrendingUp, Filter, Search
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
      // Send lowercase status to match backend enum values
      const response = await apiService.moderateReview(selectedReview.id, {
        status: moderationAction.toLowerCase(),
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

        alert(`Review ${moderationAction.toLowerCase()} successfully`);
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
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'danger';
      case 'HIDDEN': return 'default';
      default: return 'default';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border border-blue-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={18} className="text-blue-400" />
                  <p className="text-xs text-blue-300 font-medium">Total</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-md border border-yellow-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-yellow-400" />
                  <p className="text-xs text-yellow-300 font-medium">Pending</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border border-green-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={18} className="text-green-400" />
                  <p className="text-xs text-green-300 font-medium">Approved</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.approved}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border border-red-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <X size={18} className="text-red-400" />
                  <p className="text-xs text-red-300 font-medium">Rejected</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.rejected}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-gray-600/20 to-gray-800/20 backdrop-blur-md border border-gray-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <EyeOff size={18} className="text-gray-400" />
                  <p className="text-xs text-gray-300 font-medium">Hidden</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.hidden}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border border-purple-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck size={18} className="text-purple-400" />
                  <p className="text-xs text-purple-300 font-medium">Verified</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.verified_purchases}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-md border border-orange-500/30">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} className="fill-orange-400 text-orange-400" />
                  <p className="text-xs text-orange-300 font-medium">Avg Rating</p>
                </div>
                <p className="text-3xl font-bold text-white">{stats.average_rating.toFixed(1)}</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Tabs Filter */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardBody className="p-2">
            <Tabs
              selectedKey={statusFilter}
              onSelectionChange={(key) => setStatusFilter(key as string)}
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
                    <MessageCircle size={16} />
                    <span>All Reviews</span>
                    {stats && <Chip size="sm" variant="flat">{stats.total}</Chip>}
                  </div>
                }
              />
              <Tab
                key="pending"
                title={
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} />
                    <span>Pending</span>
                    {stats && <Chip size="sm" color="warning" variant="flat">{stats.pending}</Chip>}
                  </div>
                }
              />
              <Tab
                key="approved"
                title={
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    <span>Approved</span>
                    {stats && <Chip size="sm" color="success" variant="flat">{stats.approved}</Chip>}
                  </div>
                }
              />
              <Tab
                key="rejected"
                title={
                  <div className="flex items-center gap-2">
                    <X size={16} />
                    <span>Rejected</span>
                    {stats && <Chip size="sm" color="danger" variant="flat">{stats.rejected}</Chip>}
                  </div>
                }
              />
              <Tab
                key="hidden"
                title={
                  <div className="flex items-center gap-2">
                    <EyeOff size={16} />
                    <span>Hidden</span>
                    {stats && <Chip size="sm" variant="flat">{stats.hidden}</Chip>}
                  </div>
                }
              />
            </Tabs>
          </CardBody>
        </Card>

        {/* Reviews Table */}
        <Card className="bg-black/40 backdrop-blur-xl border border-gray-700">
          <CardHeader className="border-b border-gray-700 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {statusFilter ? statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase() : 'All'} Reviews
              </h2>
              <p className="text-sm text-gray-400 mt-1">{reviews.length} reviews found</p>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-16">
                <Spinner size="lg" color="primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center p-16">
                <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-gray-600" size={40} />
                </div>
                <p className="text-gray-400 text-lg font-medium">No reviews found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {statusFilter ? 'Try selecting a different filter' : 'No reviews in the system yet'}
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
                  <TableColumn width={140}>RATING</TableColumn>
                  <TableColumn>COMMENT</TableColumn>
                  <TableColumn width={100}>BUYER</TableColumn>
                  <TableColumn width={100}>STATUS</TableColumn>
                  <TableColumn width={140}>DATE</TableColumn>
                  <TableColumn width={280}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow
                      key={review.id}
                      className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <code className="bg-gray-800/50 px-2 py-1 rounded text-xs text-gray-300">
                          #{review.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {renderStars(review.rating)}
                          <p className="text-sm font-semibold text-white">{review.rating.toFixed(1)}/5.0</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-lg space-y-2">
                          {review.title && (
                            <p className="font-semibold text-white text-sm">{review.title}</p>
                          )}
                          <p className="text-sm text-gray-400 line-clamp-2">{review.comment}</p>
                          {review.verified_purchase && (
                            <Chip
                              size="sm"
                              color="success"
                              variant="flat"
                              startContent={<BadgeCheck size={14} />}
                              className="mt-1"
                            >
                              Verified Purchase
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-400">#{review.buyer_id}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(review.status)}
                          variant="flat"
                          size="sm"
                          className="font-medium"
                        >
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
                          {review.status?.toLowerCase() !== 'approved' && (
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              startContent={<Check size={14} />}
                              onPress={() => openModerationModal(review, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {review.status?.toLowerCase() !== 'rejected' && (
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              startContent={<X size={14} />}
                              onPress={() => openModerationModal(review, 'rejected')}
                            >
                              Reject
                            </Button>
                          )}
                          {review.status?.toLowerCase() !== 'hidden' && (
                            <Button
                              size="sm"
                              variant="flat"
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  moderationAction === 'approved' ? 'bg-green-600/20 border border-green-500/30' :
                  moderationAction === 'rejected' ? 'bg-red-600/20 border border-red-500/30' :
                  'bg-gray-600/20 border border-gray-500/30'
                }`}>
                  {moderationAction === 'approved' && <Check className="text-green-500" size={20} />}
                  {moderationAction === 'rejected' && <X className="text-red-500" size={20} />}
                  {moderationAction === 'hidden' && <EyeOff className="text-gray-500" size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {moderationAction.charAt(0).toUpperCase() + moderationAction.slice(1)} Review
                  </h3>
                  <p className="text-sm text-gray-400 font-normal">Review #{selectedReview?.id}</p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedReview && (
                  <div className="space-y-4">
                    <Card className="bg-black/40 backdrop-blur-md border border-gray-700">
                      <CardBody className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Rating:</span>
                          <div className="flex items-center gap-3">
                            {renderStars(selectedReview.rating)}
                            <span className="text-white font-bold text-lg">{selectedReview.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {selectedReview.title && (
                          <div className="pt-3 border-t border-gray-700">
                            <p className="text-sm text-gray-400 mb-2">Title:</p>
                            <p className="text-white font-semibold text-lg">{selectedReview.title}</p>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-700">
                          <p className="text-sm text-gray-400 mb-2">Comment:</p>
                          <p className="text-white leading-relaxed">{selectedReview.comment}</p>
                        </div>

                        <div className="pt-3 border-t border-gray-700 flex items-center justify-between">
                          <span className="text-gray-400">Verified Purchase:</span>
                          {selectedReview.verified_purchase ? (
                            <Chip size="sm" color="success" variant="flat" startContent={<BadgeCheck size={14} />}>
                              Verified
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="flat">Not Verified</Chip>
                          )}
                        </div>
                      </CardBody>
                    </Card>

                    <Textarea
                      label="Admin Notes (Optional)"
                      labelPlacement="outside"
                      placeholder="Add notes about this moderation decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      minRows={4}
                      maxLength={500}
                      classNames={{
                        input: "bg-gray-800 text-white",
                        inputWrapper: "bg-gray-800 border-gray-700",
                        label: "text-gray-300 font-medium"
                      }}
                    />
                    <p className="text-xs text-gray-500">{adminNotes.length}/500 characters</p>
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
                  color={
                    moderationAction === 'approved' ? 'success' :
                    moderationAction === 'rejected' ? 'danger' :
                    'default'
                  }
                  onPress={handleModerateReview}
                  isLoading={actionLoading}
                  className="font-medium"
                  startContent={
                    moderationAction === 'approved' ? <Check size={16} /> :
                    moderationAction === 'rejected' ? <X size={16} /> :
                    <EyeOff size={16} />
                  }
                >
                  Confirm {moderationAction.charAt(0).toUpperCase() + moderationAction.slice(1)}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
