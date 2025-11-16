// ==========================================
// app/seller/[id]/page.tsx - Seller Profile Page
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Tabs, Tab } from '@heroui/tabs';
import { Divider } from '@heroui/divider';
import {
  Star, Shield, CheckCircle, MapPin, Calendar, Car as CarIcon,
  MessageCircle, TrendingUp, Award, BadgeCheck, Clock
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { User, Car } from '@/types';

interface Review {
  id: number;
  rating: number;
  title?: string;
  comment?: string;
  verified_purchase: boolean;
  created_at: string;
  buyer?: {
    first_name: string;
    last_name: string;
  };
}

export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = parseInt(params.id as string);

  const [seller, setSeller] = useState<User | null>(null);
  const [listings, setListings] = useState<Car[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');

  useEffect(() => {
    loadSellerProfile();
  }, [sellerId]);

  const loadSellerProfile = async () => {
    try {
      setLoading(true);
      const [sellerResponse, listingsResponse, reviewsResponse] = await Promise.all([
        apiService.getUserPublicProfile(sellerId),
        apiService.searchCars({ seller_id: sellerId, page: 1, page_size: 50 }),
        apiService.getReviews({ seller_id: sellerId, limit: 50 }),
      ]);

      if (sellerResponse.success && sellerResponse.data) {
        setSeller(sellerResponse.data);
      }

      if (listingsResponse.success && listingsResponse.data) {
        setListings(listingsResponse.data.items || []);
      }

      if (reviewsResponse.success && reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }
    } catch (error) {
      console.error('Error loading seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustBadges = () => {
    if (!seller) return [];

    const badges = [];

    // Email verified
    if (seller.email_verified) {
      badges.push({
        icon: <CheckCircle size={16} />,
        label: 'Email Verified',
        color: 'success' as const,
      });
    }

    // Highly rated (4.5+)
    if (seller.average_rating && seller.average_rating >= 4.5) {
      badges.push({
        icon: <Star size={16} />,
        label: 'Highly Rated',
        color: 'warning' as const,
      });
    }

    // Top seller (20+ reviews)
    if (seller.total_reviews && seller.total_reviews >= 20) {
      badges.push({
        icon: <Award size={16} />,
        label: 'Top Seller',
        color: 'secondary' as const,
      });
    }

    // Fast responder (80%+)
    if (seller.response_rate && seller.response_rate >= 0.8) {
      badges.push({
        icon: <TrendingUp size={16} />,
        label: 'Fast Responder',
        color: 'primary' as const,
      });
    }

    // Identity verified
    if (seller.identity_verified) {
      badges.push({
        icon: <BadgeCheck size={16} />,
        label: 'Identity Verified',
        color: 'success' as const,
      });
    }

    return badges;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= Math.round(rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Seller not found</h2>
        <Button color="primary" onPress={() => router.push('/cars')}>
          Browse Cars
        </Button>
      </div>
    );
  }

  const badges = getTrustBadges();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Seller Header */}
        <Card className="mb-8">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {seller.profile_image ? (
                  <img
                    src={getImageUrl(seller.profile_image)}
                    alt={`${seller.first_name} ${seller.last_name}`}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {seller.first_name.charAt(0)}{seller.last_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {seller.first_name} {seller.last_name}
                    </h1>
                    {seller.business_name && (
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        {seller.business_name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {seller.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{seller.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Member since {new Date(seller.created_at).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {badges.map((badge, index) => (
                      <Chip
                        key={index}
                        color={badge.color}
                        variant="flat"
                        startContent={badge.icon}
                        size="sm"
                      >
                        {badge.label}
                      </Chip>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {renderStars(seller.average_rating || 0)}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seller.average_rating?.toFixed(1) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Average Rating</p>
                  </div>

                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <MessageCircle size={20} className="mx-auto text-primary-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seller.total_reviews || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Reviews</p>
                  </div>

                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <CarIcon size={20} className="mx-auto text-primary-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seller.active_listings || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Active Listings</p>
                  </div>

                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Clock size={20} className="mx-auto text-primary-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seller.response_rate ? `${(seller.response_rate * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Response Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs: Listings & Reviews */}
        <Tabs
          aria-label="Seller information"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
        >
          <Tab key="listings" title={`Listings (${listings.length})`}>
            <Card>
              <CardBody className="p-6">
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <CarIcon size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No active listings</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((car) => (
                      <Card
                        key={car.id}
                        isPressable
                        onPress={() => router.push(`/cars/${car.id}`)}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardBody className="p-0">
                          {/* Car Image */}
                          <div className="h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                            {car.images?.[0] ? (
                              <img
                                src={getImageUrl(car.images[0].image_url)}
                                alt={car.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CarIcon size={48} className="text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Car Info */}
                          <div className="p-4">
                            <h3 className="font-bold text-lg mb-1 line-clamp-1">{car.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {car.year} • {car.mileage?.toLocaleString()} km
                            </p>
                            <p className="text-xl font-bold text-primary-600">
                              ₱{car.price?.toLocaleString()}
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>

          <Tab key="reviews" title={`Reviews (${reviews.length})`}>
            <Card>
              <CardBody className="p-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {renderStars(review.rating)}
                                {review.verified_purchase && (
                                  <Chip size="sm" color="success" variant="flat">
                                    <div className="flex items-center gap-1">
                                      <CheckCircle size={12} />
                                      <span>Verified Purchase</span>
                                    </div>
                                  </Chip>
                                )}
                              </div>
                              {review.title && (
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {review.title}
                                </h4>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {review.comment && (
                            <p className="text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
                          )}

                          <p className="text-sm text-gray-500">
                            By {review.buyer?.first_name || 'Anonymous'} {review.buyer?.last_name || ''}
                          </p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
