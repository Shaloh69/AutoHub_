// ==========================================
// app/(customer)/page.tsx - Customer Home Page
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Image } from '@heroui/image';
import { Spinner } from '@heroui/spinner';
import { 
  Search, MapPin, Calendar, Gauge, Fuel, Settings, 
  Heart, Star, TrendingUp, Sparkles 
} from 'lucide-react';
import { apiService } from '@/services/api';
import { Car, Brand, SearchFilters } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    page_size: 12,
    sort: '-created_at',
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchCars();
  }, [filters.page]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [carsResponse, brandsResponse] = await Promise.all([
        apiService.searchCars({ ...filters, is_featured: true }),
        apiService.getBrands(true),
      ]);

      if (carsResponse.success && carsResponse.data) {
        setCars(carsResponse.data.items || []);
        setTotalPages(carsResponse.data.total_pages || 1);
      }

      if (brandsResponse.success && brandsResponse.data) {
        setBrands(brandsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCars = async () => {
    try {
      setSearchLoading(true);
      const response = await apiService.searchCars(filters);

      if (response.success && response.data) {
        setCars(response.data.items || []);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error searching cars:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, q: searchQuery, page: 1 }));
    searchCars();
  };

  const handleBrandFilter = (brandId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      brand_id: brandId ? parseInt(brandId) : undefined,
      page: 1 
    }));
    searchCars();
  };

  const handleAddToFavorites = async (carId: number) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await apiService.addToFavorites(carId);
      if (response.success) {
        // Update the car in the list
        setCars(prev => prev.map(car => 
          car.id === carId 
            ? { ...car, favorite_count: (car.favorite_count || 0) + 1 }
            : car
        ));
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>Find Your Perfect Car in the Philippines</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Drive Your Dream Car
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
              Today
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Browse thousands of verified listings from trusted sellers across the Philippines
          </p>

          {/* Search Bar */}
          <Card className="max-w-4xl mx-auto shadow-xl">
            <CardBody className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search by brand, model, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  startContent={<Search className="text-gray-400" size={20} />}
                  classNames={{
                    input: "text-lg",
                    inputWrapper: "h-14",
                  }}
                  className="flex-1"
                />
                <Button
                  color="primary"
                  size="lg"
                  onPress={handleSearch}
                  isLoading={searchLoading}
                  className="md:w-auto w-full"
                >
                  Search
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Select
                  placeholder="All Brands"
                  onChange={(e) => handleBrandFilter(e.target.value)}
                  className="max-w-xs"
                  size="sm"
                >
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={String(brand.id)}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Featured Listings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Premium verified vehicles from trusted sellers
              </p>
            </div>
            
            <Button
              variant="flat"
              onPress={() => router.push('/cars')}
              endContent={<TrendingUp size={18} />}
            >
              View All
            </Button>
          </div>

          {searchLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : cars.length === 0 ? (
            <Card className="py-20">
              <CardBody className="text-center">
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  No cars found matching your criteria
                </p>
                <Button
                  variant="flat"
                  className="mt-4"
                  onPress={() => {
                    setFilters({ page: 1, page_size: 12, sort: '-created_at' });
                    setSearchQuery('');
                    searchCars();
                  }}
                >
                  Clear Filters
                </Button>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cars.map((car) => (
                  <Card
                    key={car.id}
                    isPressable
                    onPress={() => router.push(`/cars/${car.id}`)}
                    className="group hover:shadow-xl transition-all duration-300"
                  >
                    <CardBody className="p-0">
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={car.images?.[0]?.image_url || '/placeholder-car.jpg'}
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {car.is_featured && (
                            <Chip color="warning" size="sm" variant="solid">
                              <Star size={12} className="inline mr-1" />
                              Featured
                            </Chip>
                          )}
                          {car.is_premium && (
                            <Chip color="secondary" size="sm" variant="solid">
                              Premium
                            </Chip>
                          )}
                        </div>

                        {/* Favorite Button */}
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          className="absolute top-3 right-3 bg-white/90 backdrop-blur"
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToFavorites(car.id);
                          }}
                        >
                          <Heart size={18} />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                            {car.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {car.brand?.name} {car.model?.name}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatPrice(car.price, car.currency)}
                          </span>
                          {car.negotiable && (
                            <Chip size="sm" variant="flat" color="success">
                              Negotiable
                            </Chip>
                          )}
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{car.year}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge size={14} />
                            <span>{formatMileage(car.mileage)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel size={14} />
                            <span className="capitalize">{car.fuel_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings size={14} />
                            <span className="capitalize">{car.transmission}</span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                          <MapPin size={14} />
                          <span>{car.location?.city_name || 'Philippines'}</span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                          <span>{car.views_count || 0} views</span>
                          <span>{car.favorite_count || 0} saves</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="flat"
                    isDisabled={filters.page === 1}
                    onPress={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                  >
                    Previous
                  </Button>
                  
                  <span className="px-4 text-gray-600 dark:text-gray-400">
                    Page {filters.page} of {totalPages}
                  </span>
                  
                  <Button
                    variant="flat"
                    isDisabled={filters.page === totalPages}
                    onPress={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Sell Your Car?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            List your vehicle and reach thousands of potential buyers
          </p>
          <Button
            size="lg"
            variant="solid"
            className="bg-white text-blue-600 font-semibold"
            onPress={() => router.push(user ? '/seller/cars/new' : '/auth/register')}
          >
            Start Selling Now
          </Button>
        </div>
      </section>
    </div>
  );
}