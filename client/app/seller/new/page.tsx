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
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CarFormData>>({
    negotiable: true,
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
    setError(null);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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
        if (!formData.exterior_color) {
          setError('Please enter exterior color');
          return false;
        }
        break;

      case 4: // Condition
        if (!formData.condition_rating) {
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

        // Upload images
        if (imageFiles.length > 0) {
          await apiService.uploadCarImages(carId, imageFiles);
        }

        router.push('/seller/dashboard');
      } else {
        setError(response.error || 'Failed to create listing');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
                    <SelectItem key={brand.id} value={String(brand.id)}>
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
                    <SelectItem key={model.id} value={String(model.id)}>
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
                    <SelectItem key={category.id} value={String(category.id)}>
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
                  isRequired
                />

                <Input
                  label="Listing Title"
                  placeholder="2024 Toyota Fortuner 2.8 V 4x4 AT"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  description="Be specific and descriptive"
                  isRequired
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
                  isRequired
                />

                <Checkbox
                  isSelected={formData.negotiable}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, negotiable: checked }))}
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
                  isRequired
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
                      <SelectItem key={type} value={type}>
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
                      <SelectItem key={type} value={type}>
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

                <Input
                  label="Exterior Color"
                  placeholder="White Pearl"
                  value={formData.exterior_color || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, exterior_color: e.target.value }))}
                  isRequired
                />

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
                    <SelectItem key={type} value={type}>
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
                  selectedKeys={formData.condition_rating ? [formData.condition_rating] : []}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition_rating: e.target.value as any }))}
                  isRequired
                >
                  {CONDITION_RATINGS.map(rating => (
                    <SelectItem key={rating} value={rating}>
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
                    <SelectItem key={city.id} value={String(city.id)}>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        {index === 0 && (
                          <Chip
                            size="sm"
                            color="primary"
                            className="absolute bottom-2 left-2"
                          >
                            Primary
                          </Chip>
                        )}
                      </div>
                    ))}
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