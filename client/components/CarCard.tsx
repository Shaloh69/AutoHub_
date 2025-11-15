'use client';

import { Card, CardBody, CardFooter, Image, Button, Chip } from '@heroui/react';
import { Heart, MapPin, Calendar, Gauge, Fuel, Settings2 } from 'lucide-react';
import { Car } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiService } from '@/services/api';

interface CarCardProps {
  car: Car;
  onFavoriteChange?: () => void;
}

export default function CarCard({ car, onFavoriteChange }: CarCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(car.is_favorite || false);
  const [isLoading, setIsLoading] = useState(false);

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

  const mainImage = car.images?.[0]?.image_url || '/placeholder-car.jpg';

  return (
    <Card
      isPressable
      onPress={() => router.push(`/cars/${car.id}`)}
      className="card-hover-lift group relative overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={mainImage}
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          removeWrapper
        />

        {/* Favorite Button */}
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm z-10"
          onPress={handleFavoriteToggle}
          isLoading={isLoading}
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </Button>

        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Chip
            size="sm"
            color={getStatusColor(car.status)}
            variant="flat"
            className="capitalize"
          >
            {car.status}
          </Chip>
        </div>

        {/* Featured Badge */}
        {car.is_featured && (
          <div className="absolute bottom-2 left-2 z-10">
            <Chip
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
              variant="flat"
            >
              ⭐ Featured
            </Chip>
          </div>
        )}

        {/* Boosted Badge */}
        {car.is_boosted && (
          <div className="absolute bottom-2 right-2 z-10">
            <Chip
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              variant="flat"
            >
              🚀 Boosted
            </Chip>
          </div>
        )}
      </div>

      <CardBody className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {car.title}
        </h3>

        {/* Brand & Model */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {car.brand?.name} {car.model?.name} {car.year}
        </p>

        {/* Price */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-primary">
            {formatPrice(car.price)}
          </p>
          {car.original_price && car.original_price > car.price && (
            <p className="text-sm text-gray-500 line-through">
              {formatPrice(car.original_price)}
            </p>
          )}
        </div>

        {/* Key Specs */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Gauge className="w-4 h-4" />
            <span>{formatMileage(car.mileage_km)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Settings2 className="w-4 h-4" />
            <span className="capitalize">{car.transmission}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Fuel className="w-4 h-4" />
            <span className="capitalize">{car.fuel_type}</span>
          </div>
        </div>

        {/* Location */}
        {car.city && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-3">
            <MapPin className="w-4 h-4" />
            <span>{car.city.name}</span>
          </div>
        )}
      </CardBody>

      <CardFooter className="p-4 pt-0">
        <Button
          fullWidth
          color="primary"
          variant="flat"
          onPress={() => router.push(`/cars/${car.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
