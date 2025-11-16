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
import { Image } from '@heroui/image';
import { Spinner } from '@heroui/spinner';
import {
  Search, SlidersHorizontal, X, MapPin, Calendar,
  Gauge, Fuel, Settings, Heart, Star
} from 'lucide-react';
import { apiService } from '@/services/api';
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
    condition_rating: undefined,
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
      condition_rating: undefined,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search Cars
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {totalItems} vehicle{totalItems !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-4">
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <SlidersHorizontal size={20} />
                    Filters
                  </h2>
                  <Button
                    size="sm"
                    variant="flat"
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
                    <SelectItem key={brand.id} value={String(brand.id)}>
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
                  <SelectItem key="GASOLINE" value="GASOLINE">Gasoline</SelectItem>
                  <SelectItem key="DIESEL" value="DIESEL">Diesel</SelectItem>
                  <SelectItem key="ELECTRIC" value="ELECTRIC">Electric</SelectItem>
                  <SelectItem key="HYBRID" value="HYBRID">Hybrid</SelectItem>
                </Select>

                {/* Transmission */}
                <Select
                  label="Transmission"
                  placeholder="All Types"
                  selectedKeys={filters.transmission ? [filters.transmission] : []}
                  onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value as any }))}
                >
                  <SelectItem key="MANUAL" value="MANUAL">Manual</SelectItem>
                  <SelectItem key="AUTOMATIC" value="AUTOMATIC">Automatic</SelectItem>
                  <SelectItem key="CVT" value="CVT">CVT</SelectItem>
                  <SelectItem key="DCT" value="DCT">DCT</SelectItem>
                </Select>

                {/* Condition */}
                <Select
                  label="Condition"
                  placeholder="All Conditions"
                  selectedKeys={filters.condition_rating ? [filters.condition_rating] : []}
                  onChange={(e) => setFilters(prev => ({ ...prev, condition_rating: e.target.value as any }))}
                >
                  <SelectItem key="BRAND_NEW" value="BRAND_NEW">Brand New</SelectItem>
                  <SelectItem key="LIKE_NEW" value="LIKE_NEW">Like New</SelectItem>
                  <SelectItem key="EXCELLENT" value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem key="GOOD" value="GOOD">Good</SelectItem>
                  <SelectItem key="FAIR" value="FAIR">Fair</SelectItem>
                  <SelectItem key="POOR" value="POOR">Poor</SelectItem>
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
                    isSelected={filters.negotiable}
                    onValueChange={(checked) => setFilters(prev => ({ ...prev, negotiable: checked || undefined }))}
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
                <SelectItem key="-created_at" value="-created_at">Newest First</SelectItem>
                <SelectItem key="price" value="price">Price: Low to High</SelectItem>
                <SelectItem key="-price" value="-price">Price: High to Low</SelectItem>
                <SelectItem key="year" value="year">Year: Old to New</SelectItem>
                <SelectItem key="-year" value="-year">Year: New to Old</SelectItem>
                <SelectItem key="mileage" value="mileage">Mileage: Low to High</SelectItem>
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
                          </div>

                          {/* Favorite Button - Fixed: Use div instead of Button to avoid nesting */}
                          <div
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToFavorites(car.id);
                            }}
                          >
                            <Heart size={18} className="text-gray-700 hover:text-red-500 transition-colors" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="mb-3">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                              {car.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {car.brand_rel?.name} {car.model_rel?.name}
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
                            <span>{car.city?.name || 'Philippines'}</span>
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