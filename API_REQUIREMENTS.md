# Complete API Requirements for Finance, Expense, and Accounts Management

## Current Status
- ✅ **Working**: Accounts GET/POST/Summary
- ⚠️ **Partially Working**: Finance Overview, Accounts Receivable  
- ❌ **Not Working**: Expenses (404), Account DELETE, Payment Management

---

## 1. ACCOUNTS MANAGEMENT APIs

### Core Account Operations
```php
// ✅ Already Working
GET /wp-json/ims/v1/accounts
POST /wp-json/ims/v1/accounts
GET /wp-json/ims/v1/accounts/summary

// ❌ NEEDS IMPLEMENTATION
PUT /wp-json/ims/v1/accounts/{id}
DELETE /wp-json/ims/v1/accounts/{id}
```

**PUT /accounts/{id}** - Update Account
```json
Request Body:
{
  "account_code": "string",
  "account_name": "string", 
  "account_type": "asset|liability|equity|revenue|expense|bank|cash",
  "balance": number,
  "is_active": boolean
}

Response:
{
  "success": true,
  "message": "Account updated successfully",
  "data": {
    "id": "9",
    "account_code": "BA001",
    "account_name": "Updated Account",
    "account_type": "bank",
    "balance": "15000.00",
    "is_active": "1",
    "created_at": "2025-09-23 10:45:50"
  }
}
```

**DELETE /accounts/{id}** - Delete Account
```json
Response:
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "deleted": true
  }
}
```

### Balance Management
```php
POST /wp-json/ims/v1/accounts/{id}/balance
```

**POST /accounts/{id}/balance** - Update Balance
```json
Request Body:
{
  "amount": number,
  "type": "credit|debit",
  "description": "string",
  "reference": "string"
}

Response:
{
  "success": true,
  "message": "Balance updated successfully",
  "data": {
    "id": "1",
    "account_code": "1001",
    "account_name": "Cash Account",
    "account_type": "cash",
    "balance": "25000.00",
    "is_active": "1"
  }
}
```

### Transaction Management
```php
GET /wp-json/ims/v1/transactions
POST /wp-json/ims/v1/transactions
```

**GET /transactions** - Get Transactions
```json
Query Parameters:
- account_id?: number
- reference_type?: "sale|purchase|payment|expense|adjustment"
- date_from?: "YYYY-MM-DD"
- date_to?: "YYYY-MM-DD"
- page?: number
- limit?: number

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "transaction_date": "2025-09-23",
      "transaction_number": "TXN-001",
      "description": "Payment received",
      "reference_type": "payment",
      "reference_id": 123,
      "total_amount": "5000.00",
      "created_at": "2025-09-23 10:45:50"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 50,
    "limit": 10
  }
}
```

**POST /transactions** - Create Transaction
```json
Request Body:
{
  "transaction_date": "2025-09-23",
  "transaction_number": "TXN-001", 
  "description": "Payment received",
  "reference_type": "payment",
  "reference_id": 123,
  "total_amount": 5000.00
}

Response: Same as GET single transaction
```

### Cash Flow Management
```php
GET /wp-json/ims/v1/cash-flow
POST /wp-json/ims/v1/cash-flow
GET /wp-json/ims/v1/cash-flow/summary
```

**GET /cash-flow** - Get Cash Flow
```json
Query Parameters:
- account_id?: number
- type?: "inflow|outflow"
- date_from?: "YYYY-MM-DD" 
- date_to?: "YYYY-MM-DD"
- page?: number
- limit?: number

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "inflow",
      "account_id": 1,
      "transaction_id": 1,
      "amount": "5000.00",
      "reference": "SALE-001",
      "description": "Product sale",
      "date": "2025-09-23",
      "created_at": "2025-09-23 10:45:50"
    }
  ]
}
```

**GET /cash-flow/summary** - Cash Flow Summary
```json
Query Parameters:
- period?: "today|week|month|year"

Response:
{
  "success": true,
  "data": {
    "totalInflow": 150000.00,
    "totalOutflow": 45000.00,
    "netCashFlow": 105000.00,
    "inflowByAccount": [
      {
        "account_id": 1,
        "account_name": "Cash Account",
        "amount": 75000.00
      }
    ],
    "outflowByAccount": [
      {
        "account_id": 2,
        "account_name": "Operating Expenses",
        "amount": 25000.00
      }
    ]
  }
}
```

---

## 2. EXPENSE MANAGEMENT APIs

### Core Expense Operations
```php
// ❌ ALL NEED IMPLEMENTATION (Currently 404)
GET /wp-json/ims/v1/finance/expenses
POST /wp-json/ims/v1/finance/expenses  
PUT /wp-json/ims/v1/finance/expenses/{id}
DELETE /wp-json/ims/v1/finance/expenses/{id}
```

**GET /finance/expenses** - Get Expenses
```json
Query Parameters:
- category?: string
- account_id?: number
- payment_method?: "cash|bank_transfer|cheque"
- date_from?: "YYYY-MM-DD"
- date_to?: "YYYY-MM-DD"
- page?: number
- limit?: number

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "Office Supplies",
      "account_id": 1,
      "transaction_id": 1,
      "description": "Monthly office supplies",
      "amount": "2500.00",
      "date": "2025-09-23",
      "reference": "EXP-001",
      "payment_method": "cash",
      "receipt_url": null,
      "created_by": 1,
      "created_at": "2025-09-23 10:45:50"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 50,
    "limit": 10
  }
}
```

**POST /finance/expenses** - Create Expense
```json
Request Body:
{
  "category": "Office Supplies",
  "account_id": 1,
  "description": "Monthly office supplies",
  "amount": 2500.00,
  "date": "2025-09-23",
  "reference": "EXP-001",
  "payment_method": "cash",
  "receipt_url": "optional",
  "created_by": 1
}

Response: Same as GET single expense
```

### Expense Categories
```php
GET /wp-json/ims/v1/finance/expenses/categories
POST /wp-json/ims/v1/finance/expenses/categories
PUT /wp-json/ims/v1/finance/expenses/categories/{id}
DELETE /wp-json/ims/v1/finance/expenses/categories/{id}
```

**GET /finance/expenses/categories** - Get Categories
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Office Supplies",
      "description": "Office related expenses",
      "is_active": true,
      "created_at": "2025-09-23 10:45:50"
    }
  ]
}
```

### Expense Analytics
```php
GET /wp-json/ims/v1/finance/expenses/summary
```

**GET /finance/expenses/summary** - Expense Summary
```json
Query Parameters:
- period?: "today|week|month|year"
- date_from?: "YYYY-MM-DD"
- date_to?: "YYYY-MM-DD"

Response:
{
  "success": true,
  "data": {
    "totalExpenses": 25000.00,
    "expensesByCategory": [
      {
        "category": "Office Supplies",
        "amount": 5000.00,
        "count": 5,
        "percentage": 20.0
      }
    ],
    "expensesByPaymentMethod": [
      {
        "payment_method": "cash",
        "amount": 15000.00,
        "count": 10,
        "percentage": 60.0
      }
    ],
    "expensesByAccount": [
      {
        "account_id": 1,
        "account_name": "Cash Account",
        "amount": 10000.00,
        "count": 8
      }
    ],
    "monthlyTrend": [
      {
        "month": "2025-09",
        "amount": 25000.00,
        "count": 15
      }
    ]
  }
}
```

### Bulk Operations
```php
POST /wp-json/ims/v1/finance/expenses/bulk-delete
POST /wp-json/ims/v1/finance/expenses/bulk-update-category
```

**POST /finance/expenses/bulk-delete** - Bulk Delete
```json
Request Body:
{
  "ids": [1, 2, 3, 4, 5]
}

Response:
{
  "success": true,
  "data": {
    "deleted": 5
  },
  "message": "5 expenses deleted successfully"
}
```

### Export & Scheduled Expenses  
```php
GET /wp-json/ims/v1/finance/expenses/export
GET /wp-json/ims/v1/finance/expenses/scheduled
POST /wp-json/ims/v1/finance/expenses/scheduled
```

---

## 3. FINANCE MANAGEMENT APIs

### Finance Overview
```php
// ✅ Partially Working
GET /wp-json/ims/v1/finance/overview
```

**Enhanced GET /finance/overview** - Finance Overview
```json
Query Parameters:
- period?: "today|week|month|year"

Response:
{
  "success": true,
  "data": {
    "revenue": {
      "total": 150000.00,
      "cash": 90000.00,
      "credit": 60000.00,
      "growth": 12.5
    },
    "expenses": {
      "total": 45000.00,
      "purchases": 30000.00,
      "operational": 15000.00,
      "growth": 8.2
    },
    "profit": {
      "gross": 125000.00,
      "net": 105000.00,
      "margin": 70.0
    },
    "cashFlow": {
      "inflow": 150000.00,
      "outflow": 45000.00,
      "net": 105000.00
    },
    "accountsReceivable": 25000.00,
    "accountsPayable": 15000.00
  }
}
```

### Payment Management
```php
// ❌ NEEDS IMPLEMENTATION
GET /wp-json/ims/v1/finance/payments
POST /wp-json/ims/v1/finance/payments
PUT /wp-json/ims/v1/finance/payments/{id}
DELETE /wp-json/ims/v1/finance/payments/{id}
PUT /wp-json/ims/v1/finance/payments/{id}/status
```

**POST /finance/payments** - Record Payment
```json
Request Body:
{
  "customer_id": 1,
  "account_id": 1,
  "amount": 5000.00,
  "payment_method": "cash",
  "reference": "PAY-001",
  "notes": "Payment for invoice INV-001",
  "date": "2025-09-23",
  "payment_type": "receipt"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "customer_id": 1,
    "transaction_id": 1,
    "account_id": 1,
    "amount": "5000.00",
    "payment_method": "cash",
    "reference": "PAY-001",
    "notes": "Payment for invoice INV-001",
    "date": "2025-09-23",
    "payment_type": "receipt",
    "status": "pending",
    "created_at": "2025-09-23 10:45:50"
  },
  "message": "Payment recorded successfully"
}
```

### Accounts Receivable
```php  
// ✅ Partially Working
GET /wp-json/ims/v1/finance/accounts-receivable
```

### Accounts Payable
```php
// ❌ NEEDS IMPLEMENTATION
GET /wp-json/ims/v1/finance/accounts-payable
```

**GET /finance/accounts-payable** - Accounts Payable
```json
Query Parameters:
- supplier_id?: number
- status?: "pending|overdue|paid"
- limit?: number

Response:
{
  "success": true,
  "data": {
    "payables": [
      {
        "id": 1,
        "supplierName": "ABC Suppliers",
        "supplierId": 101,
        "purchaseOrderNumber": "PO-001",
        "invoiceNumber": "SINV-001",
        "amount": 15000.00,
        "balance": 12000.00,
        "paidAmount": 3000.00,
        "dueDate": "2025-10-01",
        "daysOverdue": 0,
        "status": "pending"
      }
    ],
    "summary": {
      "totalPayables": 25000.00,
      "overdueAmount": 5000.00,
      "overdueCount": 2
    }
  }
}
```

### Cash Flow Transactions
```php
// ❌ NEEDS IMPLEMENTATION  
GET /wp-json/ims/v1/finance/cash-flow-transactions
POST /wp-json/ims/v1/finance/cash-flow-transactions
```

### Financial Reports
```php
// ❌ NEEDS IMPLEMENTATION
GET /wp-json/ims/v1/finance/profit-loss
GET /wp-json/ims/v1/finance/balance-sheet
GET /wp-json/ims/v1/finance/cash-flow-statement
GET /wp-json/ims/v1/finance/trial-balance
```

---

## 4. PAYMENT ALLOCATIONS

```php
// ❌ NEEDS IMPLEMENTATION
GET /wp-json/ims/v1/payment-allocations
POST /wp-json/ims/v1/payment-allocations
GET /wp-json/ims/v1/payments/{id}/allocations
```

**POST /payment-allocations** - Allocate Payment
```json
Request Body:
{
  "payment_id": 1,
  "invoice_id": 1,
  "invoice_type": "sale",
  "allocated_amount": 5000.00,
  "allocation_date": "2025-09-23"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "payment_id": 1,
    "invoice_id": 1,
    "invoice_type": "sale", 
    "allocated_amount": "5000.00",
    "allocation_date": "2025-09-23",
    "created_at": "2025-09-23 10:45:50"
  }
}
```

---

## 5. ADDITIONAL FEATURES TO IMPLEMENT

### Budget Management
```php
GET /wp-json/ims/v1/finance/budgets
POST /wp-json/ims/v1/finance/budgets
PUT /wp-json/ims/v1/finance/budgets/{id}
```

### Tax Management
```php
GET /wp-json/ims/v1/finance/tax-summary
GET /wp-json/ims/v1/finance/tax-categories
```

### Profit Analysis
```php
GET /wp-json/ims/v1/finance/profit-analysis
```

---

## IMMEDIATE PRIORITIES

1. **Fix Account DELETE** (currently failing with "Failed to fetch")
2. **Implement ALL Expense APIs** (currently 404)
3. **Add Payment Management APIs**
4. **Complete Accounts Payable APIs**
5. **Add Financial Reporting APIs**

This comprehensive API implementation will make all three pages (Finance, Expense Management, Accounts) fully functional with create, read, update, delete operations plus advanced analytics and reporting capabilities.