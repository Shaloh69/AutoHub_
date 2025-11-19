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
import { Select, SelectItem } from '@heroui/select';
import { Tabs, Tab } from '@heroui/tabs';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, MessageSquare, DollarSign } from 'lucide-react';

interface ContactSellerModalProps {
  carId: number;
  carPrice?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSellerModal({ carId, carPrice, isOpen, onClose }: ContactSellerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('message');

  const [formData, setFormData] = useState({
    subject: 'Inquiry about your vehicle',
    message: '',
    buyer_name: user ? `${user.first_name} ${user.last_name}` : '',
    buyer_email: user?.email || '',
    buyer_phone: user?.phone || user?.phone_number || '',
    inquiry_type: 'GENERAL',
    offered_price: '',
  });

  const handleSubmit = async () => {
    // Require login for inquiries
    if (!user) {
      setError('Please log in or sign up to send an inquiry. This helps us protect our sellers from spam and ensures better communication.');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    // Validate offer price if making an offer
    if (activeTab === 'offer' && formData.offered_price) {
      const price = parseFloat(formData.offered_price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid offer price');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.createInquiry({
        car_id: carId,
        subject: activeTab === 'offer' ? 'Offer for your vehicle' : formData.subject,
        message: formData.message,
        buyer_name: formData.buyer_name,
        buyer_email: formData.buyer_email,
        buyer_phone: formData.buyer_phone || undefined,
        inquiry_type: activeTab === 'offer' ? 'PRICE_NEGOTIATION' : formData.inquiry_type,
        offered_price: activeTab === 'offer' && formData.offered_price
          ? parseFloat(formData.offered_price)
          : undefined,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData(prev => ({
            ...prev,
            message: '',
            offered_price: '',
            inquiry_type: 'GENERAL'
          }));
          setActiveTab('message');
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
      scrollBehavior="inside"
      isDismissable={!loading}
      classNames={{
        base: "max-w-full mx-4 sm:mx-6 md:max-w-2xl",
        wrapper: "overflow-y-auto",
      }}
    >
      <ModalContent className="max-h-[90vh]">
        <ModalHeader className="flex flex-col gap-1">
          Contact Seller
        </ModalHeader>
        <ModalBody className="overflow-y-auto py-4 px-4 sm:px-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                {activeTab === 'offer' ? 'Offer Sent!' : 'Message Sent!'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {activeTab === 'offer'
                  ? 'The seller will review your offer and respond shortly.'
                  : 'The seller will respond to your inquiry shortly.'}
              </p>
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="text-blue-600 dark:text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Login Required
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Please log in or sign up to send an inquiry to the seller. This helps us protect our sellers from spam and ensures better communication.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  color="primary"
                  onPress={() => window.location.href = '/auth/login'}
                  className="min-w-[120px]"
                >
                  Log In
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => window.location.href = '/auth/register'}
                  className="min-w-[120px]"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                aria-label="Contact options"
                fullWidth
                classNames={{
                  tabList: "w-full gap-2",
                  cursor: "w-full",
                  tab: "px-3 sm:px-6",
                  panel: "pt-4",
                }}
              >
                <Tab
                  key="message"
                  title={
                    <div className="flex items-center gap-1 sm:gap-2">
                      <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-sm">Send Message</span>
                    </div>
                  }
                />
                <Tab
                  key="offer"
                  title={
                    <div className="flex items-center gap-1 sm:gap-2">
                      <DollarSign size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-sm">Make an Offer</span>
                    </div>
                  }
                />
              </Tabs>

              <div className="space-y-4 pt-2">

                {activeTab === 'message' ? (
                  <>
                    <Select
                      label="Inquiry Type"
                      placeholder="Select inquiry type"
                      selectedKeys={[formData.inquiry_type]}
                      onChange={(e) => setFormData(prev => ({ ...prev, inquiry_type: e.target.value }))}
                    >
                      <SelectItem key="GENERAL" value="GENERAL">General Inquiry</SelectItem>
                      <SelectItem key="TEST_DRIVE" value="TEST_DRIVE">Request Test Drive</SelectItem>
                      <SelectItem key="PRICE_NEGOTIATION" value="PRICE_NEGOTIATION">Price Negotiation</SelectItem>
                      <SelectItem key="VEHICLE_HISTORY" value="VEHICLE_HISTORY">Vehicle History</SelectItem>
                      <SelectItem key="INSPECTION" value="INSPECTION">Inspection Request</SelectItem>
                      <SelectItem key="FINANCING" value="FINANCING">Financing Options</SelectItem>
                    </Select>

                    <Input
                      label="Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      isRequired
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Input
                        label="Your Offer Price"
                        type="number"
                        placeholder="Enter your offer amount"
                        value={formData.offered_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, offered_price: e.target.value }))}
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">₱</span>
                          </div>
                        }
                        isRequired
                      />
                      {carPrice && formData.offered_price && (
                        <p className="text-sm text-gray-500">
                          Listed price: ₱{carPrice.toLocaleString()}
                          {parseFloat(formData.offered_price) < carPrice && (
                            <span className="text-orange-500 ml-2">
                              ({((1 - parseFloat(formData.offered_price) / carPrice) * 100).toFixed(1)}% lower)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Textarea
                  label="Message"
                  placeholder={activeTab === 'offer'
                    ? "Add any additional details about your offer..."
                    : "I'm interested in this vehicle. Is it still available?"}
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
            </div>
          )}
        </ModalBody>
        {!success && user && (
          <ModalFooter className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 py-4">
            <Button
              variant="flat"
              onPress={handleClose}
              isDisabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={loading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {activeTab === 'offer' ? 'Send Offer' : 'Send Message'}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}