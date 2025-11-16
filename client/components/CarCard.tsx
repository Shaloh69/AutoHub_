'use client';

import {Card, CardBody, CardFooter} from "@heroui/card";
import {Image} from "@heroui/image";
import {Button} from "@heroui/button";
import {Chip} from "@heroui/chip";
import { Heart, MapPin, Calendar, Gauge, Fuel, Settings2 } from 'lucide-react';
import { Car } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiService, getImageUrl } from '@/services/api';

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

  const mainImage = getImageUrl(car.images?.[0]?.image_url);

  return (
    <Card
      isPressable
      onPress={() => router.push(`/cars/${car.id}`)}
      className="group relative overflow-hidden bg-dark-900 border border-dark-700 hover:border-primary-600 transition-all duration-300 hover:shadow-red-glow"
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden bg-dark-800">
        <Image
          src={mainImage}
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          removeWrapper
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
              ${status === 'active' ? 'bg-green-600/90 text-white' : ''}
              ${status === 'pending' ? 'bg-yellow-600/90 text-white' : ''}
              ${status === 'sold' ? 'bg-gray-600/90 text-white' : ''}
              backdrop-blur-sm capitalize font-semibold
            `}
          >
            {car.status}
          </Chip>
        </div>

        {/* Featured Badge */}
        {car.is_featured && (
          <div className="absolute bottom-3 left-3 z-10">
            <Chip
              size="sm"
              className="bg-gradient-red-dark text-white font-bold shadow-red-glow"
            >
              ⭐ FEATURED
            </Chip>
          </div>
        )}

        {/* Boosted Badge */}
        {car.is_boosted && (
          <div className="absolute bottom-3 right-3 z-10">
            <Chip
              size="sm"
              className="bg-purple-600 text-white font-bold"
            >
              🚀 BOOSTED
            </Chip>
          </div>
        )}
      </div>

      <CardBody className="p-5 bg-dark-900 border-t border-dark-800">
        {/* Title */}
        <h3 className="text-lg font-bold mb-2 line-clamp-1 text-white group-hover:text-primary-500 transition-colors">
          {car.title}
        </h3>

        {/* Brand & Model */}
        <p className="text-sm text-gray-400 mb-3">
          {car.brand?.name} {car.model?.name} • {car.year}
        </p>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-black text-gradient-red">
            {formatPrice(car.price)}
          </p>
          {car.original_price && car.original_price > car.price && (
            <p className="text-sm text-gray-500 line-through">
              {formatPrice(car.original_price)}
            </p>
          )}
        </div>

        {/* Key Specs */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Gauge className="w-4 h-4 text-primary-500" />
            <span>{formatMileage(car.mileage_km)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Settings2 className="w-4 h-4 text-primary-500" />
            <span className="capitalize">{car.transmission}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Fuel className="w-4 h-4 text-primary-500" />
            <span className="capitalize">{car.fuel_type}</span>
          </div>
        </div>

        {/* Location */}
        {car.city && (
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-dark-800">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span>{car.city.name}</span>
          </div>
        )}
      </CardBody>

      <CardFooter className="p-4 pt-0 bg-dark-900">
        <Button
          fullWidth
          className="bg-gradient-red-dark text-white font-bold hover:shadow-red-glow transition-all"
          onPress={() => router.push(`/cars/${car.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
