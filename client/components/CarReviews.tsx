// ==========================================
// components/CarReviews.tsx - Car Reviews Display & Submission
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody} from "@heroui/card";
import {Button} from "@heroui/button";
import {Chip} from "@heroui/chip";
import {Spinner} from "@heroui/spinner";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure} from "@heroui/modal";
import {Textarea, Input} from "@heroui/input";
import {Progress} from "@heroui/progress";
import {
  Star, ThumbsUp, BadgeCheck, MessageCircle, Calendar,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: number;
  car_id?: number;
  seller_id: number;
  buyer_id: number;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  would_recommend: boolean;
  verified_purchase: boolean;
  helpful_count: number;
  status: string;
  created_at: string;
  buyer?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

interface CarReviewsProps {
  carId: number;
  sellerId: number;
}

export default function CarReviews({ carId, sellerId }: CarReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<number | null>(null);

  // Review form states
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    loadReviews();
  }, [carId, filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReviews({
        car_id: carId,
        min_rating: filter || undefined,
        limit: 50,
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

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please sign in to leave a review');
      return;
    }

    if (!comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createReview({
        car_id: carId,
        seller_id: sellerId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        would_recommend: wouldRecommend,
      });

      if (response.success) {
        // Reset form
        setRating(5);
        setTitle('');
        setComment('');
        setPros('');
        setCons('');
        setWouldRecommend(true);

        // Close modal and reload reviews
        onOpenChange();
        loadReviews();
        alert('Review submitted successfully! It will be visible after admin approval.');
      } else {
        // Better error messages
        const errorMsg = response.error || 'Failed to submit review';
        if (errorMsg.toLowerCase().includes('not authenticated')) {
          alert('Your session has expired. Please sign in again to submit a review.');
        } else if (errorMsg.toLowerCase().includes('already reviewed')) {
          alert('You have already reviewed this car.');
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred while submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    if (!user) {
      alert('Please sign in to mark reviews as helpful');
      return;
    }

    try {
      const response = await apiService.markReviewHelpful(reviewId);
      if (response.success) {
        // Reload reviews to show updated helpful count
        loadReviews();
      } else {
        if (response.error?.toLowerCase().includes('not authenticated')) {
          alert('Your session has expired. Please sign in again.');
        } else {
          alert(response.error || 'Failed to mark review as helpful');
        }
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const calculateStats = () => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        wouldRecommendPercentage: 0,
      };
    }

    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution = reviews.reduce((acc, r) => {
      const roundedRating = Math.round(r.rating);
      acc[roundedRating] = (acc[roundedRating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const wouldRecommendCount = reviews.filter(r => r.would_recommend).length;
    const wouldRecommendPercentage = (wouldRecommendCount / reviews.length) * 100;

    return {
      average,
      total: reviews.length,
      distribution,
      wouldRecommendPercentage,
    };
  };

  const stats = calculateStats();

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}
          />
        ))}
      </div>
    );
  };

  const renderRatingSelector = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              size={32}
              className={`transition-colors ${
                star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Write Review Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
        {user && (
          <Button
            className="bg-primary-600 hover:bg-primary-700 text-white"
            startContent={<MessageCircle size={18} />}
            onPress={onOpen}
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating Summary */}
      <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Average Rating */}
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-2">
                {stats.average.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.average), 24)}
              <p className="text-gray-400 mt-2">Based on {stats.total} reviews</p>
              <div className="mt-4">
                <Chip
                  color="success"
                  variant="flat"
                  startContent={<TrendingUp size={16} />}
                  className="text-sm"
                >
                  {stats.wouldRecommendPercentage.toFixed(0)}% would recommend
                </Chip>
              </div>
            </div>

            {/* Right: Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm text-gray-300">{star}</span>
                      <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    </div>
                    <Progress
                      value={percentage}
                      className="flex-1"
                      classNames={{
                        indicator: "bg-yellow-500",
                      }}
                    />
                    <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === null ? 'solid' : 'flat'}
          className={filter === null ? 'bg-primary-600' : 'bg-black/40 backdrop-blur-sm'}
          onPress={() => setFilter(null)}
        >
          All
        </Button>
        {[5, 4, 3].map((rating) => (
          <Button
            key={rating}
            size="sm"
            variant={filter === rating ? 'solid' : 'flat'}
            className={filter === rating ? 'bg-primary-600' : 'bg-black/40 backdrop-blur-sm'}
            onPress={() => setFilter(rating)}
          >
            {rating}+ Stars
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner color="primary" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="bg-black/40 backdrop-blur-md border border-dark-700">
          <CardBody className="text-center py-12">
            <MessageCircle className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-2">Be the first to review this car!</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-black/40 backdrop-blur-md border border-dark-700">
              <CardBody className="p-6">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                      {review.buyer?.first_name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {review.buyer?.first_name} {review.buyer?.last_name}
                        </span>
                        {review.verified_purchase && (
                          <Chip
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<BadgeCheck size={14} />}
                          >
                            Verified Purchase
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h3 className="text-lg font-semibold text-white mb-2">{review.title}</h3>
                )}

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-gray-300 mb-4">{review.comment}</p>
                )}

                {/* Pros & Cons */}
                {(review.pros || review.cons) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {review.pros && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={16} className="text-green-500" />
                          <span className="text-sm font-semibold text-green-500">Pros</span>
                        </div>
                        <p className="text-sm text-gray-400">{review.pros}</p>
                      </div>
                    )}
                    {review.cons && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown size={16} className="text-red-500" />
                          <span className="text-sm font-semibold text-red-500">Cons</span>
                        </div>
                        <p className="text-sm text-gray-400">{review.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Would Recommend */}
                {review.would_recommend && (
                  <div className="mb-4">
                    <Chip size="sm" color="success" variant="flat">
                      Would recommend to others
                    </Chip>
                  </div>
                )}

                {/* Helpful Button */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-black/40 backdrop-blur-sm"
                    startContent={<ThumbsUp size={14} />}
                    onPress={() => handleMarkHelpful(review.id)}
                  >
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        classNames={{
          base: "bg-black/80 backdrop-blur-xl border border-dark-700",
          header: "border-b border-dark-700",
          body: "py-6",
          footer: "border-t border-dark-700",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white">Write a Review</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rating *
                    </label>
                    {renderRatingSelector()}
                    <p className="text-xs text-gray-500 mt-1">{rating} out of 5 stars</p>
                  </div>

                  {/* Title */}
                  <Input
                    label="Review Title (optional)"
                    placeholder="Sum up your experience"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                    classNames={{
                      input: "bg-black/40 text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-dark-600",
                    }}
                  />

                  {/* Comment */}
                  <Textarea
                    label="Review *"
                    placeholder="Share your experience with this car..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    minRows={4}
                    maxLength={2000}
                    isRequired
                    classNames={{
                      input: "bg-black/40 text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-dark-600",
                    }}
                  />

                  {/* Pros */}
                  <Textarea
                    label="What did you like? (optional)"
                    placeholder="Positive aspects..."
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    minRows={2}
                    maxLength={1000}
                    classNames={{
                      input: "bg-black/40 text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-dark-600",
                    }}
                  />

                  {/* Cons */}
                  <Textarea
                    label="Any downsides? (optional)"
                    placeholder="Areas for improvement..."
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    minRows={2}
                    maxLength={1000}
                    classNames={{
                      input: "bg-black/40 text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-dark-600",
                    }}
                  />

                  {/* Would Recommend */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wouldRecommend"
                      checked={wouldRecommend}
                      onChange={(e) => setWouldRecommend(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="wouldRecommend" className="text-sm text-gray-300">
                      I would recommend this to others
                    </label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} className="bg-black/40 backdrop-blur-sm">
                  Cancel
                </Button>
                <Button
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  onPress={handleSubmitReview}
                  isLoading={submitting}
                  isDisabled={!comment.trim()}
                >
                  Submit Review
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
