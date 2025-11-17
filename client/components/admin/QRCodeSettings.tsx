// components/admin/QRCodeSettings.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { Upload, Save, X } from 'lucide-react';

interface QRCodeSettingsProps {
  apiBaseUrl?: string;
}

export default function QRCodeSettings({ apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1' }: QRCodeSettingsProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/admin/settings/payment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();

      // Find QR code and instructions settings
      const qrSetting = data.find((s: any) => s.setting_key === 'payment_qr_code_image');
      const instrSetting = data.find((s: any) => s.setting_key === 'payment_instructions');

      if (qrSetting) {
        setQrCodeUrl(qrSetting.setting_value);
      }
      if (instrSetting) {
        setInstructions(instrSetting.setting_value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      setError('Please select a PNG or JPEG image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadQRCode = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/admin/settings/qr-code/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setSuccess('QR code uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);

      // Reload settings to get new QR code URL
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveInstructions = async () => {
    if (!instructions.trim()) {
      setError('Instructions cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiBaseUrl}/admin/settings/payment-instructions?instructions=${encodeURIComponent(instructions)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save instructions');
      }

      setSuccess('Payment instructions updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save instructions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
          GCash QR Code Settings
        </h2>
        <p className="text-sm text-autohub-accent1-600">
          Manage the GCash QR code image and payment instructions for subscription payments
        </p>
      </CardHeader>

      <CardBody className="gap-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded">
            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* Current QR Code */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Current GCash QR Code
          </h3>
          {qrCodeUrl ? (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-autohub-primary-200 w-full max-w-sm">
                <div className="relative w-full aspect-square">
                  <Image
                    src={qrCodeUrl}
                    alt="Current GCash QR Code"
                    width={300}
                    height={300}
                    className="w-full h-full object-contain rounded"
                    classNames={{
                      wrapper: "w-full h-full",
                      img: "w-full h-full object-contain"
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-autohub-accent1-600 text-center py-8">
              No QR code uploaded yet
            </p>
          )}
        </div>

        {/* Upload New QR Code */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Upload New GCash QR Code
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  as="span"
                  color="primary"
                  variant="bordered"
                  startContent={<Upload className="w-4 h-4" />}
                  isDisabled={uploading}
                  className="w-full cursor-pointer"
                >
                  {selectedFile ? selectedFile.name : 'Choose QR Code Image'}
                </Button>
              </label>

              {selectedFile && (
                <Button
                  color="danger"
                  variant="light"
                  isIconOnly
                  onPress={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  isDisabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {previewUrl && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-dashed border-autohub-primary-300 w-full max-w-xs">
                  <div className="relative w-full aspect-square">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={250}
                      height={250}
                      className="w-full h-full object-contain rounded"
                      classNames={{
                        wrapper: "w-full h-full",
                        img: "w-full h-full object-contain"
                      }}
                    />
                  </div>
                  <p className="text-xs text-center text-autohub-accent1-600 mt-2">Preview</p>
                </div>
              </div>
            )}

            <Button
              color="primary"
              onPress={handleUploadQRCode}
              isLoading={uploading}
              isDisabled={!selectedFile || uploading}
              startContent={!uploading && <Upload className="w-4 h-4" />}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload QR Code'}
            </Button>

            <p className="text-xs text-autohub-accent1-600">
              Accepted formats: PNG, JPEG, JPG • Max size: 5MB
            </p>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Payment Instructions
          </h3>

          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter payment instructions for users..."
            minRows={5}
            maxRows={10}
            disabled={saving}
            classNames={{
              input: "text-autohub-secondary-900",
              inputWrapper: "border-autohub-accent1-300"
            }}
          />

          <Button
            color="primary"
            onPress={handleSaveInstructions}
            isLoading={saving}
            isDisabled={!instructions.trim() || saving}
            startContent={!saving && <Save className="w-4 h-4" />}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Instructions'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
