
import { inventoryApi, productsApi } from './api';
import { useToast } from '@/hooks/use-toast';

export interface StockMovement {
  id?: number;
  productId: number;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  reference?: string;
  orderId?: number;
  orderNumber?: string;
  createdAt: string;
  createdBy?: string;
}

export interface StockAlert {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  type: 'low_stock' | 'out_of_stock';
  severity: 'warning' | 'critical';
}

export interface StockValidationResult {
  isValid: boolean;
  availableStock: number;
  requestedQuantity: number;
  shortfall?: number;
  message: string;
}

class StockManagementService {
  private movements: StockMovement[] = [];
  private alerts: StockAlert[] = [];

  // Validate stock availability before operations
  async validateStockAvailability(productId: number, requestedQuantity: number): Promise<StockValidationResult> {
    try {
      const response = await productsApi.getById(productId);
      
      if (!response.success || !response.data) {
        return {
          isValid: false,
          availableStock: 0,
          requestedQuantity,
          message: 'Product not found'
        };
      }

      const product = response.data;
      const availableStock = product.stock || 0;

      if (requestedQuantity <= availableStock) {
        return {
          isValid: true,
          availableStock,
          requestedQuantity,
          message: 'Stock available'
        };
      } else {
        return {
          isValid: false,
          availableStock,
          requestedQuantity,
          shortfall: requestedQuantity - availableStock,
          message: `Insufficient stock. Available: ${availableStock}, Requested: ${requestedQuantity}`
        };
      }
    } catch (error) {
      console.error('Stock validation error:', error);
      return {
        isValid: false,
        availableStock: 0,
        requestedQuantity,
        message: 'Error validating stock'
      };
    }
  }

  // Deduct stock for sales
  async deductStock(
    productId: number, 
    quantity: number, 
    orderId?: number, 
    orderNumber?: string
  ): Promise<{ success: boolean; message: string; newStock?: number }> {
    try {
      // First validate stock availability
      const validation = await this.validateStockAvailability(productId, quantity);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Get current product details
      const productResponse = await productsApi.getById(productId);
      if (!productResponse.success || !productResponse.data) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      const product = productResponse.data;
      const newStock = (product.stock || 0) - quantity;

      // Update stock
      const updateResponse = await productsApi.adjustStock(productId, {
        type: 'sale',
        quantity: -quantity,
        reason: `Sale deduction${orderNumber ? ` - Order ${orderNumber}` : ''}`,
        reference: orderNumber || `SALE-${Date.now()}`,
        orderId
      });

      if (updateResponse.success) {
        // Record movement
        await this.recordMovement({
          productId,
          productName: product.name,
          type: 'sale',
          quantity: -quantity,
          balanceBefore: product.stock || 0,
          balanceAfter: newStock,
          reason: `Stock deducted for sale${orderNumber ? ` - Order ${orderNumber}` : ''}`,
          reference: orderNumber,
          orderId,
          orderNumber,
          createdAt: new Date().toISOString()
        });

        // Check for low stock alerts
        await this.checkStockAlerts(productId);

        return {
          success: true,
          message: 'Stock deducted successfully',
          newStock
        };
      } else {
        return {
          success: false,
          message: 'Failed to update stock'
        };
      }
    } catch (error) {
      console.error('Stock deduction error:', error);
      return {
        success: false,
        message: 'Error deducting stock'
      };
    }
  }

  // Add stock for purchases/returns
  async addStock(
    productId: number, 
    quantity: number, 
    reason: string = 'Stock addition',
    reference?: string
  ): Promise<{ success: boolean; message: string; newStock?: number }> {
    try {
      const productResponse = await productsApi.getById(productId);
      if (!productResponse.success || !productResponse.data) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      const product = productResponse.data;
      const newStock = (product.stock || 0) + quantity;

      const updateResponse = await productsApi.adjustStock(productId, {
        type: 'purchase',
        quantity: quantity,
        reason,
        reference: reference || `ADD-${Date.now()}`
      });

      if (updateResponse.success) {
        // Record movement
        await this.recordMovement({
          productId,
          productName: product.name,
          type: 'purchase',
          quantity: quantity,
          balanceBefore: product.stock || 0,
          balanceAfter: newStock,
          reason,
          reference,
          createdAt: new Date().toISOString()
        });

        return {
          success: true,
          message: 'Stock added successfully',
          newStock
        };
      } else {
        return {
          success: false,
          message: 'Failed to update stock'
        };
      }
    } catch (error) {
      console.error('Stock addition error:', error);
      return {
        success: false,
        message: 'Error adding stock'
      };
    }
  }

  // Record stock movement
  private async recordMovement(movement: Omit<StockMovement, 'id'>): Promise<void> {
    try {
      // In a real application, this would save to database
      console.log('Recording stock movement:', movement);
      this.movements.push({ ...movement, id: Date.now() });
    } catch (error) {
      console.error('Error recording stock movement:', error);
    }
  }

  // Check and generate stock alerts
  async checkStockAlerts(productId?: number): Promise<StockAlert[]> {
    try {
      const params = productId ? { productId } : { lowStock: true };
      const response = await inventoryApi.getAll(params);
      
      if (response.success) {
        const inventory = Array.isArray(response.data) ? response.data : response.data?.inventory || [];
        const alerts: StockAlert[] = [];

        inventory.forEach((item: any) => {
          const currentStock = item.currentStock || item.stock || 0;
          const minStock = item.minStock || 0;

          if (currentStock === 0) {
            alerts.push({
              productId: item.productId || item.id,
              productName: item.productName || item.name,
              currentStock,
              minStock,
              type: 'out_of_stock',
              severity: 'critical'
            });
          } else if (currentStock <= minStock) {
            alerts.push({
              productId: item.productId || item.id,
              productName: item.productName || item.name,
              currentStock,
              minStock,
              type: 'low_stock',
              severity: 'warning'
            });
          }
        });

        this.alerts = alerts;
        return alerts;
      }
      
      return [];
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      return [];
    }
  }

  // Get current stock level
  async getCurrentStock(productId: number): Promise<number> {
    try {
      const response = await productsApi.getById(productId);
      if (response.success && response.data) {
        return response.data.stock || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting current stock:', error);
      return 0;
    }
  }

  // Calculate total inventory value
  async calculateInventoryValue(): Promise<{ totalValue: number; totalProducts: number }> {
    try {
      const response = await inventoryApi.getAll({ limit: 10000 });
      
      if (response.success) {
        const inventory = Array.isArray(response.data) ? response.data : response.data?.inventory || [];
        
        let totalValue = 0;
        let totalProducts = 0;

        inventory.forEach((item: any) => {
          const stock = item.currentStock || item.stock || 0;
          const costPrice = item.costPrice || item.price || 0;
          totalValue += stock * costPrice;
          totalProducts++;
        });

        return { totalValue, totalProducts };
      }
      
      return { totalValue: 0, totalProducts: 0 };
    } catch (error) {
      console.error('Error calculating inventory value:', error);
      return { totalValue: 0, totalProducts: 0 };
    }
  }

  // Bulk stock operations for multiple products
  async bulkStockOperation(
    operations: Array<{
      productId: number;
      quantity: number;
      type: 'add' | 'deduct';
      reason?: string;
      reference?: string;
    }>
  ): Promise<{ success: boolean; results: Array<{ productId: number; success: boolean; message: string }> }> {
    const results = [];
    let allSuccessful = true;

    for (const operation of operations) {
      try {
        let result;
        
        if (operation.type === 'deduct') {
          result = await this.deductStock(
            operation.productId, 
            operation.quantity, 
            undefined, 
            operation.reference
          );
        } else {
          result = await this.addStock(
            operation.productId, 
            operation.quantity, 
            operation.reason || 'Bulk operation',
            operation.reference
          );
        }

        results.push({
          productId: operation.productId,
          success: result.success,
          message: result.message
        });

        if (!result.success) {
          allSuccessful = false;
        }
      } catch (error) {
        console.error(`Bulk operation error for product ${operation.productId}:`, error);
        results.push({
          productId: operation.productId,
          success: false,
          message: 'Operation failed'
        });
        allSuccessful = false;
      }
    }

    return { success: allSuccessful, results };
  }

  // Get stock movements history
  getMovements(): StockMovement[] {
    return this.movements;
  }

  // Get current alerts
  getAlerts(): StockAlert[] {
    return this.alerts;
  }
}

export const stockManagementService = new StockManagementService();
