'use client';

import {Card, CardBody, CardFooter} from "@heroui/card";
import {Button} from "@heroui/button";
import {Chip} from "@heroui/chip";
import { Heart, MapPin, Calendar, Gauge, Fuel, Settings2 } from 'lucide-react';
import { Car } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiService, getImageUrl } from '@/services/api';
import ResponsiveImage from './ResponsiveImage';

interface CarCardProps {
  car: Car;
  onFavoriteChange?: () => void;
}

export default function CarCard({ car, onFavoriteChange }: CarCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false); // Initialize as false, will be fetched separately if needed
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat('en-US').format(km) + ' km';
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      if (isFavorite) {
        await apiService.removeFromFavorites(car.id);
      } else {
        await apiService.addToFavorites(car.id);
      }
      setIsFavorite(!isFavorite);
      onFavoriteChange?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'sold': return 'default';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  // Get main image - priority order:
  // 1. car.main_image field
  // 2. Image with is_main: true
  // 3. First image in the array
  // 4. Placeholder if no images available
  //
  // NOTE: Currently the backend search/list endpoint returns empty images array.
  // The main_image field needs to be populated by the backend for listing pages.
  const getMainImage = (): string => {
    // First, check if main_image field exists on the car object
    if (car.main_image) {
      return getImageUrl(car.main_image);
    }

    // Second, find the image marked as main
    if (car.images && car.images.length > 0) {
      const mainImageObj = car.images.find(img => img.is_main);
      if (mainImageObj) {
        return getImageUrl(mainImageObj.image_url);
      }

      // Fall back to first image
      return getImageUrl(car.images[0].image_url);
    }

    // No images available, return placeholder
    return getImageUrl(null);
  };

  const mainImage = getMainImage();

  return (
    <Card
      className="group relative overflow-hidden bg-black/40 backdrop-blur-md border border-dark-700 hover:border-primary-600 transition-all duration-300 hover:shadow-red-glow w-full"
      isPressable={false}
    >
      {/* Image Section - Clickable */}
      <div
        className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-black/50 cursor-pointer"
        onClick={() => router.push(`/cars/${car.id}`)}
      >
        <ResponsiveImage
          src={imageError ? '/placeholder-car.svg' : mainImage}
          alt={car.title}
          aspectRatio="auto"
          objectFit="cover"
          className="transition-transform duration-500 group-hover:scale-110"
          showSpinner={false}
          enableFullscreen={true}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Button */}
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          className="absolute top-3 right-3 bg-black/70 dark:bg-black/90 backdrop-blur-sm z-10 border border-primary-900/50 hover:bg-primary-600 hover:border-primary-500 transition-all"
          onPress={handleFavoriteToggle}
          isLoading={isLoading}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isFavorite
                ? 'fill-primary-500 text-primary-500'
                : 'text-gray-300 hover:text-primary-500'
            }`}
          />
        </Button>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Chip
            size="sm"
            className={`
              ${car.status?.toLowerCase() === 'active' ? 'bg-green-600/90 text-white' : ''}
              ${car.status?.toLowerCase() === 'pending' ? 'bg-yellow-600/90 text-white' : ''}
              ${car.status?.toLowerCase() === 'sold' ? 'bg-gray-600/90 text-white' : ''}
              backdrop-blur-sm capitalize font-semibold
            `}
          >
            {car.status}
          </Chip>
        </div>

        {/* Featured Badge - Commented out until backend adds is_featured field */}
        {/* {car.is_featured && (
          <div className="absolute bottom-3 left-3 z-10">
            <Chip
              size="sm"
              className="bg-gradient-red-dark text-white font-bold shadow-red-glow"
            >
              ⭐ FEATURED
            </Chip>
          </div>
        )} */}

        {/* Boosted Badge - Commented out until backend adds is_boosted field */}
        {/* {car.is_boosted && (
          <div className="absolute bottom-3 right-3 z-10">
            <Chip
              size="sm"
              className="bg-purple-600 text-white font-bold"
            >
              🚀 BOOSTED
            </Chip>
          </div>
        )} */}
      </div>

      <CardBody className="p-4 sm:p-5 bg-black/40 backdrop-blur-sm border-t border-dark-800/50">
        {/* Clickable overlay for the entire card body */}
        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={() => router.push(`/cars/${car.id}`)}
          aria-label={`View details for ${car.title}`}
        />

        {/* Content with relative positioning to stay above clickable overlay */}
        <div className="relative z-10 pointer-events-none">
          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-1 text-white group-hover:text-primary-500 transition-colors">
            {car.title}
          </h3>

          {/* Brand & Model */}
          <p className="text-xs sm:text-sm text-gray-400 mb-3">
            {car.brand?.name} {car.model?.name} • {car.year}
          </p>

          {/* Price */}
          <div className="mb-4">
            <p className="text-xl sm:text-2xl font-black text-gradient-red">
              {formatPrice(car.price)}
            </p>
            {car.original_price && car.original_price > car.price && (
              <p className="text-xs sm:text-sm text-gray-500 line-through">
                {formatPrice(car.original_price)}
              </p>
            )}
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
              <span className="truncate">{formatMileage(car.mileage)}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
              <span>{car.year}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
              <span className="capitalize truncate">{car.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
              <span className="capitalize truncate">{car.fuel_type}</span>
            </div>
          </div>

          {/* Location */}
          {car.city && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 pt-2 border-t border-dark-800">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
              <span className="truncate">{car.city.name}</span>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="p-3 sm:p-4 pt-0 bg-black/40 backdrop-blur-sm">
        <Button
          fullWidth
          className="bg-gradient-red-dark text-white font-bold hover:shadow-red-glow transition-all pointer-events-auto relative z-20 text-sm sm:text-base"
          onPress={() => router.push(`/cars/${car.id}`)}
          size="md"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
