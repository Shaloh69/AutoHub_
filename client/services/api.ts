// ==========================================
// services/api.ts - Complete API Service
// ==========================================

import {
  User, Car, Brand, Model, Category, Feature, Inquiry, InquiryResponse,
  Transaction, SubscriptionPlan, Subscription, Notification,
  PaginatedResponse, ApiResponse, SearchFilters, CarFormData, Analytics,
  QRCodePaymentResponse
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Check if we should skip auth
      const headersRecord = options.headers as Record<string, string> | undefined;
      const shouldIncludeAuth = headersRecord?.['Authorization'] !== 'skip';
      
      // Remove the 'skip' marker before sending
      const cleanHeaders = { ...options.headers };
      if (headersRecord?.['Authorization'] === 'skip') {
        delete (cleanHeaders as Record<string, string>)['Authorization'];
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(shouldIncludeAuth),
          ...cleanHeaders,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle different error formats
        let errorMessage: string;

        // Check if it's a Pydantic validation error (array of error objects)
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((err: any) => {
              const field = err.loc ? err.loc.join('.') : 'field';
              return `${field}: ${err.msg || 'Validation error'}`;
            })
            .join(', ');
        }
        // Check if detail is an object
        else if (typeof data.detail === 'object' && data.detail !== null) {
          errorMessage = data.detail.msg || JSON.stringify(data.detail);
        }
        // Check if message is an object
        else if (typeof data.message === 'object' && data.message !== null) {
          errorMessage = JSON.stringify(data.message);
        }
        // Use string values or default
        else {
          errorMessage = data.detail || data.message || `HTTP ${response.status}`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ==================== AUTH ====================
  
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role?: string;
    city_id?: number;
  }): Promise<ApiResponse<{ access_token: string; refresh_token: string; user: User }>> {
    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Authorization': 'skip' },
    });

    if (response.success && response.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }

    return response;
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Authorization': 'skip' },
    });

    if (response.success && response.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }

    return response;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Authorization': 'skip' },
    });
  }

  async resendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return { success: false, error: 'No refresh token' };
    }

    const response = await this.request<any>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      headers: { 'Authorization': 'skip' },
    });

    if (response.success && response.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }

    return response;
  }

  // ==================== CARS ====================
  
  async searchCars(filters: SearchFilters): Promise<ApiResponse<PaginatedResponse<Car>>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<PaginatedResponse<Car>>(`/cars?${params.toString()}`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getCar(id: number): Promise<ApiResponse<Car>> {
    return this.request<Car>(`/cars/${id}`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getFeaturedCars(limit: number = 12): Promise<ApiResponse<PaginatedResponse<Car>>> {
    return this.request<PaginatedResponse<Car>>(`/cars?is_featured=true&page_size=${limit}&sort=-created_at`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getLatestCars(limit: number = 12): Promise<ApiResponse<PaginatedResponse<Car>>> {
    return this.request<PaginatedResponse<Car>>(`/cars?page_size=${limit}&sort=-created_at`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async createCar(carData: CarFormData): Promise<ApiResponse<{ id: number; message: string }>> {
    return this.request('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  }

  async updateCar(id: number, carData: Partial<CarFormData>): Promise<ApiResponse<Car>> {
    return this.request<Car>(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    });
  }

  async deleteCar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/cars/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadCarImages(
    carId: number,
    files: File[],
    metadata?: { type: string; isMain: boolean }[]
  ): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('token');
    const results = [];

    // Upload images one by one with their metadata
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = metadata?.[i] || { type: 'exterior', isMain: i === 0 };

      const formData = new FormData();
      formData.append('file', file);

      const url = `${API_BASE_URL}/cars/${carId}/images?image_type=${meta.type}&is_main=${meta.isMain}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        results.push({
          success: response.ok,
          data: response.ok ? data : undefined,
          error: !response.ok ? (data.detail || 'Upload failed') : undefined,
        });
      } catch (error) {
        results.push({
          success: false,
          error: 'Network error',
        });
      }
    }

    // Return success if all uploads succeeded
    const allSuccess = results.every(r => r.success);
    return {
      success: allSuccess,
      data: allSuccess ? results.map(r => r.data) : undefined,
      error: !allSuccess ? results.find(r => !r.success)?.error : undefined,
    };
  }

  async deleteCarImage(carId: number, imageId: number): Promise<ApiResponse<any>> {
    return this.request(`/cars/${carId}/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  async boostCar(carId: number, duration: number): Promise<ApiResponse<any>> {
    return this.request(`/cars/${carId}/boost`, {
      method: 'POST',
      body: JSON.stringify({ duration_days: duration }),
    });
  }

  // ==================== BRANDS & MODELS ====================
  
  async getBrands(isPopular?: boolean): Promise<ApiResponse<Brand[]>> {
    const params = isPopular !== undefined ? `?is_popular=${isPopular}` : '';
    return this.request<Brand[]>(`/cars/brands${params}`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getModels(brandId: number, isPopular?: boolean): Promise<ApiResponse<Model[]>> {
    const params = new URLSearchParams({ brand_id: String(brandId) });
    if (isPopular !== undefined) params.append('is_popular', String(isPopular));
    
    return this.request<Model[]>(`/cars/models?${params.toString()}`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/cars/categories', {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getFeatures(category?: string): Promise<ApiResponse<Feature[]>> {
    const params = category ? `?category=${category}` : '';
    return this.request<Feature[]>(`/cars/features${params}`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  // ==================== INQUIRIES ====================
  
  async createInquiry(inquiryData: {
    car_id: number;
    subject: string;
    message: string;
    buyer_name?: string;
    buyer_email?: string;
    buyer_phone?: string;
    inquiry_type?: string;
    offered_price?: number;
  }): Promise<ApiResponse<{ id: number; message: string }>> {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiryData),
      headers: { 'Authorization': 'skip' },
    });
  }

  async getInquiries(
    type: 'sent' | 'received',
    status?: string
  ): Promise<ApiResponse<PaginatedResponse<Inquiry>>> {
    const params = new URLSearchParams({ type });
    if (status) params.append('status', status);
    
    return this.request<PaginatedResponse<Inquiry>>(`/inquiries?${params.toString()}`);
  }

  async getInquiry(id: number): Promise<ApiResponse<Inquiry>> {
    return this.request<Inquiry>(`/inquiries/${id}`);
  }

  async respondToInquiry(inquiryId: number, message: string): Promise<ApiResponse<any>> {
    return this.request(`/inquiries/${inquiryId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateInquiryStatus(
    inquiryId: number,
    status: string
  ): Promise<ApiResponse<any>> {
    return this.request(`/inquiries/${inquiryId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // ==================== TRANSACTIONS ====================
  
  async createTransaction(transactionData: {
    car_id: number;
    agreed_price: number;
    payment_method: string;
    deposit_amount?: number;
    financing_provider?: string;
    down_payment?: number;
    monthly_installment?: number;
    installment_months?: number;
    trade_in_accepted?: boolean;
    trade_in_value?: number;
    trade_in_vehicle_details?: string;
  }): Promise<ApiResponse<{ id: number; message: string }>> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async getTransactions(
    type: 'sales' | 'purchases',
    status?: string
  ): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    const params = new URLSearchParams({ type });
    if (status) params.append('status', status);
    
    return this.request<PaginatedResponse<Transaction>>(`/transactions?${params.toString()}`);
  }

  async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async updateTransaction(
    id: number,
    updateData: {
      status?: string;
      documents_verified?: boolean;
      payment_verified?: boolean;
      transfer_completed?: boolean;
    }
  ): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // ==================== SUBSCRIPTIONS ====================
  
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return this.request<SubscriptionPlan[]>('/subscriptions/plans', {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getCurrentSubscription(): Promise<ApiResponse<Subscription>> {
    return this.request<Subscription>('/subscriptions/current');
  }

  async subscribe(planData: {
    plan_id: number;
    billing_cycle: 'monthly' | 'annual';
    payment_method: string;
    promo_code?: string;
  }): Promise<ApiResponse<QRCodePaymentResponse>> {
    return this.request<QRCodePaymentResponse>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async cancelSubscription(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/subscriptions/cancel', {
      method: 'POST',
    });
  }

  async getUserLimits(): Promise<ApiResponse<any>> {
    return this.request('/users/statistics');
  }

  async upgradeSubscription(planId: number): Promise<ApiResponse<QRCodePaymentResponse>> {
    return this.request<QRCodePaymentResponse>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, billing_cycle: 'monthly', payment_method: 'qr_code' }),
    });
  }

  async submitPaymentReference(data: {
    payment_id: number;
    reference_number: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/subscriptions/submit-reference', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentQRCode(): Promise<ApiResponse<{ qr_code_url: string; instructions: string }>> {
    return this.request('/subscriptions/qr-code');
  }

  async getPaymentHistory(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/subscriptions/payments');
  }

  async getPaymentDetails(paymentId: number): Promise<ApiResponse<any>> {
    return this.request(`/subscriptions/payment/${paymentId}`);
  }

  // ==================== FAVORITES ====================
  
  async getFavorites(): Promise<ApiResponse<Car[]>> {
    return this.request<Car[]>('/users/favorites');
  }

  async addToFavorites(carId: number): Promise<ApiResponse<{ id: number; message: string }>> {
    return this.request(`/users/favorites/${carId}`, {
      method: 'POST',
    });
  }

  async removeFromFavorites(carId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/users/favorites/${carId}`, {
      method: 'DELETE',
    });
  }

  // ==================== NOTIFICATIONS ====================
  
  async getNotifications(unreadOnly: boolean = false): Promise<ApiResponse<Notification[]>> {
    const params = unreadOnly ? '?unread_only=true' : '';
    return this.request<Notification[]>(`/users/notifications${params}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return this.request<{ unread_count: number }>('/users/notifications/unread-count');
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse<any>> {
    return this.request(`/users/notifications/${id}`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/users/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async deleteNotification(id: number): Promise<ApiResponse<any>> {
    return this.request(`/users/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== USER LISTINGS & STATS ====================
  
  async getUserListings(status?: string): Promise<ApiResponse<Car[]>> {
    const params = status ? `?status=${status}` : '';
    return this.request<Car[]>(`/users/listings${params}`);
  }

  async getUserStatistics(): Promise<ApiResponse<Analytics>> {
    return this.request<Analytics>('/users/statistics');
  }

  async upgradeRole(data: {
    new_role: 'SELLER' | 'DEALER';
    reason?: string;
    business_name?: string;
    business_permit_number?: string;
    tin_number?: string;
    dti_registration?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    old_role: string;
    new_role: string;
    upgraded_at: string;
    requires_verification: boolean;
    verification_message?: string;
  }>> {
    return this.request('/users/upgrade-role', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPublicProfile(userId: number): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${userId}/public-profile`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  // ==================== ANALYTICS ====================
  
  async getDashboard(): Promise<ApiResponse<Analytics>> {
    return this.request<Analytics>('/analytics/dashboard');
  }

  async getCarAnalytics(carId: number, days: number = 30): Promise<ApiResponse<any>> {
    return this.request(`/analytics/cars/${carId}/views?days=${days}`);
  }

  // ==================== ADMIN ====================
  
  async getAdminAnalytics(): Promise<ApiResponse<any>> {
    return this.request('/admin/analytics');
  }

  async getPendingCars(): Promise<ApiResponse<PaginatedResponse<Car>>> {
    return this.request<PaginatedResponse<Car>>('/admin/cars/pending');
  }

  async approveCar(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/cars/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved: true }),
    });
  }

  async rejectCar(id: number, reason?: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/cars/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAllUsers(): Promise<ApiResponse<PaginatedResponse<User>>> {
    return this.request<PaginatedResponse<User>>('/admin/users');
  }

  async banUser(id: number, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unbanUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}/unban`, {
      method: 'POST',
    });
  }

  // ==================== ADMIN PAYMENTS ====================

  async getPendingPayments(limit: number = 100, offset: number = 0): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/admin/payments/pending?limit=${limit}&offset=${offset}`);
  }

  async getPaymentDetails(paymentId: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/payments/${paymentId}`);
  }

  async verifyPayment(paymentId: number, data: {
    action: 'verify' | 'reject';
    admin_notes?: string;
    rejection_reason?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/admin/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId,
        ...data,
      }),
    });
  }

  async getPaymentStatistics(): Promise<ApiResponse<any>> {
    return this.request('/admin/payments/statistics');
  }

  async getPaymentLogs(paymentId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/admin/payments/${paymentId}/logs`);
  }

  // ==================== FRAUD DETECTION ====================

  async getFraudIndicators(limit: number = 50, severity?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (severity) params.append('severity', severity);
    return this.request<any[]>(`/admin/fraud-indicators?${params.toString()}`);
  }

  async createFraudIndicator(data: {
    user_id?: number;
    car_id?: number;
    indicator_type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/admin/fraud-indicators', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveFraudIndicator(fraudId: number, data: {
    resolution_notes: string;
    action_taken?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/admin/fraud-indicators/${fraudId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getFraudStatistics(): Promise<ApiResponse<any>> {
    return this.request('/admin/fraud-indicators/statistics');
  }

  // ==================== REVIEWS ====================

  async createReview(data: {
    car_id?: number;
    seller_id: number;
    rating: number;
    title?: string;
    comment?: string;
    pros?: string;
    cons?: string;
    would_recommend?: boolean;
    transaction_id?: number;
  }): Promise<ApiResponse<any>> {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReviews(params?: {
    car_id?: number;
    seller_id?: number;
    buyer_id?: number;
    status?: string;
    min_rating?: number;
    verified_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.car_id) searchParams.append('car_id', String(params.car_id));
    if (params?.seller_id) searchParams.append('seller_id', String(params.seller_id));
    if (params?.buyer_id) searchParams.append('buyer_id', String(params.buyer_id));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.min_rating) searchParams.append('min_rating', String(params.min_rating));
    if (params?.verified_only) searchParams.append('verified_only', 'true');
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const queryString = searchParams.toString();
    return this.request<any[]>(`/reviews${queryString ? '?' + queryString : ''}`);
  }

  async getReview(reviewId: number): Promise<ApiResponse<any>> {
    return this.request(`/reviews/${reviewId}`);
  }

  async updateReview(reviewId: number, data: {
    rating?: number;
    title?: string;
    comment?: string;
    pros?: string;
    cons?: string;
    would_recommend?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(reviewId: number): Promise<ApiResponse<any>> {
    return this.request(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async markReviewHelpful(reviewId: number): Promise<ApiResponse<any>> {
    return this.request(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful: true }),
    });
  }

  // ==================== ADMIN REVIEWS ====================

  async getAdminReviews(params?: {
    status?: string;
    car_id?: number;
    seller_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.car_id) searchParams.append('car_id', String(params.car_id));
    if (params?.seller_id) searchParams.append('seller_id', String(params.seller_id));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const queryString = searchParams.toString();
    return this.request<any[]>(`/admin/reviews${queryString ? '?' + queryString : ''}`);
  }

  async moderateReview(reviewId: number, data: {
    status: 'pending' | 'approved' | 'rejected' | 'hidden';
    admin_notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/admin/reviews/${reviewId}/moderate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReviewStatistics(): Promise<ApiResponse<any>> {
    return this.request('/admin/reviews/statistics');
  }

  // ==================== LOCATIONS ====================
  
  async getRegions(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/locations/regions', {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getProvinces(regionId?: number): Promise<ApiResponse<any[]>> {
    const params = regionId ? `?region_id=${regionId}` : '';
    return this.request<any[]>(`/locations/provinces${params}`, {
      headers: { 'Authorization': 'skip' },
    });
  }

  async getCities(provinceId?: number): Promise<ApiResponse<any[]>> {
    const params = provinceId ? `?province_id=${provinceId}` : '';
    return this.request<any[]>(`/locations/cities${params}`, {
      headers: { 'Authorization': 'skip' },
    });
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Converts a relative image URL to a full URL pointing to the backend server
 * @param relativeUrl - The relative URL from the API (e.g., "/uploads/cars/123/image.jpg")
 * @returns The full URL to the backend server
 */
export function getImageUrl(relativeUrl: string | null | undefined): string {
  // Return placeholder if no URL provided
  if (!relativeUrl) {
    return '/placeholder-car.jpg';
  }

  // Return as-is if already a full URL (http/https) or a local placeholder
  if (relativeUrl.startsWith('http://') ||
      relativeUrl.startsWith('https://') ||
      relativeUrl.startsWith('/placeholder')) {
    return relativeUrl;
  }

  // Get the backend base URL (remove /api/v1 suffix)
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const baseUrl = backendUrl.replace(/\/api\/v1$/, '');

  // Combine base URL with relative path
  return `${baseUrl}${relativeUrl}`;
}

export const apiService = new ApiService();
export default apiService;