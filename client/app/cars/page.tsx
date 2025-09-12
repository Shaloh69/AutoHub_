"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Image } from "@heroui/image";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";
import { apiService, Car, CarSearchQuery } from '@/services/api';
import { useRouter } from 'next/navigation';

const makeOptions = [
  "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Cadillac", "Chevrolet", 
  "Ferrari", "Ford", "Honda", "Lamborghini", "Land Rover", "Lexus", "Maserati", 
  "McLaren", "Mercedes-Benz", "Nissan", "Porsche", "Rolls-Royce", "Tesla", "Toyota"
];

const bodyTypeOptions = [
  "Sedan", "Coupe", "Convertible", "SUV", "Sports Car", "Luxury", "Supercar", "Hatchback", "Truck", "Van"
];

const conditionOptions = [
  { key: "NEW", label: "New" },
  { key: "USED", label: "Pre-Owned" },
  { key: "CERTIFIED", label: "Certified Pre-Owned" }
];

const fuelTypeOptions = [
  { key: "GASOLINE", label: "Gasoline" },
  { key: "DIESEL", label: "Diesel" },
  { key: "ELECTRIC", label: "Electric" },
  { key: "HYBRID", label: "Hybrid" }
];

const transmissionOptions = [
  { key: "MANUAL", label: "Manual" },
  { key: "AUTOMATIC", label: "Automatic" }
];

const sortOptions = [
  { key: "createdAt-desc", label: "Newest First" },
  { key: "createdAt-asc", label: "Oldest First" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "mileage-asc", label: "Mileage: Low to High" },
  { key: "year-desc", label: "Year: Newest First" }
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('en-US').format(mileage);
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CarSearchQuery>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCars, setTotalCars] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const router = useRouter();

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.searchCars(filters);
      
      if (response.success && Array.isArray(response.data)) {
        setCars(response.data);
        setTotalCars(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        throw new Error(response.error || 'Failed to fetch cars');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const updateFilter = (key: keyof CarSearchQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handleSortChange = (sortKey: string) => {
    const [sortBy, sortOrder] = sortKey.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1
    }));
  };

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      if (['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) return false;
      return filters[key as keyof CarSearchQuery] !== undefined;
    });
  }, [filters]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-autohub-primary-500 text-lg mb-4">Error: {error}</p>
          <Button 
            className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white" 
            onPress={() => { setError(null); fetchCars(); }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-autohub-accent2-500/10 text-autohub-accent2-600 px-4 py-2 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-autohub-accent2-500 rounded-full animate-pulse"></span>
          Premium Collection
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
          Luxury Car
          <span className="bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent ml-3">
            Marketplace
          </span>
        </h1>
        <p className="text-xl text-autohub-accent1-600 max-w-2xl mx-auto">
          Discover exceptional vehicles from our curated collection of premium automobiles
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border border-autohub-accent1-200 shadow-luxury">
        <CardBody className="space-y-6 p-6">
          {/* Search Bar */}
          <div className="flex gap-4 items-end">
            <Input
              className="flex-1"
              placeholder="Search luxury vehicles, brands, or locations..."
              startContent={<SearchIcon className="text-autohub-accent1-500" />}
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              onClear={() => updateFilter('search', undefined)}
              isClearable
              variant="bordered"
              classNames={{
                inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
              }}
            />
            <Button
              variant={showFilters ? "solid" : "bordered"}
              className={showFilters 
                ? "bg-autohub-primary-500 text-white" 
                : "border-autohub-accent1-300 text-autohub-accent1-700 hover:border-autohub-primary-500"
              }
              onPress={() => setShowFilters(!showFilters)}
            >
              Filters {hasActiveFilters && <Chip size="sm" className="bg-autohub-accent2-500 text-autohub-secondary-900 ml-2">●</Chip>}
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="bordered" 
                  endContent={<ChevronDownIcon />}
                  className="border-autohub-accent1-300 text-autohub-accent1-700 hover:border-autohub-primary-500"
                >
                  Sort
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[`${filters.sortBy}-${filters.sortOrder}`]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey) handleSortChange(selectedKey);
                }}
              >
                {sortOptions.map((option) => (
                  <DropdownItem key={option.key}>{option.label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-autohub-accent1-200">
              <Select
                label="Make"
                placeholder="Any Make"
                selectedKeys={filters.make ? [filters.make] : []}
                onChange={(e) => updateFilter('make', e.target.value || undefined)}
                variant="bordered"
                classNames={{
                  trigger: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  label: "text-autohub-accent1-700",
                }}
              >
                {makeOptions.map((make) => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </Select>

              <Select
                label="Body Type"
                placeholder="Any Type"
                selectedKeys={filters.bodyType ? [filters.bodyType] : []}
                onChange={(e) => updateFilter('bodyType', e.target.value || undefined)}
                variant="bordered"
                classNames={{
                  trigger: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  label: "text-autohub-accent1-700",
                }}
              >
                {bodyTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </Select>

              <Select
                label="Condition"
                placeholder="Any Condition"
                selectedKeys={filters.condition ? [filters.condition] : []}
                onChange={(e) => updateFilter('condition', e.target.value || undefined)}
                variant="bordered"
                classNames={{
                  trigger: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  label: "text-autohub-accent1-700",
                }}
              >
                {conditionOptions.map((condition) => (
                  <SelectItem key={condition.key} value={condition.key}>{condition.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Fuel Type"
                placeholder="Any Fuel"
                selectedKeys={filters.fuelType ? [filters.fuelType] : []}
                onChange={(e) => updateFilter('fuelType', e.target.value || undefined)}
                variant="bordered"
                classNames={{
                  trigger: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  label: "text-autohub-accent1-700",
                }}
              >
                {fuelTypeOptions.map((fuel) => (
                  <SelectItem key={fuel.key} value={fuel.key}>{fuel.label}</SelectItem>
                ))}
              </Select>

              <div className="space-y-2">
                <label className="text-sm font-medium text-autohub-accent1-700">Price Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice?.toString() || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500",
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice?.toString() || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-autohub-accent1-700">Year Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minYear?.toString() || ''}
                    onChange={(e) => updateFilter('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500",
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxYear?.toString() || ''}
                    onChange={(e) => updateFilter('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500",
                    }}
                  />
                </div>
              </div>

              <Input
                label="Location"
                placeholder="City, State"
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value || undefined)}
                variant="bordered"
                classNames={{
                  inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  label: "text-autohub-accent1-700",
                }}
              />

              <div className="flex items-end">
                <Button
                  variant="flat"
                  className="bg-autohub-accent2-500/20 text-autohub-accent2-700 hover:bg-autohub-accent2-500/30"
                  onPress={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-autohub-accent1-600 font-medium">
          {loading ? 'Loading premium vehicles...' : `Showing ${cars.length} of ${totalCars} luxury vehicles`}
        </p>
      </div>

      {/* Cars Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" color="primary" />
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-2xl font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50 mb-2">No vehicles found</h3>
          <p className="text-autohub-accent1-600 mb-6">Try adjusting your search criteria to find more results</p>
          <Button 
            className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white" 
            onPress={clearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {cars.map((car, index) => (
            <Card
              key={car.id}
              isPressable
              onPress={() => router.push(`/cars/${car.id}`)}
              className="group hover:shadow-autohub transition-all duration-300 hover:-translate-y-2 border border-autohub-accent1-200 hover:border-autohub-primary-500/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardBody className="p-0">
                <div className="relative overflow-hidden">
                  <Image
                    src={car.images[0] || '/placeholder-car.jpg'}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    radius="none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-autohub-secondary-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {car.isFeatured && (
                    <Chip
                      size="sm"
                      className="absolute top-3 left-3 bg-autohub-accent2-500 text-autohub-secondary-900 font-semibold"
                    >
                      Featured
                    </Chip>
                  )}
                  <Chip
                    size="sm"
                    className={`absolute top-3 right-3 font-medium ${
                      car.condition === 'NEW' 
                        ? 'bg-green-500 text-white' 
                        : car.condition === 'CERTIFIED' 
                        ? 'bg-autohub-primary-500 text-white' 
                        : 'bg-autohub-accent1-500 text-white'
                    }`}
                  >
                    {car.condition === 'CERTIFIED' ? 'Certified' : car.condition === 'USED' ? 'Pre-Owned' : car.condition}
                  </Chip>
                </div>
              </CardBody>
              <CardFooter className="flex-col items-start p-6 bg-autohub-neutral-50 dark:bg-autohub-secondary-800">
                <h3 className="font-bold text-lg text-autohub-secondary-900 dark:text-autohub-neutral-50 mb-2">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-2xl font-bold text-autohub-primary-500 mb-3">
                  {formatPrice(car.price)}
                </p>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm text-autohub-accent1-600">
                    <span>{formatMileage(car.mileage)} miles</span>
                    <span>{car.fuelType}</span>
                  </div>
                  <div className="flex justify-between text-sm text-autohub-accent1-600">
                    <span>{car.transmission}</span>
                    <span>{car.location}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <Pagination
            total={totalPages}
            page={filters.page || 1}
            onChange={(page) => updateFilter('page', page)}
            showControls
            showShadow
            classNames={{
              item: "bg-autohub-neutral-50 border-autohub-accent1-300",
              cursor: "bg-autohub-primary-500 text-white shadow-autohub",
            }}
          />
        </div>
      )}
    </div>
  );
}