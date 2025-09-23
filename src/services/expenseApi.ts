import { apiConfig } from '@/utils/apiConfig';

// Expense types based on database schema
export interface Expense {
  id: number;
  category: string;
  account_id: number;
  transaction_id: number;
  description: string;
  amount: number;
  date: string;
  reference: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque';
  receipt_url?: string;
  created_by?: number;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${apiConfig.getBaseUrl()}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Expense API request failed:', error);
    throw error;
  }
};

export const expenseApi = {
  // Expense management
  getExpenses: (params?: {
    category?: string;
    account_id?: number;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<ApiResponse<Expense[]>>(`/expenses${query ? `?${query}` : ''}`);
  },

  getExpense: (id: number) =>
    apiRequest<ApiResponse<Expense>>(`/expenses/${id}`),

  createExpense: (expense: {
    category: string;
    account_id: number;
    description: string;
    amount: number;
    date: string;
    reference?: string;
    payment_method: 'cash' | 'bank_transfer' | 'cheque';
    receipt_url?: string;
    created_by?: number;
  }) =>
    apiRequest<ApiResponse<Expense>>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  updateExpense: (id: number, expense: Partial<Expense>) =>
    apiRequest<ApiResponse<Expense>>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    }),

  deleteExpense: (id: number) =>
    apiRequest<ApiResponse<{ deleted: boolean }>>(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Expense categories
  getCategories: () =>
    apiRequest<ApiResponse<ExpenseCategory[]>>('/expenses/categories'),

  createCategory: (category: {
    name: string;
    description?: string;
    is_active?: boolean;
  }) =>
    apiRequest<ApiResponse<ExpenseCategory>>('/expenses/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),

  updateCategory: (id: number, category: Partial<ExpenseCategory>) =>
    apiRequest<ApiResponse<ExpenseCategory>>(`/expenses/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),

  deleteCategory: (id: number) =>
    apiRequest<ApiResponse<{ deleted: boolean }>>(`/expenses/categories/${id}`, {
      method: 'DELETE',
    }),

  // Expense analytics and summaries
  getExpenseSummary: (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
    date_from?: string;
    date_to?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<ApiResponse<{
      totalExpenses: number;
      expensesByCategory: Array<{
        category: string;
        amount: number;
        count: number;
        percentage: number;
      }>;
      expensesByPaymentMethod: Array<{
        payment_method: string;
        amount: number;
        count: number;
        percentage: number;
      }>;
      expensesByAccount: Array<{
        account_id: number;
        account_name: string;
        amount: number;
        count: number;
      }>;
      monthlyTrend: Array<{
        month: string;
        amount: number;
        count: number;
      }>;
    }>>(`/expenses/summary${query ? `?${query}` : ''}`);
  },

  // Bulk operations
  bulkDeleteExpenses: (ids: number[]) =>
    apiRequest<ApiResponse<{ deleted: number }>>('/expenses/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkUpdateCategory: (ids: number[], category: string) =>
    apiRequest<ApiResponse<{ updated: number }>>('/expenses/bulk-update-category', {
      method: 'POST',
      body: JSON.stringify({ ids, category }),
    }),

  // Export functionality
  exportExpenses: (params?: {
    format?: 'csv' | 'excel' | 'pdf';
    date_from?: string;
    date_to?: string;
    category?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<ApiResponse<{
      download_url: string;
      file_name: string;
      expires_at: string;
    }>>(`/expenses/export${query ? `?${query}` : ''}`);
  },

  // Scheduled expenses (future feature)
  getScheduledExpenses: () =>
    apiRequest<ApiResponse<Array<{
      id: number;
      category: string;
      description: string;
      amount: number;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      next_due_date: string;
      is_active: boolean;
    }>>>('/expenses/scheduled'),

  createScheduledExpense: (scheduledExpense: {
    category: string;
    description: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    account_id: number;
    payment_method: 'cash' | 'bank_transfer' | 'cheque';
  }) =>
    apiRequest<ApiResponse<any>>('/expenses/scheduled', {
      method: 'POST',
      body: JSON.stringify(scheduledExpense),
    }),
};