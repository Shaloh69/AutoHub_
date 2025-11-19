"use client";

import { useState, useEffect, useRef } from 'react';
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

  // Refs for scroll animations
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const featuredRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchFeaturedCars();
    setupScrollAnimations();
  }, []);

  const setupScrollAnimations = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0');
        }
      });
    }, observerOptions);

    // Observe sections
    const sections = [statsRef, featuredRef, featuresRef, ctaRef];
    sections.forEach(ref => {
      if (ref.current) {
        ref.current.classList.add('opacity-0');
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  };

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
    <div className="w-full relative">
      {/* Hero Section - Transparent with Glassmorphism */}
      <section
        ref={heroRef}
        className="relative py-32 lg:py-40 overflow-hidden"
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent pointer-events-none"></div>

        {/* Animated glow effects */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[150px] animate-pulse-red"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-primary-700/15 rounded-full blur-[150px] animate-pulse-red" style={{animationDelay: '1.5s'}}></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            {/* Badge with glassmorphism */}
            <div className="animate-fade-in">
              <Chip
                size="lg"
                className="bg-primary-600/10 backdrop-blur-xl border border-primary-500/30 text-white font-bold px-8 py-3 shadow-2xl shadow-primary-600/20"
              >
                <span className="text-primary-400">🔥</span> Premium Car Marketplace
              </Chip>
            </div>

            {/* Main Heading with enhanced animation */}
            <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter">
                <span className="block opacity-90">DRIVE YOUR</span>
                <span className="block text-gradient-red mt-4 text-glow-red">
                  DREAM CAR
                </span>
              </h1>
              <p className="text-2xl md:text-3xl text-gray-300/90 max-w-3xl mx-auto font-light leading-relaxed">
                Discover premium vehicles with{' '}
                <span className="text-primary-400 font-semibold">AutoHub Philippines</span>
                <br className="hidden md:block" />
                Your trusted marketplace for quality cars
              </p>
            </div>

            {/* Search Bar with glassmorphism */}
            <div className="max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="flex gap-4 p-3 bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl hover:border-primary-500/30 transition-all duration-500">
                <Input
                  size="lg"
                  placeholder="Search by brand, model, or location..."
                  startContent={<SearchIcon className="text-primary-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  classNames={{
                    input: "text-white text-xl placeholder:text-gray-400",
                    inputWrapper: "bg-transparent border-0 shadow-none",
                  }}
                />
                <Button
                  size="lg"
                  onPress={handleSearch}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold px-10 shadow-2xl shadow-primary-600/30 hover:shadow-primary-600/50 hover:scale-105 transition-all duration-300"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <Button
                size="lg"
                onPress={() => router.push('/cars')}
                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold px-12 py-7 text-xl hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                Browse All Cars
              </Button>
              <Button
                size="lg"
                onPress={() => router.push(isAuthenticated ? '/seller/new' : '/auth/register')}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold px-12 py-7 text-xl shadow-2xl shadow-primary-600/30 hover:shadow-primary-600/50 hover:scale-105 transition-all duration-300"
              >
                {isAuthenticated ? 'Sell Your Car' : 'Join AutoHub'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with glassmorphism */}
      <section
        ref={statsRef}
        className="py-20 relative"
      >
        {/* Glassmorphism container */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/10 backdrop-blur-sm"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '10K+', label: 'Active Users', icon: '👥' },
              { value: '5K+', label: 'Cars Listed', icon: '🚗' },
              { value: '1K+', label: 'Sold Monthly', icon: '✅' },
              { value: '100%', label: 'Verified', icon: '🛡️' },
            ].map((stat, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/10 hover:border-primary-500/50 hover:bg-black/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-600/20"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <h3 className="text-5xl md:text-6xl font-black text-gradient-red mb-3">
                  {stat.value}
                </h3>
                <p className="text-gray-300 font-medium text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      {loading ? (
        <section className="py-24 relative">
          <LoadingSpinner label="Loading featured cars..." />
        </section>
      ) : featuredCars.length > 0 && (
        <section
          ref={featuredRef}
          className="py-24 relative"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Chip
                size="lg"
                className="bg-primary-600/10 backdrop-blur-xl border border-primary-500/30 text-primary-400 font-bold px-6 py-2 mb-6"
              >
                FEATURED VEHICLES
              </Chip>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Premium <span className="text-gradient-red">Selection</span>
              </h2>
              <p className="text-2xl text-gray-300/80 max-w-3xl mx-auto">
                Handpicked vehicles that meet our highest standards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map((car, index) => (
                <div
                  key={car.id}
                  className="opacity-0 animate-fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards'}}
                >
                  <CarCard car={car} onFavoriteChange={fetchFeaturedCars} />
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Button
                size="lg"
                onPress={() => router.push('/cars?is_featured=true')}
                className="bg-white/10 backdrop-blur-xl border-2 border-primary-500/50 text-white hover:bg-primary-600/20 hover:border-primary-500 font-bold px-12 py-7 text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                View All Featured Cars →
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section with glassmorphism cards */}
      <section
        ref={featuresRef}
        className="py-24 relative"
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              Why Choose <span className="text-gradient-red">AutoHub</span>
            </h2>
            <p className="text-2xl text-gray-300/80">Experience the premium difference</p>
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
                className="group p-10 rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/10 hover:border-primary-500/50 hover:bg-black/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-600/20"
              >
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-gradient-red transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300/90 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with dramatic glassmorphism */}
      {!isAuthenticated && (
        <section
          ref={ctaRef}
          className="py-32 relative overflow-hidden"
        >
          {/* Dramatic background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/30 rounded-full blur-[200px] animate-pulse-red"></div>
          </div>

          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/30 backdrop-blur-sm"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                Ready to Find Your
                <span className="block text-gradient-red mt-3 text-glow-red">Perfect Ride?</span>
              </h2>
              <p className="text-2xl text-gray-200/90 mb-14 max-w-3xl mx-auto leading-relaxed">
                Join thousands of car enthusiasts who trust AutoHub for their automotive needs
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button
                  size="lg"
                  onPress={() => router.push('/auth/register')}
                  className="bg-white text-black hover:bg-gray-100 font-bold px-16 py-8 text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  onPress={() => router.push('/cars')}
                  className="bg-white/10 backdrop-blur-xl border-2 border-white/50 text-white hover:bg-white hover:text-black font-bold px-16 py-8 text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
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
