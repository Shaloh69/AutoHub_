"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { SearchIcon, PlusIcon, CheckIcon } from "@/components/icons";
import { title, subtitle } from "@/components/primitives";
import { apiService, Car } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFeaturedCars();
      
      if (response.success && Array.isArray(response.data)) {
        setFeaturedCars(response.data.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed to fetch featured cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/cars');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-luxury opacity-95"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(225,6,0,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,209,102,0.1),transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10 text-center space-y-8 px-4">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-autohub-accent2-500/20 text-autohub-accent2-500 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-autohub-accent2-500 rounded-full animate-pulse"></span>
              Premium Automotive Marketplace
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-autohub-neutral-50 leading-tight">
              Discover Your
              <span className="block bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent">
                Dream Car
              </span>
            </h1>
            <h2 className="text-xl lg:text-2xl text-autohub-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Experience luxury automotive excellence with AutoHub's curated collection of premium vehicles from trusted dealers and private sellers.
            </h2>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto animate-slide-up">
            <div className="flex gap-3 p-3 bg-autohub-neutral-50/10 backdrop-blur-md rounded-2xl border border-autohub-accent1-600/30">
              <Input
                size="lg"
                placeholder="Search luxury vehicles, brands, or locations..."
                startContent={<SearchIcon className="text-autohub-accent1-500" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                classNames={{
                  inputWrapper: "bg-autohub-neutral-50 border-none shadow-lg",
                  input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                }}
              />
              <Button 
                size="lg" 
                onPress={handleSearch}
                className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold px-8 shadow-autohub transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Search
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <Button
              as="a"
              href="/cars"
              size="lg"
              variant="bordered"
              className="border-autohub-neutral-300 text-autohub-neutral-100 hover:bg-autohub-neutral-100 hover:text-autohub-secondary-900 font-semibold transition-all duration-200"
            >
              Browse Premium Collection
            </Button>
            {isAuthenticated ? (
              <Button
                as="a"
                href="/dashboard/create-listing"
                size="lg"
                className="bg-autohub-accent2-500 hover:bg-autohub-accent2-600 text-autohub-secondary-900 font-semibold shadow-gold transition-all duration-200 hover:shadow-lg hover:scale-105"
                startContent={<PlusIcon />}
              >
                List Your Vehicle
              </Button>
            ) : (
              <Button
                as="a"
                href="/auth/register"
                size="lg"
                className="bg-autohub-accent2-500 hover:bg-autohub-accent2-600 text-autohub-secondary-900 font-semibold shadow-gold transition-all duration-200 hover:shadow-lg hover:scale-105"
                startContent={<PlusIcon />}
              >
                Join AutoHub
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-autohub-neutral-50 dark:bg-autohub-accent1-900/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="group hover:scale-105 transition-transform duration-200">
            <h3 className="text-4xl lg:text-5xl font-bold text-autohub-primary-500 mb-2 group-hover:text-autohub-primary-400 transition-colors">
              15K+
            </h3>
            <p className="text-autohub-accent1-600 font-medium">Premium Vehicles</p>
          </div>
          <div className="group hover:scale-105 transition-transform duration-200">
            <h3 className="text-4xl lg:text-5xl font-bold text-autohub-accent2-500 mb-2 group-hover:text-autohub-accent2-400 transition-colors">
              8K+
            </h3>
            <p className="text-autohub-accent1-600 font-medium">Satisfied Clients</p>
          </div>
          <div className="group hover:scale-105 transition-transform duration-200">
            <h3 className="text-4xl lg:text-5xl font-bold text-autohub-primary-500 mb-2 group-hover:text-autohub-primary-400 transition-colors">
              850+
            </h3>
            <p className="text-autohub-accent1-600 font-medium">Trusted Dealers</p>
          </div>
          <div className="group hover:scale-105 transition-transform duration-200">
            <h3 className="text-4xl lg:text-5xl font-bold text-autohub-accent2-500 mb-2 group-hover:text-autohub-accent2-400 transition-colors">
              95+
            </h3>
            <p className="text-autohub-accent1-600 font-medium">Global Locations</p>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-20 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-autohub-accent2-500/10 text-autohub-accent2-600 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-autohub-accent2-500 rounded-full"></span>
            Handpicked Excellence
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Featured 
            <span className="bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent ml-3">
              Vehicles
            </span>
          </h2>
          <p className="text-xl text-autohub-accent1-600 max-w-2xl mx-auto">
            Curated selection of exceptional vehicles from our premium collection
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="primary" />
          </div>
        ) : featuredCars.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-autohub-accent1-600 text-lg">No featured vehicles available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCars.map((car, index) => (
              <Card
                key={car.id}
                isPressable
                onPress={() => router.push(`/cars/${car.id}`)}
                className="group hover:shadow-autohub transition-all duration-300 hover:-translate-y-2 border border-autohub-accent1-200 hover:border-autohub-primary-500/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardBody className="p-0">
                  <div className="relative overflow-hidden">
                    <Image
                      src={car.images[0] || '/placeholder-car.jpg'}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      radius="none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-autohub-secondary-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Chip
                      color="warning"
                      size="sm"
                      className="absolute top-3 left-3 bg-autohub-accent2-500 text-autohub-secondary-900 font-semibold"
                    >
                      Featured
                    </Chip>
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
                      {car.condition === 'CERTIFIED' ? 'Certified' : car.condition}
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
                      <span>{new Intl.NumberFormat().format(car.mileage)} miles</span>
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

        <div className="text-center pt-8">
          <Button
            as="a"
            href="/cars"
            size="lg"
            variant="bordered"
            className="border-autohub-primary-500 text-autohub-primary-500 hover:bg-autohub-primary-500 hover:text-white font-semibold px-8 transition-all duration-200"
          >
            Explore Full Collection
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-autohub-accent1-900/5 dark:bg-autohub-accent1-900/20">
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
              The AutoHub
              <span className="bg-gradient-to-r from-autohub-primary-500 to-autohub-accent2-500 bg-clip-text text-transparent ml-3">
                Experience
              </span>
            </h2>
            <p className="text-xl text-autohub-accent1-600 max-w-2xl mx-auto">
              Premium automotive marketplace designed for discerning buyers and sellers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border border-autohub-accent1-200 hover:border-autohub-primary-500/50 hover:shadow-autohub transition-all duration-300">
              <CardBody className="space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-autohub-primary-500 to-autohub-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-autohub">
                  <SearchIcon className="text-white" size={36} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                    Discover & Search
                  </h3>
                  <p className="text-autohub-accent1-600 leading-relaxed">
                    Browse our curated collection of premium vehicles using advanced filters and intelligent search capabilities.
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  <CheckIcon className="text-autohub-accent2-500" size={20} />
                  <span className="text-sm text-autohub-accent1-600">Verified Listings</span>
                </div>
              </CardBody>
            </Card>

            <Card className="text-center p-8 border border-autohub-accent1-200 hover:border-autohub-primary-500/50 hover:shadow-autohub transition-all duration-300">
              <CardBody className="space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-autohub-accent2-500 to-autohub-accent2-600 rounded-2xl flex items-center justify-center mx-auto shadow-gold">
                  <svg className="text-autohub-secondary-900" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                    Inspect & Verify
                  </h3>
                  <p className="text-autohub-accent1-600 leading-relaxed">
                    Every vehicle undergoes rigorous verification with detailed history reports and professional inspections.
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  <CheckIcon className="text-autohub-accent2-500" size={20} />
                  <span className="text-sm text-autohub-accent1-600">Quality Assured</span>
                </div>
              </CardBody>
            </Card>

            <Card className="text-center p-8 border border-autohub-accent1-200 hover:border-autohub-primary-500/50 hover:shadow-autohub transition-all duration-300">
              <CardBody className="space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-autohub-accent1-700 to-autohub-accent1-800 rounded-2xl flex items-center justify-center mx-auto shadow-luxury">
                  <svg className="text-white" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                    Secure Transaction
                  </h3>
                  <p className="text-autohub-accent1-600 leading-relaxed">
                    Complete your purchase with confidence through our secure platform, warranty options, and dedicated support.
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  <CheckIcon className="text-autohub-accent2-500" size={20} />
                  <span className="text-sm text-autohub-accent1-600">Protected Purchase</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-autohub p-12 lg:p-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white">
                Ready to Find Your
                <span className="block text-autohub-accent2-400">Dream Car?</span>
              </h2>
              <p className="text-xl text-autohub-neutral-200 max-w-2xl mx-auto leading-relaxed">
                Join thousands of automotive enthusiasts who trust AutoHub for their premium vehicle needs. 
                Start your luxury car journey today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                <Button
                  as="a"
                  href="/auth/register"
                  size="lg"
                  className="bg-autohub-accent2-500 hover:bg-autohub-accent2-600 text-autohub-secondary-900 font-bold px-8 shadow-gold transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  Join AutoHub Premium
                </Button>
                <Button
                  as="a"
                  href="/cars"
                  variant="bordered"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-autohub-secondary-900 font-semibold px-8 transition-all duration-200"
                >
                  Browse Collection
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}