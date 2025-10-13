// ==========================================
// components/ContactSellerModal.tsx
// ==========================================

'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

interface ContactSellerModalProps {
  carId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSellerModal({ carId, isOpen, onClose }: ContactSellerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subject: 'Inquiry about your vehicle',
    message: '',
    buyer_name: user ? `${user.first_name} ${user.last_name}` : '',
    buyer_email: user?.email || '',
    buyer_phone: user?.phone_number || '',
  });

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!user && (!formData.buyer_name || !formData.buyer_email)) {
      setError('Please provide your name and email');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.createInquiry({
        car_id: carId,
        subject: formData.subject,
        message: formData.message,
        buyer_name: user ? undefined : formData.buyer_name,
        buyer_email: user ? undefined : formData.buyer_email,
        buyer_phone: user ? undefined : formData.buyer_phone,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData(prev => ({ ...prev, message: '' }));
        }, 2000);
      } else {
        setError(response.error || 'Failed to send inquiry');
      }
    } catch (err) {
      setError('Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Contact Seller
        </ModalHeader>
        <ModalBody>
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                The seller will respond to your inquiry shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!user && (
                <>
                  <Input
                    label="Your Name"
                    placeholder="Enter your full name"
                    value={formData.buyer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, buyer_name: e.target.value }))}
                    isRequired
                  />

                  <Input
                    label="Your Email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.buyer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, buyer_email: e.target.value }))}
                    isRequired
                  />

                  <Input
                    label="Your Phone"
                    type="tel"
                    placeholder="+63 xxx xxx xxxx"
                    value={formData.buyer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, buyer_phone: e.target.value }))}
                  />
                </>
              )}

              <Input
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                isRequired
              />

              <Textarea
                label="Message"
                placeholder="I'm interested in this vehicle. Is it still available?"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                minRows={6}
                isRequired
              />

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        {!success && (
          <ModalFooter>
            <Button
              variant="flat"
              onPress={handleClose}
              isDisabled={loading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={loading}
            >
              Send Message
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}