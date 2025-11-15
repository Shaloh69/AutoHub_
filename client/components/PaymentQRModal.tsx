// components/PaymentQRModal.tsx
"use client";

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { apiService } from '@/services/api';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: number;
  planName: string;
  amount: number;
  onPaymentSubmitted: () => void;
}

export default function PaymentQRModal({
  isOpen,
  onClose,
  subscriptionId,
  planName,
  amount,
  onPaymentSubmitted
}: PaymentQRModalProps) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ qr_code_url: string; instructions: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPaymentQRCode();

      if (response.success && response.data) {
        setQrCodeData(response.data);
      } else {
        setError(response.error || 'Failed to load QR code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter the reference number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiService.submitPaymentReference({
        subscription_id: subscriptionId,
        reference_number: referenceNumber.trim()
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSubmitted();
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit payment reference');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment reference');
    } finally {
      setSubmitting(false);
    }
  };

  // Load QR code when modal opens
  React.useEffect(() => {
    if (isOpen && !qrCodeData) {
      loadQRCode();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!submitting}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
            Complete Your Payment
          </h3>
          <p className="text-sm text-autohub-accent1-600">
            {planName} - ₱{amount}
          </p>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" color="primary" />
            </div>
          ) : success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">
                Payment Reference Submitted!
              </h4>
              <p className="text-autohub-accent1-600">
                Your payment is being verified by our admin team. You'll be notified once approved.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {qrCodeData && (
                <>
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-autohub-secondary-900 mb-2">
                      Payment Instructions:
                    </h4>
                    <p className="text-sm text-autohub-accent1-700 whitespace-pre-line">
                      {qrCodeData.instructions}
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-autohub-primary-200">
                      <Image
                        src={qrCodeData.qr_code_url}
                        alt="Payment QR Code"
                        width={300}
                        height={300}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-autohub-accent1-600 text-center">
                      Scan this QR code with your mobile banking app
                    </p>
                  </div>

                  {/* Reference Number Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-autohub-secondary-900 dark:text-autohub-neutral-50">
                      Enter Payment Reference Number
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., REF123456789"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      disabled={submitting}
                      classNames={{
                        input: "text-autohub-secondary-900",
                        inputWrapper: "border-autohub-accent1-300"
                      }}
                    />
                    <p className="text-xs text-autohub-accent1-600">
                      After payment, enter the reference number from your payment confirmation
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </ModalBody>

        {!success && !loading && (
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-autohub-primary-500 text-white"
              onPress={handleSubmit}
              isLoading={submitting}
              disabled={!referenceNumber.trim()}
            >
              Submit Payment
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

// Add React import for useEffect
import React from 'react';
