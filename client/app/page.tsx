"use client";

import { useState, useEffect } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { SearchIcon } from "@/components/icons";
import { Car } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import CarCard from '@/components/CarCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFeaturedCars(8);

      if (response.success && response.data) {
        setFeaturedCars(response.data.items || []);
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
    <div className="w-full bg-transparent">
      {/* Hero Section - Red & Black */}
      <section className="relative hero-red-black py-24 lg:py-32 overflow-hidden bg-transparent">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-grid opacity-30"></div>

        {/* Red Glow Effects */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-600 rounded-full blur-[120px] opacity-20 animate-pulse-red"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-700 rounded-full blur-[120px] opacity-15 animate-pulse-red" style={{animationDelay: '1s'}}></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="animate-fade-in">
              <Chip
                size="lg"
                className="bg-gradient-red-dark text-white font-bold px-6 py-2 shadow-red-glow"
              >
                🔥 Premium Car Marketplace
              </Chip>
            </div>

            {/* Main Heading */}
            <div className="space-y-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight">
                DRIVE YOUR
                <span className="block text-gradient-red mt-2">
                  DREAM CAR
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light">
                Discover premium vehicles with <span className="text-primary-500 font-semibold">AutoHub Philippines</span>
                <br className="hidden md:block" />
                Your trusted marketplace for quality cars
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="flex gap-3 p-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-primary-900/30 shadow-red-glow">
                <Input
                  size="lg"
                  placeholder="Search by brand, model, or location..."
                  startContent={<SearchIcon className="text-primary-500" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  classNames={{
                    input: "text-white text-lg",
                    inputWrapper: "bg-black/40 backdrop-blur-sm border-dark-600 hover:border-primary-600 focus-within:border-primary-500 shadow-lg",
                  }}
                />
                <Button
                  size="lg"
                  onPress={handleSearch}
                  className="bg-gradient-red-dark text-white font-bold px-8 shadow-red-glow hover:shadow-red-glow-lg transition-all hover:scale-105"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <Button
                size="lg"
                onPress={() => router.push('/cars')}
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-10 py-6 text-lg shadow-red-glow hover:shadow-red-glow-lg transition-all hover:scale-105"
              >
                Browse All Cars
              </Button>
              <Button
                size="lg"
                onPress={() => router.push(isAuthenticated ? '/seller/new' : '/auth/register')}
                variant="bordered"
                className="border-2 border-primary-600 text-primary-500 hover:bg-primary-600 hover:text-white font-bold px-10 py-6 text-lg transition-all hover:scale-105"
              >
                {isAuthenticated ? 'Sell Your Car' : 'Join AutoHub'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/20 backdrop-blur-sm border-y border-primary-900/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Active Users', icon: '👥' },
              { value: '5K+', label: 'Cars Listed', icon: '🚗' },
              { value: '1K+', label: 'Sold Monthly', icon: '✅' },
              { value: '100%', label: 'Verified', icon: '🛡️' },
            ].map((stat, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-black/30 backdrop-blur-md border border-dark-700 hover:border-primary-600 transition-all hover:shadow-red-glow"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <h3 className="text-4xl md:text-5xl font-black text-gradient-red mb-2">
                  {stat.value}
                </h3>
                <p className="text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      {loading ? (
        <section className="py-20 bg-transparent">
          <LoadingSpinner label="Loading featured cars..." />
        </section>
      ) : featuredCars.length > 0 && (
        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Chip
                size="lg"
                className="badge-red mb-4"
              >
                FEATURED VEHICLES
              </Chip>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                Premium <span className="text-gradient-red">Selection</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Handpicked vehicles that meet our highest standards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map((car) => (
                <CarCard key={car.id} car={car} onFavoriteChange={fetchFeaturedCars} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onPress={() => router.push('/cars?is_featured=true')}
                variant="bordered"
                className="border-2 border-primary-600 text-primary-500 hover:bg-primary-600 hover:text-white font-bold px-10 transition-all"
              >
                View All Featured Cars →
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-black/20 backdrop-blur-sm border-t border-primary-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              Why Choose <span className="text-gradient-red">AutoHub</span>
            </h2>
            <p className="text-xl text-gray-400">Experience the premium difference</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Verified Listings',
                description: 'Every vehicle is thoroughly inspected and verified by our team'
              },
              {
                icon: '⚡',
                title: 'Instant Connect',
                description: 'Direct messaging with sellers, no middlemen, no delays'
              },
              {
                icon: '🛡️',
                title: 'Secure Transactions',
                description: 'Protected payments and legal documentation support'
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-black/30 backdrop-blur-md border border-dark-700 hover:border-primary-600 transition-all card-hover-lift"
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-red-black relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-900/20 to-transparent"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                Ready to Find Your
                <span className="block text-gradient-red mt-2">Perfect Ride?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join thousands of car enthusiasts who trust AutoHub for their automotive needs
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  onPress={() => router.push('/auth/register')}
                  className="bg-white text-black hover:bg-gray-200 font-bold px-12 py-6 text-lg transition-all hover:scale-105 shadow-xl"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  onPress={() => router.push('/cars')}
                  variant="bordered"
                  className="border-2 border-white text-white hover:bg-white hover:text-black font-bold px-12 py-6 text-lg transition-all hover:scale-105"
                >
                  Browse Cars
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
