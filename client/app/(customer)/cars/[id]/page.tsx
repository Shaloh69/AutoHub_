// ==========================================
// app/(customer)/cars/[id]/page.tsx - Car Detail Page
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Image } from '@heroui/image';
import { Spinner } from '@heroui/spinner';
import { Tabs, Tab } from '@heroui/tabs';
import { Divider } from '@heroui/divider';
import {
  Heart, Share2, MapPin, Calendar, Gauge, Fuel, Settings,
  Users, DoorOpen, Palette, Shield, FileText, Star,
  Phone, Mail, MessageCircle, Eye, TrendingUp,
  ChevronLeft, ChevronRight, Play, Pause
} from 'lucide-react';
import { apiService } from '@/services/api';
import { Car } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import ContactSellerModal from '@/components/ContactSellerModal';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (params.id) {
      loadCarDetails();
    }
  }, [params.id]);

  // Auto-play carousel effect
  useEffect(() => {
    if (!car || !car.images || car.images.length <= 1) {
      return;
    }

    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setSelectedImage(prev => (prev + 1) % car.images.length);
      }, 4000); // Change image every 4 seconds

      setAutoPlayInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    }
  }, [isAutoPlaying, car]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!car || !car.images || car.images.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        previousImage();
        setIsAutoPlaying(false); // Pause on manual navigation
      } else if (e.key === 'ArrowRight') {
        nextImage();
        setIsAutoPlaying(false); // Pause on manual navigation
      } else if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        toggleAutoPlay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [car]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCar(parseInt(params.id as string));

      if (response.success && response.data) {
        setCar(response.data);
      } else {
        console.error('Failed to load car:', response.error);
      }
    } catch (error) {
      console.error('Error loading car:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!car) return;

    try {
      if (isFavorite) {
        await apiService.removeFromFavorites(car.id);
        setIsFavorite(false);
      } else {
        await apiService.addToFavorites(car.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && car) {
      try {
        await navigator.share({
          title: car.title,
          text: `Check out this ${car.year} ${car.brand?.name} ${car.model?.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage) + ' km';
  };

  const nextImage = () => {
    if (!car || !car.images) return;
    setSelectedImage(prev => (prev + 1) % car.images.length);
  };

  const previousImage = () => {
    if (!car || !car.images) return;
    setSelectedImage(prev => (prev - 1 + car.images.length) % car.images.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };

  const getImageTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      exterior: '🚗',
      interior: '🪑',
      engine: '⚙️',
      damage: '⚠️',
      document: '📄',
      other: '📸'
    };
    return icons[type] || '📸';
  };

  const getImageTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      exterior: 'Exterior',
      interior: 'Interior',
      engine: 'Engine',
      damage: 'Damage',
      document: 'Documents',
      other: 'Other'
    };
    return labels[type] || 'Photo';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Car not found</h2>
        <Button onPress={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const images = car.images || [];
  const currentImage = images[selectedImage] || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {car.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin size={16} />
                {car.location?.city_name || 'Philippines'}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {car.views_count || 0} views
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="flat"
              isIconOnly
              onPress={handleAddToFavorites}
            >
              <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </Button>
            <Button
              variant="flat"
              isIconOnly
              onPress={handleShare}
            >
              <Share2 size={20} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <CardBody className="p-0">
                {/* Main Image */}
                <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={currentImage?.image_url || '/placeholder-car.jpg'}
                    alt={car.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
                        aria-label="Next image"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Auto-play Control */}
                  {images.length > 1 && (
                    <button
                      onClick={toggleAutoPlay}
                      className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
                      aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                    >
                      {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                  )}

                  {/* Image Counter & Type */}
                  {images.length > 0 && (
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <Chip variant="solid" className="bg-black/60 text-white backdrop-blur-sm">
                        {selectedImage + 1} / {images.length}
                      </Chip>
                      {currentImage?.image_type && (
                        <Chip variant="solid" className="bg-black/60 text-white backdrop-blur-sm">
                          <span className="mr-1">{getImageTypeIcon(currentImage.image_type)}</span>
                          {getImageTypeLabel(currentImage.image_type)}
                        </Chip>
                      )}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {car.is_featured && (
                      <Chip color="warning" variant="solid">
                        <Star size={14} className="inline mr-1" />
                        Featured
                      </Chip>
                    )}
                    {car.is_premium && (
                      <Chip color="secondary" variant="solid">
                        Premium
                      </Chip>
                    )}
                    <Chip variant="solid" className="bg-white/90 text-gray-900">
                      {car.condition_rating.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 p-4">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          setSelectedImage(idx);
                          setIsAutoPlaying(false); // Pause auto-play when user manually selects
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedImage === idx
                            ? 'border-primary-500 shadow-lg'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={img.image_url}
                          alt={`View ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Main photo indicator */}
                        {img.is_main && (
                          <div className="absolute top-1 left-1">
                            <Chip size="sm" color="primary" className="text-xs px-1 py-0 min-w-0 h-5">
                              Main
                            </Chip>
                          </div>
                        )}
                        {/* Image type icon */}
                        <div className="absolute bottom-1 right-1 text-xs bg-black/60 text-white rounded px-1 backdrop-blur-sm">
                          {getImageTypeIcon(img.image_type || 'other')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Specifications</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar size={18} />
                      <span className="text-sm">Year</span>
                    </div>
                    <p className="font-semibold text-lg">{car.year}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Gauge size={18} />
                      <span className="text-sm">Mileage</span>
                    </div>
                    <p className="font-semibold text-lg">{formatMileage(car.mileage)}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Fuel size={18} />
                      <span className="text-sm">Fuel Type</span>
                    </div>
                    <p className="font-semibold text-lg capitalize">{car.fuel_type}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Settings size={18} />
                      <span className="text-sm">Transmission</span>
                    </div>
                    <p className="font-semibold text-lg capitalize">{car.transmission}</p>
                  </div>

                  {car.drivetrain && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <TrendingUp size={18} />
                        <span className="text-sm">Drivetrain</span>
                      </div>
                      <p className="font-semibold text-lg uppercase">{car.drivetrain}</p>
                    </div>
                  )}

                  {car.seats && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <Users size={18} />
                        <span className="text-sm">Seats</span>
                      </div>
                      <p className="font-semibold text-lg">{car.seats}</p>
                    </div>
                  )}

                  {car.doors && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <DoorOpen size={18} />
                        <span className="text-sm">Doors</span>
                      </div>
                      <p className="font-semibold text-lg">{car.doors}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Palette size={18} />
                      <span className="text-sm">Color</span>
                    </div>
                    <p className="font-semibold text-lg">{car.exterior_color}</p>
                  </div>

                  {car.engine_size && (
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        Engine Size
                      </div>
                      <p className="font-semibold text-lg">{car.engine_size}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Description</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {car.description || 'No description provided.'}
                </p>
              </CardBody>
            </Card>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">Features</h2>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map(feature => (
                      <Chip key={feature.id} variant="flat" color="primary">
                        {feature.name}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Vehicle History & Condition */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Vehicle History & Condition</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>Accident History</span>
                    <Chip size="sm" color={car.accident_history ? 'danger' : 'success'}>
                      {car.accident_history ? 'Yes' : 'No'}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>Flood History</span>
                    <Chip size="sm" color={car.flood_history ? 'danger' : 'success'}>
                      {car.flood_history ? 'Yes' : 'No'}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>Number of Owners</span>
                    <Chip size="sm" variant="flat">
                      {car.number_of_owners}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>Service History</span>
                    <Chip size="sm" color={car.service_history_available ? 'success' : 'default'}>
                      {car.service_history_available ? 'Available' : 'Not Available'}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>CASA Maintained</span>
                    <Chip size="sm" color={car.casa_maintained ? 'success' : 'default'}>
                      {car.casa_maintained ? 'Yes' : 'No'}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>LTO Registered</span>
                    <Chip size="sm" color={car.lto_registered ? 'success' : 'warning'}>
                      {car.lto_registered ? 'Yes' : 'No'}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Seller Info & Actions */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-2">Asking Price</p>
                <h2 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  {formatPrice(car.price, car.currency)}
                </h2>
                {car.negotiable && (
                  <Chip color="success" variant="flat">
                    Negotiable
                  </Chip>
                )}
              </CardBody>
            </Card>

            {/* Seller Info */}
            {car.seller && (
              <Card>
                <CardHeader>
                  <h3 className="font-bold text-lg">Seller Information</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {car.seller.first_name[0]}{car.seller.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {car.seller.first_name} {car.seller.last_name}
                      </p>
                      {car.seller.business_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {car.seller.business_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <Divider />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star size={14} fill="currentColor" className="text-yellow-500" />
                        <span className="font-semibold">
                          {car.seller.average_rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active Listings</span>
                      <span className="font-semibold">{car.seller.active_listings || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                      <span className="font-semibold">
                        {car.seller.response_rate ? `${(car.seller.response_rate * 100).toFixed(0)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {car.seller.email_verified && car.seller.phone_verified && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Shield size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Verified Seller
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Contact Actions */}
            <div className="space-y-3">
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={() => setContactModalOpen(true)}
                startContent={<MessageCircle size={20} />}
              >
                Send Message
              </Button>

              {car.seller?.phone_number && (
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full"
                  as="a"
                  href={`tel:${car.seller.phone_number}`}
                  startContent={<Phone size={20} />}
                >
                  Call Seller
                </Button>
              )}

              <Button
                variant="flat"
                size="lg"
                className="w-full"
                onPress={() => router.push(`/transactions/new?car=${car.id}`)}
                startContent={<FileText size={20} />}
              >
                Make an Offer
              </Button>
            </div>

            {/* Financing Options */}
            {car.financing_available && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardBody className="text-center">
                  <Shield size={32} className="mx-auto mb-2 text-blue-600" />
                  <h4 className="font-bold mb-1">Financing Available</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get pre-approved for financing
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Contact Seller Modal */}
      {contactModalOpen && (
        <ContactSellerModal
          carId={car.id}
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
        />
      )}
    </div>
  );
}