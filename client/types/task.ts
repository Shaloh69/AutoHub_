// types/task.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface CreateTaskRequest {
  title: string;
  description: string;
  status?: TaskStatus;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface TaskResponse {
  success: boolean;
  message?: string;
  data?: Task | Task[];
  count?: number;
  total?: number;
  page?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  error?: string;
}

export interface TaskStatsResponse {
  success: boolean;
  data: {
    total: number;
    pending: number;
    'in-progress': number;
    completed: number;
  };
}

export interface TaskQuery {
  status?: TaskStatus;
  search?: string;
  page?: number;
  limit?: number;
}