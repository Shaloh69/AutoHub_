'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { apiService } from '@/services/api';
import { Car } from '@/types';
import CarCard from '@/components/CarCard';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { refreshFavorites } = useFavorites();
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await apiService.getFavorites();
      if (response.success && response.data) {
        setFavoriteCars(response.data);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteChange = async () => {
    await refreshFavorites();
    await loadFavorites();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="light"
            startContent={<ArrowLeft size={20} />}
            onPress={() => router.back()}
            className="mb-4 text-white/70 hover:text-white"
          >
            Back
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary-500/20 border border-primary-500/30">
              <Heart className="w-6 h-6 text-primary-500 fill-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">My Favorites</h1>
          </div>
          <p className="text-white/60">
            {favoriteCars.length} {favoriteCars.length === 1 ? 'car' : 'cars'} in your wishlist
          </p>
        </div>

        {/* Empty State */}
        {favoriteCars.length === 0 ? (
          <Card className="bg-black/20 backdrop-blur-2xl border border-white/10">
            <CardBody className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 rounded-full bg-white/5 border border-white/10">
                  <Heart className="w-12 h-12 text-white/30" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Favorites Yet
                  </h3>
                  <p className="text-white/60 mb-6 max-w-md">
                    Start exploring our collection and save your favorite cars for later.
                    Just click the heart icon on any car listing!
                  </p>
                  <Button
                    color="primary"
                    variant="shadow"
                    size="lg"
                    onPress={() => router.push('/cars')}
                  >
                    Browse Cars
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          /* Cars Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteCars.map((car, index) => (
              <div
                key={car.id}
                className="opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'forwards',
                }}
              >
                <CarCard car={car} onFavoriteChange={handleFavoriteChange} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
