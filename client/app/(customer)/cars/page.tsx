// ==========================================
// app/(customer)/cars/page.tsx - Advanced Search Page with Glassmorphism
// ==========================================

'use client';

import { useState, useEffect, useRef } from 'react';
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
  Search, SlidersHorizontal, X,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { Car, Brand, SearchFilters } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import CarCard from '@/components/CarCard';

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

  const resultsRef = useRef<HTMLDivElement>(null);

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
    setupScrollAnimations();
  }, []);

  // Search when page or sort changes (immediate)
  useEffect(() => {
    searchCars();
  }, [filters.page, filters.sort]);

  // Search immediately when dropdown filters change (brand, fuel_type, transmission, condition, checkboxes)
  useEffect(() => {
    // Skip on initial mount
    if (filters.page === 1) {
      searchCars();
    }
  }, [filters.brand_id, filters.fuel_type, filters.transmission, filters.car_condition, filters.is_featured, filters.price_negotiable, filters.financing_available]);

  // Debounce search for price and year range changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.page === 1) {
        searchCars();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [priceRange, yearRange]);

  const setupScrollAnimations = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    if (resultsRef.current) {
      observer.observe(resultsRef.current);
    }

    return () => observer.disconnect();
  };

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

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen py-8 px-4 relative">
      {/* Subtle background glow */}
      <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[120px] animate-pulse-red"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with glassmorphism */}
        <div className="mb-8 p-6 bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Search <span className="text-gradient-red">Cars</span>
          </h1>
          <p className="text-gray-300 text-lg">
            {totalItems} vehicle{totalItems !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar with glassmorphism */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-4 bg-black/20 backdrop-blur-2xl border border-white/10">
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <SlidersHorizontal size={20} className="text-primary-400" />
                    Filters
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={handleClearFilters}
                      startContent={<X size={16} />}
                      className="bg-white/10 hover:bg-white/20 border border-white/20"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold shadow-2xl shadow-primary-600/30 hover:shadow-primary-600/50 hover:scale-105 transition-all duration-300"
                      onPress={handleSearch}
                      startContent={<Search size={16} />}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <Input
                  placeholder="Search..."
                  value={filters.q || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  startContent={<Search size={18} className="text-primary-400" />}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-white/5 border-white/10 hover:border-primary-500/50",
                  }}
                />

                {/* Brand */}
                <Select
                  label="Brand"
                  placeholder="All Brands"
                  selectedKeys={filters.brand_id ? [String(filters.brand_id)] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    setFilters(prev => ({
                      ...prev,
                      brand_id: selectedKey ? parseInt(String(selectedKey)) : undefined,
                      page: 1
                    }));
                  }}
                  classNames={{
                    trigger: "bg-white/5 border-white/10 hover:border-primary-500/50",
                    label: "text-gray-300",
                    value: "text-white",
                  }}
                >
                  {brands.map(brand => (
                    <SelectItem key={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </Select>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">
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
                    classNames={{
                      track: "bg-white/10",
                      filler: "bg-gradient-to-r from-primary-600 to-primary-700",
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>

                {/* Year Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">
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
                    classNames={{
                      track: "bg-white/10",
                      filler: "bg-gradient-to-r from-primary-600 to-primary-700",
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{yearRange[0]}</span>
                    <span>{yearRange[1]}</span>
                  </div>
                </div>

                {/* Fuel Type */}
                <Select
                  label="Fuel Type"
                  placeholder="All Types"
                  selectedKeys={filters.fuel_type ? [filters.fuel_type] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    setFilters(prev => ({
                      ...prev,
                      fuel_type: selectedKey ? String(selectedKey) as any : undefined,
                      page: 1
                    }));
                  }}
                  classNames={{
                    trigger: "bg-white/5 border-white/10 hover:border-primary-500/50",
                    label: "text-gray-300",
                    value: "text-white",
                  }}
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
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    setFilters(prev => ({
                      ...prev,
                      transmission: selectedKey ? String(selectedKey) as any : undefined,
                      page: 1
                    }));
                  }}
                  classNames={{
                    trigger: "bg-white/5 border-white/10 hover:border-primary-500/50",
                    label: "text-gray-300",
                    value: "text-white",
                  }}
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
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    setFilters(prev => ({
                      ...prev,
                      car_condition: selectedKey ? String(selectedKey) as any : undefined,
                      page: 1
                    }));
                  }}
                  classNames={{
                    trigger: "bg-white/5 border-white/10 hover:border-primary-500/50",
                    label: "text-gray-300",
                    value: "text-white",
                  }}
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
                    classNames={{
                      label: "text-gray-300",
                    }}
                  >
                    Featured only
                  </Checkbox>
                  <Checkbox
                    isSelected={filters.price_negotiable}
                    onValueChange={(checked) => setFilters(prev => ({ ...prev, price_negotiable: checked || undefined }))}
                    classNames={{
                      label: "text-gray-300",
                    }}
                  >
                    Negotiable price
                  </Checkbox>
                  <Checkbox
                    isSelected={filters.financing_available}
                    onValueChange={(checked) => setFilters(prev => ({ ...prev, financing_available: checked || undefined }))}
                    classNames={{
                      label: "text-gray-300",
                    }}
                  >
                    Financing available
                  </Checkbox>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3" ref={resultsRef}>
            {/* Sort & View Toggle */}
            <div className="flex items-center justify-between mb-6 p-4 bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10">
              <Button
                variant="flat"
                className="lg:hidden bg-white/10 hover:bg-white/20 border border-white/20"
                onPress={() => setShowFilters(!showFilters)}
                startContent={<SlidersHorizontal size={18} />}
              >
                Filters
              </Button>

              <Select
                label="Sort by"
                selectedKeys={[filters.sort || '-created_at']}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0];
                  setFilters(prev => ({ ...prev, sort: String(selectedKey) || '-created_at' }));
                }}
                className="max-w-xs ml-auto"
                size="sm"
                classNames={{
                  trigger: "bg-white/5 border-white/10 hover:border-primary-500/50",
                  label: "text-gray-300",
                  value: "text-white",
                }}
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
              <Card className="bg-black/20 backdrop-blur-2xl border border-white/10">
                <CardBody className="text-center py-16">
                  <Search className="mx-auto text-primary-400 mb-4" size={64} />
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No cars found
                  </h3>
                  <p className="text-gray-300 mb-6 text-lg">
                    Try adjusting your filters or search terms
                  </p>
                  <Button
                    variant="flat"
                    onPress={handleClearFilters}
                    className="bg-white/10 hover:bg-white/20 border border-white/20"
                  >
                    Clear Filters
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <>
                {/* Car Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {cars.map((car, index) => (
                    <div
                      key={car.id}
                      className="opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                    >
                      <CarCard car={car} onFavoriteChange={searchCars} />
                    </div>
                  ))}
                </div>

                {/* Pagination with glassmorphism */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 p-4 bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10">
                    <Button
                      variant="flat"
                      isDisabled={filters.page === 1}
                      onPress={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50"
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
                            className={
                              filters.page === page
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                                : 'bg-white/10 hover:bg-white/20 border border-white/20'
                            }
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
                      className="bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50"
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
