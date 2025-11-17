// ==========================================
// app/seller/cars/new/page.tsx - Create Car Listing
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Progress } from '@heroui/progress';
import {
  ChevronLeft, ChevronRight, Check, Upload, X
} from 'lucide-react';
import { apiService } from '@/services/api';
import { Brand, Model, Category, Feature, CarFormData } from '@/types';
import { useRequireSeller } from '@/contexts/AuthContext';

// Match SQL schema enum values exactly
const FUEL_TYPES = ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'];
const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'];
const CONDITION_RATINGS = ['BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

export default function CreateCarPage() {
  const router = useRouter();
  const { user, canListCars } = useRequireSeller();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageMetadata, setImageMetadata] = useState<{ type: string; isMain: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const IMAGE_TYPES = [
    { value: 'exterior', label: 'Exterior', icon: '🚗' },
    { value: 'interior', label: 'Interior', icon: '🪑' },
    { value: 'engine', label: 'Engine', icon: '⚙️' },
    { value: 'damage', label: 'Damage', icon: '⚠️' },
    { value: 'document', label: 'Documents', icon: '📄' },
    { value: 'other', label: 'Other', icon: '📸' },
  ];

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
    loadFormData();
  }, [canListCars]);

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
    if (files.length + imageFiles.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    setImageFiles(prev => [...prev, ...files]);

    // Initialize metadata for new images
    const newMetadata = files.map((_, index) => ({
      type: 'exterior',
      isMain: imageFiles.length === 0 && index === 0 // First image is main by default
    }));
    setImageMetadata(prev => [...prev, ...newMetadata]);
    setError(null);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageMetadata(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the main image, make the first image main
      if (prev[index]?.isMain && updated.length > 0) {
        updated[0].isMain = true;
      }
      return updated;
    });
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
      case 1: // Basic Info
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

      case 2: // Pricing
        if (!formData.price || formData.price <= 0) {
          setError('Please enter a valid price');
          return false;
        }
        // Maximum price validation - DECIMAL(12,2) limit
        if (formData.price > 9999999999.99) {
          setError('Price cannot exceed ₱9,999,999,999.99 (database limit). Please enter a reasonable price.');
          return false;
        }
        if (formData.original_price && formData.original_price > 9999999999.99) {
          setError('Original price cannot exceed ₱9,999,999,999.99 (database limit).');
          return false;
        }
        break;

      case 3: // Specifications
        if (!formData.mileage || formData.mileage < 0) {
          setError('Please enter valid mileage');
          return false;
        }
        if (!formData.fuel_type || !formData.transmission) {
          setError('Please select fuel type and transmission');
          return false;
        }
        // Color is optional in normalized schema
        break;

      case 4: // Condition
        if (!formData.car_condition) {
          setError('Please select condition rating');
          return false;
        }
        break;

      case 5: // Location
        if (!formData.city_id) {
          setError('Please select your city');
          return false;
        }
        break;

      case 6: // Images
        if (imageFiles.length === 0) {
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
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create the car listing
      const carData: CarFormData = {
        ...formData,
        feature_ids: selectedFeatures,
      } as CarFormData;

      const response = await apiService.createCar(carData);

      if (response.success && response.data) {
        const carId = response.data.id;

        // Upload images with metadata (type and main image flag)
        if (imageFiles.length > 0) {
          await apiService.uploadCarImages(carId, imageFiles, imageMetadata);
        }

        router.push('/seller/dashboard');
      } else {
        // Parse backend validation errors to show helpful messages
        let errorMessage = response.error || 'Failed to create listing';

        // Check if it's a validation error with details
        if (typeof response.error === 'string') {
          if (response.error.includes('price') && response.error.includes('range')) {
            errorMessage = 'Price exceeds the maximum allowed value of ₱9,999,999,999.99. Please enter a reasonable price.';
          } else if (response.error.includes('latitude') || response.error.includes('longitude')) {
            errorMessage = 'Invalid GPS coordinates. Please check your location data.';
          } else if (response.error.includes('required')) {
            errorMessage = 'Please fill in all required fields.';
          }
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      // Handle different types of errors
      let errorMessage = 'An error occurred. Please try again.';

      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;

        // If detail is an array of validation errors
        if (Array.isArray(detail)) {
          const validationErrors = detail.map((e: any) => {
            const field = e.loc ? e.loc[e.loc.length - 1] : 'field';
            return `${field}: ${e.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }

      setError(errorMessage);
      console.error('Error creating car listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 7) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Listing
          </h1>
          <Progress value={progress} className="mb-2" color="primary" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 7
          </p>
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <CardBody>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="p-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Basic Information</h2>

                <Select
                  label="Brand"
                  placeholder="Select brand"
                  selectedKeys={formData.brand_id ? [String(formData.brand_id)] : []}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  isRequired
                >
                  {brands.map(brand => (
                    <SelectItem key={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Model"
                  placeholder="Select model"
                  selectedKeys={formData.model_id ? [String(formData.model_id)] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, model_id: parseInt(e.target.value) }))}
                  isDisabled={!formData.brand_id}
                  isRequired
                >
                  {models.map(model => (
                    <SelectItem key={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Category"
                  placeholder="Select category"
                  selectedKeys={formData.category_id ? [String(formData.category_id)] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                >
                  {categories.map(category => (
                    <SelectItem key={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="number"
                  label="Year"
                  placeholder="2024"
                  value={formData.year ? String(formData.year) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  description={`Valid range: 1900 - ${new Date().getFullYear() + 1}`}
                  isRequired
                  isInvalid={formData.year !== undefined && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)}
                  errorMessage={formData.year !== undefined && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) ? "Year must be between 1900 and next year" : ""}
                />

                <Input
                  label="Listing Title"
                  placeholder="2024 Toyota Fortuner 2.8 V 4x4 AT"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  description="Be specific and descriptive (minimum 10 characters)"
                  isRequired
                  isInvalid={formData.title !== undefined && formData.title.length > 0 && formData.title.length < 10}
                  errorMessage={formData.title !== undefined && formData.title.length > 0 && formData.title.length < 10 ? "Title must be at least 10 characters" : ""}
                />

                <Textarea
                  label="Description"
                  placeholder="Describe your vehicle's condition, features, and history..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  minRows={6}
                />
              </div>
            )}

            {/* Step 2: Pricing */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Pricing</h2>

                <Input
                  type="number"
                  label="Asking Price (PHP)"
                  placeholder="1000000"
                  value={formData.price ? String(formData.price) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  startContent={<span className="text-gray-500">₱</span>}
                  description="Maximum allowed: ₱9,999,999,999.99"
                  isRequired
                  isInvalid={formData.price !== undefined && formData.price > 9999999999.99}
                  errorMessage={formData.price !== undefined && formData.price > 9999999999.99 ? "Price exceeds maximum limit" : ""}
                />

                <Checkbox
                  isSelected={formData.price_negotiable}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, price_negotiable: checked }))}
                >
                  Price is negotiable
                </Checkbox>

                <Checkbox
                  isSelected={formData.financing_available}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, financing_available: checked }))}
                >
                  Financing available
                </Checkbox>

                <Checkbox
                  isSelected={formData.trade_in_accepted}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, trade_in_accepted: checked }))}
                >
                  Accept trade-in
                </Checkbox>

                <Checkbox
                  isSelected={formData.installment_available}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, installment_available: checked }))}
                >
                  Installment available
                </Checkbox>
              </div>
            )}

            {/* Step 3: Specifications */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Specifications</h2>

                <Input
                  type="number"
                  label="Mileage (km)"
                  placeholder="50000"
                  value={formData.mileage ? String(formData.mileage) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mileage: parseInt(e.target.value) }))}
                  description="Current odometer reading in kilometers"
                  isRequired
                  isInvalid={formData.mileage !== undefined && formData.mileage < 0}
                  errorMessage={formData.mileage !== undefined && formData.mileage < 0 ? "Mileage cannot be negative" : ""}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Fuel Type"
                    placeholder="Select fuel type"
                    selectedKeys={formData.fuel_type ? [formData.fuel_type] : []}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuel_type: e.target.value as any }))}
                    isRequired
                  >
                    {FUEL_TYPES.map(type => (
                      <SelectItem key={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Transmission"
                    placeholder="Select transmission"
                    selectedKeys={formData.transmission ? [formData.transmission] : []}
                    onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value as any }))}
                    isRequired
                  >
                    {TRANSMISSIONS.map(type => (
                      <SelectItem key={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Seats"
                    placeholder="5"
                    value={formData.seats ? String(formData.seats) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                  />

                  <Input
                    type="number"
                    label="Doors"
                    placeholder="4"
                    value={formData.doors ? String(formData.doors) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, doors: parseInt(e.target.value) }))}
                  />
                </div>

                {/* TODO: Add color picker from standard_colors table */}
                {/* Color selection using color_id is now handled via normalized schema */}

                <Input
                  label="Engine Size"
                  placeholder="2.8L"
                  value={formData.engine_size || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, engine_size: e.target.value }))}
                />

                <Select
                  label="Drivetrain"
                  placeholder="Select drivetrain"
                  selectedKeys={formData.drivetrain ? [formData.drivetrain] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, drivetrain: e.target.value as any }))}
                >
                  {DRIVETRAINS.map(type => (
                    <SelectItem key={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            {/* Step 4: Condition */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Vehicle Condition</h2>

                <Select
                  label="Overall Condition"
                  placeholder="Select condition"
                  selectedKeys={formData.car_condition ? [formData.car_condition] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, car_condition: e.target.value as any }))}
                  isRequired
                >
                  {CONDITION_RATINGS.map(rating => (
                    <SelectItem key={rating}>
                      {rating.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="number"
                  label="Number of Owners"
                  placeholder="1"
                  value={formData.number_of_owners ? String(formData.number_of_owners) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, number_of_owners: parseInt(e.target.value) }))}
                  isRequired
                />

                <div className="space-y-3">
                  <Checkbox
                    isSelected={formData.accident_history}
                    onValueChange={(checked) => setFormData(prev => ({ ...prev, accident_history: checked }))}
                  >
                    Has accident history
                  </Checkbox>

                  <Checkbox
                    isSelected={formData.flood_history}
                    onValueChange={(checked) => setFormData(prev => ({ ...prev, flood_history: checked }))}
                  >
                    Has flood damage history
                  </Checkbox>

                  <Checkbox
                    isSelected={formData.service_history_available}
                    onValueChange={(checked) => setFormData(prev => ({ ...prev, service_history_available: checked }))}
                  >
                    Service history available
                  </Checkbox>

                  <Checkbox
                    isSelected={formData.casa_maintained}
                    onValueChange={(checked) => setFormData(prev => ({ ...prev, casa_maintained: checked }))}
                  >
                    Casa maintained
                  </Checkbox>

                  <Checkbox
                    isSelected={formData.warranty_remaining}
                    onValueChange={(checked) => setFormData(prev => ({ ...prev, warranty_remaining: checked }))}
                  >
                    Warranty remaining
                  </Checkbox>
                </div>
              </div>
            )}

            {/* Step 5: Location */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Location</h2>

                <Select
                  label="City/Municipality"
                  placeholder="Select your city"
                  selectedKeys={formData.city_id ? [String(formData.city_id)] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, city_id: parseInt(e.target.value) }))}
                  isRequired
                >
                  {cities.slice(0, 100).map(city => (
                    <SelectItem key={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="Barangay"
                  placeholder="Barangay name"
                  value={formData.barangay || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barangay: e.target.value }))}
                />

                <Textarea
                  label="Detailed Address"
                  placeholder="Street, building, landmarks..."
                  value={formData.detailed_address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, detailed_address: e.target.value }))}
                  minRows={3}
                />
              </div>
            )}

            {/* Step 6: Images */}
            {step === 6 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Upload Images</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload up to 10 high-quality images of your vehicle
                </p>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
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
                    <Upload className="text-gray-400 mb-2" size={48} />
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      Click to upload images
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      PNG, JPG up to 10MB each
                    </span>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} uploaded. Click on an image to set it as main or change its category.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {imageFiles.map((file, index) => {
                        const metadata = imageMetadata[index] || { type: 'exterior', isMain: false };
                        const imageType = IMAGE_TYPES.find(t => t.value === metadata.type) || IMAGE_TYPES[0];

                        return (
                          <div
                            key={index}
                            className={`relative border-2 rounded-lg p-3 transition-all ${
                              metadata.isMain
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex gap-3">
                              {/* Image Preview */}
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
                                  <X size={14} />
                                </button>
                                {metadata.isMain && (
                                  <Chip
                                    size="sm"
                                    color="primary"
                                    className="absolute bottom-2 left-2"
                                    startContent={<Check size={12} />}
                                  >
                                    Main Photo
                                  </Chip>
                                )}
                              </div>

                              {/* Controls */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                                    Image Category
                                  </label>
                                  <Select
                                    size="sm"
                                    selectedKeys={[metadata.type]}
                                    onChange={(e) => setImageType(index, e.target.value)}
                                    className="max-w-full"
                                    startContent={<span className="text-lg">{imageType.icon}</span>}
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
                                </div>

                                {!metadata.isMain && (
                                  <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => setMainImage(index)}
                                    fullWidth
                                    startContent={<Check size={16} />}
                                  >
                                    Set as Main Photo
                                  </Button>
                                )}

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {file.name} • {(file.size / 1024 / 1024).toFixed(2)}MB
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
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Features & Amenities</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select all features that apply to your vehicle
                </p>

                <div className="space-y-6">
                  {['safety', 'comfort', 'entertainment', 'technology'].map(category => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 capitalize">
                        {category}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {features
                          .filter(f => f.category === category)
                          .map(feature => (
                            <Chip
                              key={feature.id}
                              variant={selectedFeatures.includes(feature.id) ? 'solid' : 'bordered'}
                              color={selectedFeatures.includes(feature.id) ? 'primary' : 'default'}
                              onClick={() => toggleFeature(feature.id)}
                              className="cursor-pointer"
                            >
                              {feature.name}
                            </Chip>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>

          <CardFooter className="flex justify-between">
            <Button
              variant="flat"
              onPress={handleBack}
              isDisabled={step === 1 || loading}
              startContent={<ChevronLeft size={20} />}
            >
              Back
            </Button>

            {step < 7 ? (
              <Button
                color="primary"
                onPress={handleNext}
                endContent={<ChevronRight size={20} />}
              >
                Next
              </Button>
            ) : (
              <Button
                color="success"
                onPress={handleSubmit}
                isLoading={loading}
                startContent={<Check size={20} />}
              >
                Create Listing
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}