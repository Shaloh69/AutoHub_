// app/cars/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { useParams, useRouter } from 'next/navigation';
import { apiService, Car } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CarDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCarDetails();
      fetchSimilarCars();
    }
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCarById(id as string);
      
      if (response.success && !Array.isArray(response.data)) {
        setCar(response.data!);
      } else {
        throw new Error('Car not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarCars = async () => {
    try {
      const response = await apiService.getSimilarCars(id as string);
      if (response.success && Array.isArray(response.data)) {
        setSimilarCars(response.data);
      }
    } catch (err) {
      console.error('Failed to load similar cars:', err);
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // In a real app, this would open a contact modal or redirect to messaging
    alert('Contact seller functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-danger text-lg mb-4">{error || 'Car not found'}</p>
          <Button color="primary" onPress={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="light"
        onPress={() => router.back()}
      >
        ← Back to Listings
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardBody className="p-0">
              <div className="relative">
                <Image
                  src={car.images[currentImageIndex] || '/placeholder-car.jpg'}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="w-full h-96 object-cover"
                  radius="none"
                />
                
                {car.images.length > 1 && (
                  <>
                    <Button
                      isIconOnly
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      variant="solid"
                      color="default"
                      onPress={() => setCurrentImageIndex(prev => 
                        prev === 0 ? car.images.length - 1 : prev - 1
                      )}
                    >
                      ←
                    </Button>
                    <Button
                      isIconOnly
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      variant="solid"
                      color="default"
                      onPress={() => setCurrentImageIndex(prev => 
                        prev === car.images.length - 1 ? 0 : prev + 1
                      )}
                    >
                      →
                    </Button>
                  </>
                )}
                
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {car.images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
              
              {car.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {car.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`View ${index + 1}`}
                      className={`w-20 h-16 object-cover cursor-pointer border-2 transition-colors ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Car Details */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start w-full">
                <div>
                  <h1 className="text-3xl font-bold">
                    {car.year} {car.make} {car.model}
                  </h1>
                  <p className="text-default-600">{car.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(car.price)}
                  </p>
                  <Chip
                    color={car.condition === 'NEW' ? 'success' : car.condition === 'CERTIFIED' ? 'primary' : 'default'}
                  >
                    {car.condition === 'CERTIFIED' ? 'Certified Pre-Owned' : car.condition}
                  </Chip>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Key Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">Mileage</p>
                  <p className="font-semibold">{new Intl.NumberFormat().format(car.mileage)} mi</p>
                </div>
                <div className="text-center p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">Body Type</p>
                  <p className="font-semibold">{car.bodyType}</p>
                </div>
                <div className="text-center p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">Fuel Type</p>
                  <p className="font-semibold">{car.fuelType}</p>
                </div>
                <div className="text-center p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">Transmission</p>
                  <p className="font-semibold">{car.transmission}</p>
                </div>
              </div>

              <Divider />

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-default-700 leading-relaxed">{car.description}</p>
              </div>

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {car.features.map((feature, index) => (
                        <Chip key={index} variant="flat" size="sm">
                          {feature}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-lg font-semibold">Interested in this car?</h3>
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={handleContactSeller}
              >
                Contact Seller
              </Button>
              <div className="text-sm text-default-600 space-y-1">
                <p>Listed by: {car.user?.firstName} {car.user?.lastName}</p>
                <p>Listed on: {new Date(car.createdAt).toLocaleDateString()}</p>
              </div>
            </CardBody>
          </Card>

          {/* Similar Cars */}
          {similarCars.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Similar Cars</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {similarCars.slice(0, 3).map((similarCar) => (
                  <div
                    key={similarCar.id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-default-100 cursor-pointer transition-colors"
                    onClick={() => router.push(`/cars/${similarCar.id}`)}
                  >
                    <Image
                      src={similarCar.images[0] || '/placeholder-car.jpg'}
                      alt={`${similarCar.year} ${similarCar.make} ${similarCar.model}`}
                      className="w-16 h-12 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {similarCar.year} {similarCar.make} {similarCar.model}
                      </p>
                      <p className="text-primary font-semibold text-sm">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                        }).format(similarCar.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}