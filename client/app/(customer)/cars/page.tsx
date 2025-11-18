// ==========================================
// app/(customer)/cars/page.tsx - Advanced Search Page
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Slider } from '@heroui/slider';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import {
  Search, SlidersHorizontal, X, MapPin, Calendar,
  Gauge, Fuel, Settings, Heart, Star, Eye, TrendingUp
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Car, Brand, SearchFilters } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function SearchCarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || undefined,
    brand_id: searchParams.get('brand_id') ? parseInt(searchParams.get('brand_id')!) : undefined,
    min_price: undefined,
    max_price: undefined,
    min_year: undefined,
    max_year: undefined,
    fuel_type: undefined,
    transmission: undefined,
    car_condition: undefined,
    page: 1,
    page_size: 20,
    sort: '-created_at',
  });

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [yearRange, setYearRange] = useState<[number, number]>([2000, new Date().getFullYear()]);

  useEffect(() => {
    loadBrands(); 
  }, []);

  useEffect(() => {
    searchCars();
  }, [filters.page, filters.sort]);

  const loadBrands = async () => {
    try {
      const response = await apiService.getBrands(true);
      if (response.success && response.data) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const searchCars = async () => {
    try {
      setLoading(true);
      const response = await apiService.searchCars({
        ...filters,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 5000000 ? priceRange[1] : undefined,
        min_year: yearRange[0] > 2000 ? yearRange[0] : undefined,
        max_year: yearRange[1] < new Date().getFullYear() ? yearRange[1] : undefined,
      });

      if (response.success && response.data) {
        setCars(response.data.items || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error searching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    searchCars();
  };

  const handleClearFilters = () => {
    setFilters({
      q: undefined,
      brand_id: undefined,
      min_price: undefined,
      max_price: undefined,
      min_year: undefined,
      max_year: undefined,
      fuel_type: undefined,
      transmission: undefined,
      car_condition: undefined,
      page: 1,
      page_size: 20,
      sort: '-created_at',
    });
    setPriceRange([0, 5000000]);
    setYearRange([2000, new Date().getFullYear()]);
    searchCars();
  };

  const handleAddToFavorites = async (carId: number) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      await apiService.addToFavorites(carId);
      setCars(prev =>
        prev.map(car =>
          car.id === carId
            ? { ...car, favorite_count: (car.favorite_count || 0) + 1 }
            : car
        )
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Discover Your Dream Car
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{totalItems}</span> vehicle{totalItems !== 1 ? 's' : ''} available
            </p>
            {totalItems > 0 && (
              <Chip size="sm" color="success" variant="flat" startContent={<TrendingUp size={14} />}>
                Live Listings
              </Chip>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block animate-slideInLeft' : 'hidden lg:block'}`}>
            <Card className="sticky top-4 shadow-lg border border-blue-100 dark:border-blue-900/20">
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <SlidersHorizontal size={20} className="text-blue-600" />
                    Filters
                  </h2>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onPress={handleClearFilters}
                    startContent={<X size={16} />}
                  >
                    Clear
                  </Button>
                </div>

                {/* Search */}
                <Input
                  placeholder="Search..."
                  value={filters.q || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  startContent={<Search size={18} />}
                />

                {/* Brand */}
                <Select 
                  label="Brand"
                  placeholder="All Brands"
                  selectedKeys={filters.brand_id ? [String(filters.brand_id)] : []}
                  onChange={(e) => setFilters(prev => ({ ...prev, brand_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                >
                  {brands.map(brand => (
                    <SelectItem key={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </Select>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price Range
                  </label>
                  <Slider
                    label=" "
                    step={50000}
                    minValue={0}
                    maxValue={5000000}
                    value={priceRange}
                    onChange={(value) => setPriceRange(value as [number, number])}
                    formatOptions={{ style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }}
                    className="max-w-md"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>

                {/* Year Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Year Range
                  </label>
                  <Slider
                    label=" "
                    step={1}
                    minValue={2000}
                    maxValue={new Date().getFullYear()}
                    value={yearRange}
                    onChange={(value) => setYearRange(value as [number, number])}
                    className="max-w-md"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>{yearRange[0]}</span>
                    <span>{yearRange[1]}</span>
                  </div>
                </div>

                {/* Fuel Type */}
                <Select
                  label="Fuel Type"
                  placeholder="All Types"
                  selectedKeys={filters.fuel_type ? [filters.fuel_type] : []}
                  onChange={(e) => setFilters(prev => ({ ...prev, fuel_type: e.target.value as any }))}
                >
                  <SelectItem key="GASOLINE">Gasoline</SelectItem>
                  <SelectItem key="DIESEL">Diesel</SelectItem>
                  <SelectItem key="ELECTRIC">Electric</SelectItem>
                  <SelectItem key="HYBRID">Hybrid</SelectItem>
                </Select>

                {/* Transmission */}
                <Select
                  label="Transmission"
                  placeholder="All Types"
                  selectedKeys={filters.transmission ? [filters.transmission] : []}
                  onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value as any }))}
                >
                  <SelectItem key="MANUAL">Manual</SelectItem>
                  <SelectItem key="AUTOMATIC">Automatic</SelectItem>
                  <SelectItem key="CVT">CVT</SelectItem>
                  <SelectItem key="DCT">DCT</SelectItem>
                </Select>

                {/* Condition */}
                <Select
                  label="Condition"
                  placeholder="All Conditions"
                  selectedKeys={filters.car_condition ? [filters.car_condition] : []}
                  onChange={(e) => setFilters(prev => ({ ...prev, car_condition: e.target.value as any }))}
                >
                  <SelectItem key="BRAND_NEW">Brand New</SelectItem>
                  <SelectItem key="LIKE_NEW">Like New</SelectItem>
                  <SelectItem key="EXCELLENT">Excellent</SelectItem>
                  <SelectItem key="GOOD">Good</SelectItem>
                  <SelectItem key="FAIR">Fair</SelectItem>
                  <SelectItem key="POOR">Poor</SelectItem>
                </Select>

                {/* Options */}
                <div className="space-y-2">
                  <Checkbox
                    isSelected={filters.is_featured}
                    onValueChange={(checked) => setFilters(prev => ({ ...prev, is_featured: checked || undefined }))}
                  >
                    Featured only
                  </Checkbox>
                  <Checkbox
                    isSelected={filters.price_negotiable}
                    onValueChange={(checked) => setFilters(prev => ({ ...prev, price_negotiable: checked || undefined }))}
                  >
                    Negotiable price
                  </Checkbox>
                  <Checkbox
                    isSelected={filters.financing_available}
                    onValueChange={(checked) => setFilters(prev => ({ ...prev, financing_available: checked || undefined }))}
                  >
                    Financing available
                  </Checkbox>
                </div>

                <Button
                  color="primary"
                  className="w-full"
                  onPress={handleSearch}
                  startContent={<Search size={18} />}
                >
                  Apply Filters
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Sort & View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="flat"
                className="lg:hidden"
                onPress={() => setShowFilters(!showFilters)}
                startContent={<SlidersHorizontal size={18} />}
              >
                Filters
              </Button>

              <Select
                label="Sort by"
                selectedKeys={[filters.sort || '-created_at']}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className="max-w-xs ml-auto"
                size="sm"
              >
                <SelectItem key="-created_at">Newest First</SelectItem>
                <SelectItem key="price">Price: Low to High</SelectItem>
                <SelectItem key="-price">Price: High to Low</SelectItem>
                <SelectItem key="year">Year: Old to New</SelectItem>
                <SelectItem key="-year">Year: New to Old</SelectItem>
                <SelectItem key="mileage">Mileage: Low to High</SelectItem>
              </Select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spinner size="lg" color="primary" />
              </div>
            ) : cars.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <Search className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No cars found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="flat" onPress={handleClearFilters}>
                    Clear Filters
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <>
                {/* Car Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {cars.map((car, index) => (
                    <Card
                      key={car.id}
                      isPressable
                      onPress={() => router.push(`/cars/${car.id}`)}
                      className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-800 overflow-hidden animate-fadeInUp"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardBody className="p-0">
                        {/* Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                          <img
                            src={getImageUrl(car.images?.[0]?.image_url) || '/placeholder-car.jpg'}
                            alt={car.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-car.jpg';
                            }}
                            loading="lazy"
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                            {car.is_featured && (
                              <Chip
                                color="warning"
                                size="sm"
                                variant="solid"
                                className="animate-pulse shadow-lg"
                                startContent={<Star size={12} fill="currentColor" />}
                              >
                                Featured
                              </Chip>
                            )}
                            {car.car_condition === 'BRAND_NEW' && (
                              <Chip color="success" size="sm" variant="solid" className="shadow-lg">
                                Brand New
                              </Chip>
                            )}
                          </div>

                          {/* Quick View Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Eye size={16} className="text-blue-600" />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">View Details</span>
                            </div>
                          </div>

                          {/* Favorite Button */}
                          <div
                            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg z-10 group/heart"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToFavorites(car.id);
                            }}
                          >
                            <Heart size={18} className="text-gray-600 dark:text-gray-400 group-hover/heart:text-red-500 group-hover/heart:fill-red-500 transition-all duration-300" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 bg-white dark:bg-gray-950">
                          <div className="mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {car.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <span className="font-medium">{car.brand_rel?.name}</span>
                              <span>•</span>
                              <span>{car.model_rel?.name}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Price</p>
                              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {formatPrice(car.price)}
                              </span>
                            </div>
                            {car.price_negotiable && (
                              <Chip size="sm" variant="flat" color="success" className="animate-pulse">
                                Negotiable
                              </Chip>
                            )}
                          </div>

                          {/* Specs */}
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <Calendar size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{car.year}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <Gauge size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{formatMileage(car.mileage)}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <Fuel size={16} className="text-orange-600 dark:text-orange-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs capitalize">{car.fuel_type?.toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <Settings size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs capitalize">{car.transmission?.toLowerCase()}</span>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <MapPin size={14} className="flex-shrink-0" />
                            <span className="truncate">{car.city?.name || 'Philippines'}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="flat"
                      isDisabled={filters.page === 1}
                      onPress={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    >
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={filters.page === page ? 'solid' : 'flat'}
                            color={filters.page === page ? 'primary' : 'default'}
                            onPress={() => setFilters(prev => ({ ...prev, page }))}
                            size="sm"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

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
        </div>
      </div>
    </div>
  );
}