// ==========================================
// app/seller/inquiries/page.tsx - Seller Inquiries Management
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Tabs, Tab } from '@heroui/tabs';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import {
  MessageCircle, Send, Clock, CheckCircle2, XCircle, User,
  Mail, Phone, Calendar, Car
} from 'lucide-react';
import { apiService, getImageUrl } from '@/services/api';
import { Inquiry } from '@/types';
import { useRequireSeller } from '@/contexts/AuthContext';
import SellerLayout from '@/components/seller/SellerLayout';

export default function SellerInquiriesPage() {
  const router = useRouter();
  const { user } = useRequireSeller();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTab, setSelectedTab] = useState('open');

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (user) {
      loadInquiries();
    }
  }, [user, selectedTab]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const status = selectedTab === 'all' ? undefined : selectedTab;
      const response = await apiService.getInquiries('received', status);

      if (response.success && response.data) {
        setInquiries(response.data.items || []);
      }
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInquiryDetails = async (inquiryId: number) => {
    try {
      const response = await apiService.getInquiry(inquiryId);
      if (response.success && response.data) {
        setSelectedInquiry(response.data);
        onOpen();
      }
    } catch (error) {
      console.error('Error loading inquiry details:', error);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseText.trim()) return;

    try {
      setSending(true);
      const response = await apiService.respondToInquiry(selectedInquiry.id, responseText);

      if (response.success) {
        setResponseText('');
        loadInquiryDetails(selectedInquiry.id);
        loadInquiries();
      }
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (inquiryId: number, status: string) => {
    try {
      const response = await apiService.updateInquiryStatus(inquiryId, status);
      if (response.success) {
        loadInquiries();
        if (selectedInquiry?.id === inquiryId) {
          loadInquiryDetails(inquiryId);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'NEW':
      case 'OPEN':
        return 'warning';
      case 'REPLIED':
      case 'READ':
      case 'IN_NEGOTIATION':
        return 'primary';
      case 'CLOSED':
      case 'CONVERTED':
        return 'success';
      case 'SPAM':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'NEW':
      case 'OPEN':
        return <Clock size={16} />;
      case 'REPLIED':
      case 'READ':
      case 'IN_NEGOTIATION':
        return <MessageCircle size={16} />;
      case 'CLOSED':
      case 'CONVERTED':
        return <CheckCircle2 size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SellerLayout>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Inquiries
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer inquiries about your listings
            </p>
          </div>

          <Card>
            <CardHeader>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
              >
                <Tab
                  key="open"
                  title={
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Open ({inquiries.filter(i => i.status?.toUpperCase() === 'NEW' || i.status?.toUpperCase() === 'OPEN').length})</span>
                    </div>
                  }
                />
                <Tab
                  key="replied"
                  title={
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} />
                      <span>Replied ({inquiries.filter(i => i.status?.toUpperCase() === 'REPLIED' || i.status?.toUpperCase() === 'READ').length})</span>
                    </div>
                  }
                />
                <Tab
                  key="closed"
                  title={
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Closed ({inquiries.filter(i => i.status?.toUpperCase() === 'CLOSED' || i.status?.toUpperCase() === 'CONVERTED').length})</span>
                    </div>
                  }
                />
                <Tab key="all" title={`All (${inquiries.length})`} />
              </Tabs>
            </CardHeader>

            <CardBody>
              {inquiries.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No inquiries yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Customer inquiries will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map(inquiry => (
                    <Card
                      key={inquiry.id}
                      isPressable
                      onPress={() => loadInquiryDetails(inquiry.id)}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardBody>
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Car Image */}
                          <div className="w-full md:w-32 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                            {inquiry.car?.images?.[0] ? (
                              <img
                                src={getImageUrl(inquiry.car.images[0].image_url)}
                                alt={inquiry.car.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="text-gray-400" size={32} />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                  {inquiry.subject}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Re: {inquiry.car?.title}
                                </p>
                              </div>
                              <Chip
                                color={getStatusColor(inquiry.status)}
                                variant="flat"
                                startContent={getStatusIcon(inquiry.status)}
                              >
                                {inquiry.status}
                              </Chip>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                              {inquiry.message}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {inquiry.buyer
                                  ? `${inquiry.buyer.first_name} ${inquiry.buyer.last_name}`
                                  : inquiry.buyer_name || 'Guest'}
                              </span>
                              {inquiry.buyer_email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={14} />
                                  {inquiry.buyer_email}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(inquiry.created_at)}
                              </span>
                              {inquiry.responses && inquiry.responses.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={14} />
                                  {inquiry.responses.length} response(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Inquiry Detail Modal */}
          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
          >
            <ModalContent>
              <ModalHeader>
                <div>
                  <h2 className="text-xl font-bold">{selectedInquiry?.subject}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    Re: {selectedInquiry?.car?.title}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedInquiry && (
                  <div className="space-y-6">
                    {/* Original Message */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-blue-700 dark:text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {selectedInquiry.buyer
                                ? `${selectedInquiry.buyer.first_name} ${selectedInquiry.buyer.last_name}`
                                : selectedInquiry.buyer_name || 'Guest'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(selectedInquiry.created_at)}
                            </span>
                          </div>
                          {selectedInquiry.buyer_email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedInquiry.buyer_email}
                            </p>
                          )}
                          {selectedInquiry.buyer_phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedInquiry.buyer_phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedInquiry.message}
                      </p>
                    </div>

                    {/* Responses */}
                    {selectedInquiry.responses && selectedInquiry.responses.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Conversation
                        </h3>
                        {selectedInquiry.responses.map(response => (
                          <div
                            key={response.id}
                            className={`rounded-lg p-4 ${
                              response.is_seller_response
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <User size={20} className="text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {response.is_seller_response ? 'You' : 'Buyer'}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(response.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {response.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {selectedInquiry.status !== 'closed' && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Send Response
                        </h3>
                        <Textarea
                          placeholder="Type your response..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          minRows={4}
                        />
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex justify-between">
                <div className="flex gap-2">
                  {selectedInquiry?.status === 'open' && (
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleUpdateStatus(selectedInquiry.id, 'replied')}
                    >
                      Mark as Replied
                    </Button>
                  )}
                  {selectedInquiry?.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => handleUpdateStatus(selectedInquiry.id, 'closed')}
                    >
                      Close Inquiry
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="flat"
                    onPress={() => onOpenChange()}
                  >
                    Close
                  </Button>
                  {selectedInquiry?.status !== 'closed' && (
                    <Button
                      color="primary"
                      onPress={handleSendResponse}
                      isLoading={sending}
                      isDisabled={!responseText.trim()}
                      startContent={<Send size={18} />}
                    >
                      Send Response
                    </Button>
                  )}
                </div>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      )}
    </SellerLayout>
  );
}