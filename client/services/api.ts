// services/api.ts
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskResponse, TaskStatsResponse, TaskQuery } from '@/types/task';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  isVerified: boolean;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

// Car Types
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  condition: 'NEW' | 'USED' | 'CERTIFIED';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  transmission: 'MANUAL' | 'AUTOMATIC';
  bodyType: string;
  color: string;
  location: string;
  images: string[];
  features: string[];
  userId: string;
  user?: User;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarRequest {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  condition: 'NEW' | 'USED' | 'CERTIFIED';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  transmission: 'MANUAL' | 'AUTOMATIC';
  bodyType: string;
  color: string;
  location: string;
  features: string[];
}

export interface CarSearchQuery {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CarResponse {
  success: boolean;
  data?: Car | Car[];
  total?: number;
  page?: number;
  totalPages?: number;
  message?: string;
  error?: string;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  maxListings: number;
  priority: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ========== AUTH METHODS ==========
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<{ success: boolean; data?: User; error?: string }> {
    return this.request('/auth/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async validateToken(): Promise<{ success: boolean; data?: User; error?: string }> {
    return this.request('/auth/validate-token');
  }

  // ========== CAR METHODS ==========
  async searchCars(query?: CarSearchQuery): Promise<CarResponse> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/cars${queryString ? `?${queryString}` : ''}`;
    
    return this.request<CarResponse>(endpoint);
  }

  async getFeaturedCars(): Promise<CarResponse> {
    return this.request<CarResponse>('/cars/featured');
  }

  async getCarById(id: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}`);
  }

  async getSimilarCars(id: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}/similar`);
  }

  async createCar(carData: CreateCarRequest): Promise<CarResponse> {
    return this.request<CarResponse>('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  }

  async updateCar(id: string, carData: Partial<CreateCarRequest>): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    });
  }

  async deleteCar(id: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserCars(userId: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/user/${userId}`);
  }

  async getMyListings(): Promise<CarResponse> {
    return this.request<CarResponse>('/cars/my/listings');
  }

  async markCarAsSold(id: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}/mark-sold`, {
      method: 'POST',
    });
  }

  async boostListing(id: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/cars/${id}/boost`, {
      method: 'POST',
    });
  }

  // ========== SUBSCRIPTION METHODS ==========
  async getSubscriptionPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    return this.request('/subscriptions/plans');
  }

  async getCurrentSubscription(): Promise<{ success: boolean; data?: Subscription; error?: string }> {
    return this.request('/subscriptions/current');
  }

  async subscribe(planId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async cancelSubscription(): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request('/subscriptions/cancel', {
      method: 'POST',
    });
  }

  async upgradeSubscription(planId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async getUserLimits(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/subscriptions/limits');
  }

  async getPaymentMethods(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/subscriptions/payment/methods');
  }

  // ========== NOTIFICATION METHODS ==========
  async getNotifications(): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    return this.request('/notifications');
  }

  async getUnreadNotifications(): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    return this.request('/notifications/unread');
  }

  async markNotificationAsRead(id: string): Promise<{ success: boolean; error?: string }> {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
    return this.request('/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string): Promise<{ success: boolean; error?: string }> {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== UPLOAD METHODS ==========
  async uploadCarImages(carId: string, files: FileList): Promise<{ success: boolean; data?: string[]; error?: string }> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    formData.append('carId', carId);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${API_BASE_URL}/upload/car-images`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  }

  async uploadProfileImage(file: File): Promise<{ success: boolean; data?: string; error?: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  }

  // ========== ADMIN METHODS ==========
  async getAdminAnalytics(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request('/admin/analytics');
  }

  async getPendingCars(): Promise<CarResponse> {
    return this.request<CarResponse>('/admin/cars/pending');
  }

  async approveCar(id: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/admin/cars/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectCar(id: string, reason?: string): Promise<CarResponse> {
    return this.request<CarResponse>(`/admin/cars/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    return this.request('/admin/users');
  }

  async banUser(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unbanUser(id: string): Promise<{ success: boolean; error?: string }> {
    return this.request(`/admin/users/${id}/unban`, {
      method: 'POST',
    });
  }

  // ========== TASK METHODS (existing) ==========
  async getTasks(query?: TaskQuery): Promise<TaskResponse> {
    const params = new URLSearchParams();
    
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const queryString = params.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    
    return this.request<TaskResponse>(endpoint);
  }

  async getTaskById(id: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/${id}`);
  }

  async createTask(taskData: CreateTaskRequest): Promise<TaskResponse> {
    return this.request<TaskResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, updateData: UpdateTaskRequest): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteTask(id: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getTasksByStatus(status: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/status/${status}`);
  }

  async getTaskStats(): Promise<TaskStatsResponse> {
    return this.request<TaskStatsResponse>('/tasks/stats');
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/health', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();