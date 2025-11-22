// ==========================================
// app/seller/cars/[id]/edit/page.tsx - Edit Car Listing
// ==========================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Progress } from '@heroui/progress';
import {
  ChevronLeft, ChevronRight, Check, Upload, X, AlertCircle,
  Car, DollarSign, Settings, MapPin, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Brand, Model, Category, Feature, CarFormData, Car as CarType } from '@/types';
import { useRequireSeller } from '@/contexts/AuthContext';
import SellerLayout from '@/components/seller/SellerLayout';

// Match SQL schema enum values exactly
const FUEL_TYPES = ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'];
const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'];
const CONDITION_RATINGS = ['BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

const STEPS = [
  { number: 1, title: 'Basic Info', icon: Car, description: 'Vehicle details' },
  { number: 2, title: 'Pricing', icon: DollarSign, description: 'Set your price' },
  { number: 3, title: 'Specifications', icon: Settings, description: 'Technical details' },
  { number: 4, title: 'Condition', icon: AlertCircle, description: 'Vehicle condition' },
  { number: 5, title: 'Location', icon: MapPin, description: 'Where is it?' },
  { number: 6, title: 'Images', icon: ImageIcon, description: 'Upload photos' },
  { number: 7, title: 'Features', icon: Sparkles, description: 'Amenities' },
];

const IMAGE_TYPES = [
  { value: 'exterior', label: 'Exterior', icon: '🚗' },
  { value: 'interior', label: 'Interior', icon: '🪑' },
  { value: 'engine', label: 'Engine', icon: '⚙️' },
  { value: 'damage', label: 'Damage', icon: '⚠️' },
  { value: 'document', label: 'Documents', icon: '📄' },
  { value: 'other', label: 'Other', icon: '📸' },
];

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const carId = parseInt(params.id as string);
  const { user, canListCars } = useRequireSeller();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [car, setCar] = useState<CarType | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageMetadata, setImageMetadata] = useState<{ type: string; isMain: boolean }[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CarFormData>>({
    price_negotiable: true,
    accident_history: false,
    flood_history: false,
    number_of_owners: 1,
    service_history_available: false,
    registration_status: 'registered',
    or_cr_status: 'complete',
    lto_registered: true,
    deed_of_sale_available: true,
    casa_maintained: false,
    insurance_status: 'none',
    warranty_remaining: false,
    financing_available: false,
    trade_in_accepted: false,
    installment_available: false,
  });

  useEffect(() => {
    if (!canListCars) {
      router.push('/seller/dashboard');
      return;
    }
    loadCarData();
    loadFormData();
  }, [canListCars, carId]);

  const loadCarData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCar(carId);

      if (response.success && response.data) {
        const carData = response.data;
        setCar(carData);

        // Pre-fill form data
        setFormData({
          brand_id: carData.brand?.id,
          model_id: carData.model?.id,
          year: carData.year,
          trim: carData.trim || '',
          title: carData.title,
          description: carData.description || '',
          price: carData.price,
          original_price: carData.original_price || undefined,
          price_negotiable: carData.price_negotiable ?? true,
          mileage: carData.mileage,
          engine_size: carData.engine_size || '',
          fuel_type: carData.fuel_type,
          transmission: carData.transmission,
          drivetrain: carData.drivetrain || '',
          seats: carData.seats || undefined,
          doors: carData.doors || undefined,
          car_condition: carData.car_condition,
          accident_history: carData.accident_history ?? false,
          flood_history: carData.flood_history ?? false,
          service_history_available: carData.service_history_available ?? false,
          casa_maintained: carData.casa_maintained ?? false,
          lto_registered: carData.lto_registered ?? true,
          deed_of_sale_available: carData.deed_of_sale_available ?? true,
          number_of_owners: carData.number_of_owners || 1,
          city_id: carData.city?.id,
          barangay: carData.barangay || '',
          detailed_address: carData.detailed_address || '',
          financing_available: carData.financing_available ?? false,
          trade_in_accepted: carData.trade_in_accepted ?? false,
          installment_available: carData.installment_available ?? false,
          registration_status: carData.registration_status || 'registered',
          or_cr_status: carData.or_cr_status || 'complete',
          insurance_status: carData.insurance_status || 'none',
          warranty_remaining: carData.warranty_remaining ?? false,
        });

        // Load models if brand is selected
        if (carData.brand?.id) {
          loadModels(carData.brand.id);
        }

        // Set selected features
        if (carData.features && Array.isArray(carData.features)) {
          setSelectedFeatures(carData.features.map(f => f.id));
        }

        // Set existing images
        if (carData.images && Array.isArray(carData.images)) {
          setExistingImages(carData.images);
        }
      } else {
        setError('Failed to load car data');
        setTimeout(() => router.push('/seller/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Error loading car:', error);
      setError('Failed to load car data');
      setTimeout(() => router.push('/seller/dashboard'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [brandsRes, categoriesRes, featuresRes, citiesRes] = await Promise.all([
        apiService.getBrands(true),
        apiService.getCategories(),
        apiService.getFeatures(),
        apiService.getCities(),
      ]);

      if (brandsRes.success && brandsRes.data) setBrands(brandsRes.data);
      if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
      if (featuresRes.success && featuresRes.data) setFeatures(featuresRes.data);
      if (citiesRes.success && citiesRes.data) setCities(citiesRes.data);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const loadModels = async (brandId: number) => {
    try {
      const response = await apiService.getModels(brandId, true);
      if (response.success && response.data) {
        setModels(response.data);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleBrandChange = (brandId: string) => {
    const id = parseInt(brandId);
    setFormData(prev => ({ ...prev, brand_id: id, model_id: undefined }));
    setModels([]);
    if (id) loadModels(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;

    if (totalImages > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setImageFiles(prev => [...prev, ...files]);

    const newMetadata = files.map((_, index) => ({
      type: 'exterior',
      isMain: existingImages.length === 0 && imageFiles.length === 0 && index === 0
    }));
    setImageMetadata(prev => [...prev, ...newMetadata]);
    setError(null);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageMetadata(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index]?.isMain && updated.length > 0 && existingImages.length === 0) {
        updated[0].isMain = true;
      }
      return updated;
    });
  };

  const removeExistingImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await apiService.deleteCarImage(carId, imageId);
      if (response.success) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  const setMainImage = (index: number) => {
    setImageMetadata(prev =>
      prev.map((meta, i) => ({
        ...meta,
        isMain: i === index
      }))
    );
  };

  const setImageType = (index: number, type: string) => {
    setImageMetadata(prev =>
      prev.map((meta, i) =>
        i === index ? { ...meta, type } : meta
      )
    );
  };

  const toggleFeature = (featureId: number) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);

    switch (currentStep) {
      case 1:
        if (!formData.brand_id || !formData.model_id || !formData.year) {
          setError('Please fill in all required basic information');
          return false;
        }
        if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
          setError('Please enter a valid year');
          return false;
        }
        if (!formData.title || formData.title.length < 10) {
          setError('Title must be at least 10 characters');
          return false;
        }
        break;

      case 2:
        if (!formData.price || formData.price <= 0) {
          setError('Please enter a valid price');
          return false;
        }
        if (formData.price > 9999999999.99) {
          setError('Price cannot exceed ₱9,999,999,999.99');
          return false;
        }
        break;

      case 3:
        if (!formData.mileage || formData.mileage < 0) {
          setError('Please enter valid mileage');
          return false;
        }
        if (!formData.fuel_type || !formData.transmission) {
          setError('Please select fuel type and transmission');
          return false;
        }
        break;

      case 4:
        if (!formData.car_condition) {
          setError('Please select condition rating');
          return false;
        }
        break;

      case 5:
        if (!formData.city_id) {
          setError('Please select your city');
          return false;
        }
        break;

      case 6:
        if (existingImages.length === 0 && imageFiles.length === 0) {
          setError('Please upload at least one image');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const carData: CarFormData = {
        ...formData,
        feature_ids: selectedFeatures,
      } as CarFormData;

      const response = await apiService.updateCar(carId, carData);

      if (response.success && response.data) {
        if (imageFiles.length > 0) {
          await apiService.uploadCarImages(carId, imageFiles, imageMetadata);
        }

        router.push('/seller/dashboard');
      } else {
        let errorMessage = response.error || 'Failed to update listing';

        if (typeof response.error === 'string') {
          if (response.error.includes('price') && response.error.includes('range')) {
            errorMessage = 'Price exceeds the maximum allowed value';
          } else if (response.error.includes('required')) {
            errorMessage = 'Please fill in all required fields';
          }
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" color="primary" label="Loading car data..." />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 text-gradient-red">
            Edit Listing
          </h1>
          <p className="text-gray-400">
            Step {step} of {STEPS.length}: {STEPS[step - 1].title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress
            value={progress}
            className="h-2"
            classNames={{
              indicator: "bg-gradient-red-dark"
            }}
          />

          {/* Step Indicators */}
          <div className="grid grid-cols-7 gap-2 mt-6">
            {STEPS.map((s) => {
              const StepIcon = s.icon;
              const isComplete = step > s.number;
              const isCurrent = step === s.number;

              return (
                <div
                  key={s.number}
                  className={`text-center transition-all ${
                    isCurrent ? 'scale-110' : ''
                  }`}
                >
                  <div
                    className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isComplete
                        ? 'bg-green-600 shadow-lg shadow-green-500/50'
                        : isCurrent
                        ? 'bg-gradient-red-dark shadow-lg shadow-red-500/50'
                        : 'bg-black/40 border-2 border-gray-700'
                    }`}
                  >
                    {isComplete ? (
                      <Check size={24} className="text-white" />
                    ) : (
                      <StepIcon size={20} className={isCurrent ? 'text-white' : 'text-gray-500'} />
                    )}
                  </div>
                  <p className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                    {s.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg flex items-start gap-3 backdrop-blur-md">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-200 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Main Form Card */}
        <Card className="bg-black/40 backdrop-blur-xl border-2 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-red-dark flex items-center justify-center">
                {React.createElement(STEPS[step - 1].icon, { size: 20, className: 'text-white' })}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{STEPS[step - 1].title}</h2>
                <p className="text-sm text-gray-400">{STEPS[step - 1].description}</p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Brand *"
                    placeholder="Select brand"
                    selectedKeys={formData.brand_id ? [formData.brand_id.toString()] : []}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    classNames={{
                      trigger: "bg-black/40 backdrop-blur-sm border-gray-700 data-[hover=true]:border-primary-500",
                      label: "text-white font-semibold",
                      value: "text-white"
                    }}
                  >
                    {brands.map((brand) => (
                      <SelectItem key={brand.id.toString()} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Model *"
                    placeholder="Select model"
                    selectedKeys={formData.model_id ? [formData.model_id.toString()] : []}
                    onChange={(e) => setFormData(prev => ({ ...prev, model_id: parseInt(e.target.value) }))}
                    isDisabled={!formData.brand_id}
                    classNames={{
                      trigger: "bg-black/40 backdrop-blur-sm border-gray-700 data-[hover=true]:border-primary-500",
                      label: "text-white font-semibold",
                      value: "text-white"
                    }}
                  >
                    {models.map((model) => (
                      <SelectItem key={model.id.toString()} value={model.id.toString()}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Year *"
                    placeholder="2024"
                    value={formData.year?.toString() || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700 data-[hover=true]:border-primary-500",
                      label: "text-white font-semibold"
                    }}
                  />

                  <Input
                    label="Trim (Optional)"
                    placeholder="EX, LX, Sport"
                    value={formData.trim || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, trim: e.target.value }))}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700 data-[hover=true]:border-primary-500",
                      label: "text-white font-semibold"
                    }}
                  />
                </div>

                <Input
                  label="Listing Title *"
                  placeholder="2024 Honda Civic EX - Low Mileage, Excellent Condition"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  description="Minimum 10 characters"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700 data-[hover=true]:border-primary-500",
                    label: "text-white font-semibold",
                    description: "text-gray-500"
                  }}
                />

                <Textarea
                  label="Description"
                  placeholder="Describe your vehicle in detail..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  minRows={4}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700 data-[hover=true]:border-primary-500",
                    label: "text-white font-semibold"
                  }}
                />
              </div>
            )}

            {/* Step 2: Pricing */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-primary-900/30 to-primary-800/20 border-2 border-primary-700/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-primary-400" />
                    Pricing Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="number"
                      label="Price (₱) *"
                      placeholder="500000"
                      value={formData.price?.toString() || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      startContent={<span className="text-gray-400">₱</span>}
                      classNames={{
                        input: "text-white text-xl font-bold",
                        inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                        label: "text-white font-semibold"
                      }}
                    />

                    <Input
                      type="number"
                      label="Original Price (Optional)"
                      placeholder="550000"
                      value={formData.original_price?.toString() || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) }))}
                      startContent={<span className="text-gray-400">₱</span>}
                      description="For showing discounts"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                        label: "text-white font-semibold",
                        description: "text-gray-500"
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Payment Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Checkbox
                      isSelected={formData.price_negotiable}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, price_negotiable: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Price Negotiable
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.financing_available}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, financing_available: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Financing Available
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.trade_in_accepted}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, trade_in_accepted: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Trade-In Accepted
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.installment_available}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, installment_available: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Installment Available
                    </Checkbox>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Specifications */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Mileage *"
                    placeholder="50000"
                    value={formData.mileage?.toString() || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, mileage: parseInt(e.target.value) }))}
                    endContent={<span className="text-gray-400">KM</span>}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold"
                    }}
                  />

                  <Input
                    label="Engine Size"
                    placeholder="2.0L"
                    value={formData.engine_size || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, engine_size: e.target.value }))}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold"
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Fuel Type *"
                    placeholder="Select fuel type"
                    selectedKeys={formData.fuel_type ? [formData.fuel_type] : []}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
                    classNames={{
                      trigger: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold",
                      value: "text-white"
                    }}
                  >
                    {FUEL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Transmission *"
                    placeholder="Select transmission"
                    selectedKeys={formData.transmission ? [formData.transmission] : []}
                    onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value }))}
                    classNames={{
                      trigger: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold",
                      value: "text-white"
                    }}
                  >
                    {TRANSMISSIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select
                    label="Drivetrain"
                    placeholder="Select drivetrain"
                    selectedKeys={formData.drivetrain ? [formData.drivetrain] : []}
                    onChange={(e) => setFormData(prev => ({ ...prev, drivetrain: e.target.value }))}
                    classNames={{
                      trigger: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold",
                      value: "text-white"
                    }}
                  >
                    {DRIVETRAINS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    type="number"
                    label="Seats"
                    placeholder="5"
                    value={formData.seats?.toString() || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold"
                    }}
                  />

                  <Input
                    type="number"
                    label="Doors"
                    placeholder="4"
                    value={formData.doors?.toString() || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, doors: parseInt(e.target.value) }))}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Condition */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-4">Condition Rating *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CONDITION_RATINGS.map((rating) => (
                      <div
                        key={rating}
                        onClick={() => setFormData(prev => ({ ...prev, car_condition: rating }))}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                          formData.car_condition === rating
                            ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/20'
                            : 'border-gray-700 bg-black/30 hover:border-gray-600'
                        }`}
                      >
                        <p className={`font-semibold ${
                          formData.car_condition === rating ? 'text-primary-400' : 'text-white'
                        }`}>
                          {rating.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">History & Documentation</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Checkbox
                      isSelected={formData.accident_history}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, accident_history: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Has Accident History
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.flood_history}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, flood_history: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Has Flood History
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.service_history_available}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, service_history_available: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Service History Available
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.casa_maintained}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, casa_maintained: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      CASA Maintained
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.lto_registered}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, lto_registered: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      LTO Registered
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.deed_of_sale_available}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, deed_of_sale_available: val }))}
                      classNames={{ label: "text-white" }}
                    >
                      Deed of Sale Available
                    </Checkbox>
                  </div>

                  <Input
                    type="number"
                    label="Number of Previous Owners"
                    value={formData.number_of_owners?.toString() || '1'}
                    onChange={(e) => setFormData(prev => ({ ...prev, number_of_owners: parseInt(e.target.value) }))}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                      label: "text-white font-semibold"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Location */}
            {step === 5 && (
              <div className="space-y-6">
                <Select
                  label="City *"
                  placeholder="Select your city"
                  selectedKeys={formData.city_id ? [formData.city_id.toString()] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, city_id: parseInt(e.target.value) }))}
                  classNames={{
                    trigger: "bg-black/40 backdrop-blur-sm border-gray-700",
                    label: "text-white font-semibold",
                    value: "text-white"
                  }}
                >
                  {cities.map((city) => (
                    <SelectItem key={city.id.toString()} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="Barangay"
                  placeholder="Barangay name"
                  value={formData.barangay || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barangay: e.target.value }))}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                    label: "text-white font-semibold"
                  }}
                />

                <Textarea
                  label="Detailed Address"
                  placeholder="Street, building, landmarks..."
                  value={formData.detailed_address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, detailed_address: e.target.value }))}
                  minRows={3}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-black/40 backdrop-blur-sm border-gray-700",
                    label: "text-white font-semibold"
                  }}
                />
              </div>
            )}

            {/* Step 6: Images */}
            {step === 6 && (
              <div className="space-y-6">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Current Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {existingImages.map((image, index) => (
                        <div
                          key={image.id}
                          className="relative border-2 border-gray-700 bg-black/30 rounded-xl p-3"
                        >
                          <div className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={getImageUrl(image.image_url)}
                                alt={`Car image ${index + 1}`}
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(image.id)}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <X size={16} />
                              </button>
                              {car?.main_image === image.image_url && (
                                <Chip
                                  size="sm"
                                  color="primary"
                                  className="absolute bottom-2 left-2"
                                  startContent={<Check size={12} />}
                                >
                                  Main
                                </Chip>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{image.image_type || 'exterior'}</p>
                              <p className="text-xs text-gray-500">Existing image</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center bg-black/20 hover:border-primary-500 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-red-dark flex items-center justify-center mb-4">
                      <Upload className="text-white" size={32} />
                    </div>
                    <span className="text-xl font-bold text-white mb-2">
                      Upload Additional Images
                    </span>
                    <span className="text-sm text-gray-400 mb-1">
                      Click to select or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG up to 10MB each • Maximum 10 images total
                    </span>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold">
                        {imageFiles.length} new image{imageFiles.length !== 1 ? 's' : ''} to upload
                      </p>
                      <Chip color="primary" variant="flat">
                        Select Main Photo
                      </Chip>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {imageFiles.map((file, index) => {
                        const metadata = imageMetadata[index] || { type: 'exterior', isMain: false };
                        const imageType = IMAGE_TYPES.find(t => t.value === metadata.type) || IMAGE_TYPES[0];

                        return (
                          <div
                            key={index}
                            className={`relative border-2 rounded-xl p-3 transition-all ${
                              metadata.isMain
                                ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                                : 'border-gray-700 bg-black/30 hover:border-gray-600'
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-32 h-32 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <X size={16} />
                                </button>
                                {metadata.isMain && (
                                  <Chip
                                    size="sm"
                                    color="primary"
                                    className="absolute bottom-2 left-2"
                                    startContent={<Check size={12} />}
                                  >
                                    Main
                                  </Chip>
                                )}
                              </div>

                              <div className="flex-1 space-y-3">
                                <Select
                                  size="sm"
                                  selectedKeys={[metadata.type]}
                                  onChange={(e) => setImageType(index, e.target.value)}
                                  startContent={<span className="text-lg">{imageType.icon}</span>}
                                  classNames={{
                                    trigger: "bg-black/40 border-gray-700",
                                    value: "text-white"
                                  }}
                                >
                                  {IMAGE_TYPES.map(type => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                      startContent={<span className="text-lg">{type.icon}</span>}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </Select>

                                {!metadata.isMain && existingImages.length === 0 && (
                                  <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => setMainImage(index)}
                                    fullWidth
                                  >
                                    Set as Main
                                  </Button>
                                )}

                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)}MB
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 7: Features */}
            {step === 7 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Selected Features: {selectedFeatures.length}
                  </h3>
                  {selectedFeatures.length > 0 && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => setSelectedFeatures([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Group features by category dynamically */}
                {Array.from(new Set(features.map(f => f.category?.toUpperCase()))).filter(Boolean).sort().map(category => {
                  const categoryFeatures = features.filter(f => f.category?.toUpperCase() === category);
                  if (categoryFeatures.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="text-md font-semibold text-primary-400 capitalize flex items-center gap-2">
                        <Sparkles size={18} />
                        {category?.toLowerCase()}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryFeatures.map(feature => {
                          const isSelected = selectedFeatures.includes(feature.id);

                          return (
                            <div
                              key={feature.id}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-500/20 shadow-md shadow-primary-500/20'
                                  : 'border-gray-700 bg-black/30 hover:border-gray-600 hover:bg-black/40'
                              }`}
                            >
                              <Checkbox
                                isSelected={isSelected}
                                onValueChange={() => toggleFeature(feature.id)}
                                classNames={{
                                  base: "w-full max-w-full",
                                  label: `w-full ${isSelected ? 'text-white font-medium' : 'text-gray-300'}`
                                }}
                              >
                                {feature.name}
                              </Checkbox>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {features.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No features available</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>

          <CardFooter className="border-t border-gray-700 bg-black/20 p-6">
            <div className="flex justify-between w-full gap-4">
              <Button
                size="lg"
                variant="flat"
                onPress={handleBack}
                isDisabled={step === 1 || saving}
                startContent={<ChevronLeft size={20} />}
                className="bg-black/40 hover:bg-black/60"
              >
                Back
              </Button>

              {step < 7 ? (
                <Button
                  size="lg"
                  color="primary"
                  onPress={handleNext}
                  endContent={<ChevronRight size={20} />}
                  className="bg-gradient-red-dark shadow-lg shadow-red-500/20"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  size="lg"
                  color="success"
                  onPress={handleSubmit}
                  isLoading={saving}
                  startContent={!saving && <Check size={20} />}
                  className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
                >
                  {saving ? 'Updating Listing...' : 'Update Listing'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </SellerLayout>
  );
}
