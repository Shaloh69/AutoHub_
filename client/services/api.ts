// services/api.ts
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskResponse, TaskStatsResponse, TaskQuery } from '@/types/task';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all tasks with optional filtering and pagination
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

  // Get task by ID
  async getTaskById(id: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/${id}`);
  }

  // Create new task
  async createTask(taskData: CreateTaskRequest): Promise<TaskResponse> {
    return this.request<TaskResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  // Update task
  async updateTask(id: string, updateData: UpdateTaskRequest): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete task
  async deleteTask(id: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Get tasks by status
  async getTasksByStatus(status: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/tasks/status/${status}`);
  }

  // Get task statistics
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