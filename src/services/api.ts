const BASE_URL = 'https://usmanhardware.site/wp-json/ims/v1';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[] | {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

// Enhanced Dashboard Data Types
export interface EnhancedDashboardData {
  financial: {
    todayRevenue: number;
    yesterdayRevenue: number;
    monthRevenue: number;
    lastMonthRevenue: number;
    monthExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    revenueGrowth: number;
    monthlyGrowth: number;
  };
  sales: {
    todaySales: number;
    weekSales: number;
    avgOrderValue: number;
    pendingOrdersValue: number;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
    highValueSales: Array<{
      orderNumber: string;
      amount: number;
      customer: string;
      date: string;
    }>;
  };
  inventory: {
    totalInventoryValue: number;
    retailInventoryValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    fastMovingProducts: Array<{
      name: string;
      sold: number;
      remaining: number;
    }>;
    deadStockValue: number;
    inventoryTurnover: number;
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    avgCustomerValue: number;
    topCustomers: Array<{
      name: string;
      totalPurchases: number;
      balance: number;
    }>;
    customerTypes: Array<{
      type: string;
      count: number;
    }>;
    totalReceivables: number;
  };
  performance: {
    weeklyTrend: Array<{
      week: string;
      revenue: number;
      orders: number;
    }>;
    dailyAvgRevenue: number;
    dailyAvgOrders: number;
    categoryPerformance: Array<{
      category: string;
      revenue: number;
      unitsSold: number;
    }>;
  };
  cashFlow: {
    monthlyInflows: number;
    monthlyOutflows: number;
    netCashFlow: number;
    recentPayments: Array<{
      customer: string;
      amount: number;
      date: string;
    }>;
  };
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    action: string;
  }>;
}

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

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
    console.error('API request failed:', error);
    throw error;
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: () => apiRequest<ApiResponse<any>>('/dashboard/stats'),
  getEnhancedStats: () => apiRequest<ApiResponse<EnhancedDashboardData>>('/dashboard/enhanced-stats'),
  getRevenueTrend: () => apiRequest<ApiResponse<any>>('/dashboard/revenue-trend'),
  getCategoryPerformance: () => apiRequest<ApiResponse<any>>('/dashboard/category-performance'),
  getDailySales: () => apiRequest<ApiResponse<any>>('/dashboard/daily-sales'),
  getInventoryStatus: () => apiRequest<ApiResponse<any>>('/dashboard/inventory-status'),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/products${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => apiRequest<ApiResponse<any>>(`/products/${id}`),
  
  create: (product: any) => 
    apiRequest<ApiResponse<any>>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  
  update: (id: number, product: any) =>
    apiRequest<ApiResponse<any>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  
  delete: (id: number) =>
    apiRequest<ApiResponse<any>>(`/products/${id}`, {
      method: 'DELETE',
    }),
  
  adjustStock: (id: number, adjustment: any) =>
    apiRequest<ApiResponse<any>>(`/products/${id}/stock-adjustment`, {
      method: 'POST',
      body: JSON.stringify(adjustment),
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => apiRequest<ApiResponse<string[]>>('/categories'),
  create: (category: { name: string }) =>
    apiRequest<ApiResponse<any>>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),
};

// Units API
export const unitsApi = {
  getAll: () => apiRequest<ApiResponse<any[]>>('/units'),
  create: (unit: { name: string; label: string }) =>
    apiRequest<ApiResponse<any>>('/units', {
      method: 'POST',
      body: JSON.stringify(unit),
    }),
};

// Customers API
export const customersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/customers${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => apiRequest<ApiResponse<any>>(`/customers/${id}`),
  
  create: (customer: any) =>
    apiRequest<ApiResponse<any>>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),
  
  update: (id: number, customer: any) =>
    apiRequest<ApiResponse<any>>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    }),

  delete: (id: number) =>
    apiRequest<ApiResponse<any>>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Sales API
export const salesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    customerId?: number;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/sales${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => apiRequest<ApiResponse<any>>(`/sales/${id}`),
  
  create: (sale: any) =>
    apiRequest<ApiResponse<any>>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    }),
  
  updateStatus: (id: number, status: any) =>
    apiRequest<ApiResponse<any>>(`/sales/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    }),

  adjustOrder: (id: number, adjustment: any) =>
    apiRequest<ApiResponse<any>>(`/sales/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(adjustment),
    }),

  generatePDF: (id: number) => 
    apiRequest<Blob>(`/sales/${id}/pdf`, {
      headers: {
        'Accept': 'application/pdf',
      },
    }),
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/inventory${query ? `?${query}` : ''}`);
  },
  
  getMovements: (params?: {
    page?: number;
    limit?: number;
    productId?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/inventory/movements${query ? `?${query}` : ''}`);
  },
  
  restock: (restock: any) =>
    apiRequest<ApiResponse<any>>('/inventory/restock', {
      method: 'POST',
      body: JSON.stringify(restock),
    }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/notifications${query ? `?${query}` : ''}`);
  },
  
  markAsRead: (id: number) =>
    apiRequest<ApiResponse<any>>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  
  markAllAsRead: () =>
    apiRequest<ApiResponse<any>>('/notifications/mark-all-read', {
      method: 'PUT',
    }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/suppliers${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => apiRequest<ApiResponse<any>>(`/suppliers/${id}`),
  
  create: (supplier: any) =>
    apiRequest<ApiResponse<any>>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    }),
  
  update: (id: number, supplier: any) =>
    apiRequest<ApiResponse<any>>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    }),
  
  delete: (id: number) =>
    apiRequest<ApiResponse<any>>(`/suppliers/${id}`, {
      method: 'DELETE',
    }),
};

// Purchase Orders API - Fixed to match new WordPress API structure
export const purchaseOrdersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    supplierId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/purchase-orders${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => apiRequest<ApiResponse<any>>(`/purchase-orders/${id}`),
  
  create: (order: any) =>
    apiRequest<ApiResponse<any>>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),
  
  update: (id: number, order: any) =>
    apiRequest<ApiResponse<any>>(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    }),
  
  // Fixed: Simple status update endpoint that matches the API
  updateStatus: (id: number, status: string, notes?: string) =>
    apiRequest<ApiResponse<any>>(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
  
  receive: (id: number, data: any) =>
    apiRequest<ApiResponse<any>>(`/purchase-orders/${id}/receive`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<ApiResponse<any>>(`/purchase-orders/${id}`, {
      method: 'DELETE',
    }),
};

// Quotations API - Updated with all endpoints
export const quotationsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    customerId?: number;
    status?: string;
    quoteNumber?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest<any>(`/quotations${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => apiRequest<ApiResponse<any>>(`/quotations/${id}`),
  
  create: (quotation: any) => 
    apiRequest<ApiResponse<any>>('/quotations', {
      method: 'POST',
      body: JSON.stringify(quotation),
    }),
  
  update: (id: number, quotation: any) =>
    apiRequest<ApiResponse<any>>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quotation),
    }),
  
  delete: (id: number) =>
    apiRequest<ApiResponse<any>>(`/quotations/${id}`, {
      method: 'DELETE',
    }),
  
  send: (id: number) =>
    apiRequest<ApiResponse<any>>(`/quotations/${id}/send`, {
      method: 'PUT',
    }),
  
  updateStatus: (id: number, status: string) =>
    apiRequest<ApiResponse<any>>(`/quotations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  convertToSale: (id: number) =>
    apiRequest<ApiResponse<any>>(`/quotations/${id}/convert-to-sale`, {
      method: 'PUT',
    }),
};
