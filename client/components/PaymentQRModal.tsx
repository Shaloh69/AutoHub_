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
  paymentId: number;
  planName: string;
  amount: number;
  qrCodeUrl: string;
  instructions: string;
  onPaymentSubmitted: () => void;
}

export default function PaymentQRModal({
  isOpen,
  onClose,
  paymentId,
  planName,
  amount,
  qrCodeUrl,
  instructions,
  onPaymentSubmitted
}: PaymentQRModalProps) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter the reference number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiService.submitPaymentReference({
        payment_id: paymentId,
        reference_number: referenceNumber.trim()
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSubmitted();
          onClose();
        }, 2000);
      } else {
        // Handle error - convert to string if it's an object
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : typeof response.error === 'object' && response.error !== null
          ? JSON.stringify(response.error)
          : 'Failed to submit payment reference';
        setError(errorMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment reference');
    } finally {
      setSubmitting(false);
    }
  };

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
          {success ? (
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

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-autohub-secondary-900 mb-2">
                  Payment Instructions:
                </h4>
                <p className="text-sm text-autohub-accent1-700 whitespace-pre-line">
                  {instructions}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border-2 border-autohub-primary-200 w-full max-w-md mx-auto">
                  <div className="relative w-full aspect-square">
                    <Image
                      src={qrCodeUrl}
                      alt="GCash Payment QR Code"
                      width={400}
                      height={400}
                      className="w-full h-full object-contain rounded-lg"
                      classNames={{
                        wrapper: "w-full h-full",
                        img: "w-full h-full object-contain"
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-autohub-accent1-600 text-center px-4">
                  Scan this QR code with your GCash app to make payment
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
                  After completing payment via GCash, enter the reference number from your payment confirmation
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        {!success && (
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
