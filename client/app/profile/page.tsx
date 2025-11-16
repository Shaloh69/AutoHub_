// ==========================================
// app/profile/page.tsx - User Profile Management
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Tabs, Tab } from '@heroui/tabs';
import {
  User, Mail, Phone, MapPin, Shield, Star,
  Upload, Check, X, AlertCircle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser, refreshUser } = useRequireAuth();

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    bio: '',
    city_id: undefined as number | undefined,
    business_name: '',
    business_address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number || '',
        bio: user.bio || '',
        city_id: user.city_id,
        business_name: user.business_name || '',
        business_address: user.business_address || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await apiService.getCities();
      if (response.success && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateUser(formData);

      if (response.success) {
        setSuccess(true);
        setEditMode(false);
        await refreshUser();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number || '',
        bio: user.bio || '',
        city_id: user.city_id,
        business_name: user.business_name || '',
        business_address: user.business_address || '',
      });
    }
    setEditMode(false);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const response = await apiService.uploadProfileImage(file);

      if (response.success) {
        await refreshUser();
      } else {
        setError(response.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardBody>
              <div className="flex items-center gap-3">
                <Check size={24} className="text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200">
                  Profile updated successfully!
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <CardBody>
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardBody className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto overflow-hidden">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `${user.first_name[0]}${user.last_name[0]}`
                  )}
                </div>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700"
                >
                  <Upload size={16} />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {user.email}
              </p>

              <Chip
                color="primary"
                variant="flat"
                className="capitalize mb-4"
              >
                {user.role}
              </Chip>

              {/* Verification Status */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </span>
                  {user.email_verified ? (
                    <Chip size="sm" color="success" variant="flat">
                      <Check size={12} className="inline mr-1" />
                      Verified
                    </Chip>
                  ) : (
                    <Chip size="sm" color="warning" variant="flat">
                      <X size={12} className="inline mr-1" />
                      Unverified
                    </Chip>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm flex items-center gap-2">
                    <Phone size={16} />
                    Phone
                  </span>
                  {user.phone_verified ? (
                    <Chip size="sm" color="success" variant="flat">
                      <Check size={12} className="inline mr-1" />
                      Verified
                    </Chip>
                  ) : (
                    <Chip size="sm" color="warning" variant="flat">
                      <X size={12} className="inline mr-1" />
                      Unverified
                    </Chip>
                  )}
                </div>

                {user.identity_verified && (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm flex items-center gap-2">
                      <Shield size={16} />
                      Identity
                    </span>
                    <Chip size="sm" color="success" variant="flat">
                      <Check size={12} className="inline mr-1" />
                      Verified
                    </Chip>
                  </div>
                )}
              </div>

              {/* Stats */}
              {(user.role?.toUpperCase() === 'SELLER' || user.role?.toUpperCase() === 'DEALER') && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.total_listings}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Listings
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                        <Star size={20} className="text-yellow-500" fill="currentColor" />
                        {user.average_rating?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Rating
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Profile Information</h2>
                {!editMode ? (
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="flat"
                      onPress={handleCancel}
                      isDisabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleSave}
                      isLoading={loading}
                      startContent={<Check size={18} />}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardBody className="space-y-4">
                <Tabs>
                  <Tab key="personal" title="Personal Info">
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          isDisabled={!editMode}
                          startContent={<User size={18} className="text-gray-400" />}
                        />
                        <Input
                          label="Last Name"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                          isDisabled={!editMode}
                          startContent={<User size={18} className="text-gray-400" />}
                        />
                      </div>

                      <Input
                        label="Email"
                        value={user.email}
                        isDisabled
                        startContent={<Mail size={18} className="text-gray-400" />}
                      />

                      <Input
                        label="Phone Number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        isDisabled={!editMode}
                        startContent={<Phone size={18} className="text-gray-400" />}
                      />

                      <Select
                        label="City"
                        selectedKeys={formData.city_id ? [String(formData.city_id)] : []}
                        onChange={(e) => setFormData(prev => ({ ...prev, city_id: parseInt(e.target.value) }))}
                        isDisabled={!editMode}
                      >
                        {cities.slice(0, 100).map(city => (
                          <SelectItem key={city.id} value={String(city.id)}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </Select>

                      <Textarea
                        label="Bio"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        isDisabled={!editMode}
                        minRows={4}
                      />
                    </div>
                  </Tab>

                  {(user.role?.toUpperCase() === 'DEALER') && (
                    <Tab key="business" title="Business Info">
                      <div className="space-y-4 pt-4">
                        <Input
                          label="Business Name"
                          value={formData.business_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                          isDisabled={!editMode}
                        />

                        <Textarea
                          label="Business Address"
                          value={formData.business_address}
                          onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                          isDisabled={!editMode}
                          minRows={3}
                        />

                        {user.business_verified ? (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield size={24} className="text-green-600 dark:text-green-400" />
                              <div>
                                <p className="font-semibold text-green-800 dark:text-green-200">
                                  Business Verified
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  Your business has been verified by AutoHub
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400" />
                              <div>
                                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                                  Business Not Verified
                                </p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                  Submit verification documents to get verified
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Tab>
                  )}
                </Tabs>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}