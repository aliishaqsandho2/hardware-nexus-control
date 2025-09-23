import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowUp, ArrowDown, Calendar, TrendingUp, TrendingDown, CreditCard, DollarSign, Users, FileText, Package, RefreshCw, Wallet, Building2, Receipt, Target, AlertCircle, Search, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeApi, type FinanceOverview, type AccountsReceivable, type AccountsPayable, type CashFlowTransaction, type ProfitAnalysis, type FinancialStatements, type Budget, type TaxSummary } from "@/services/financeApi";
import { customersApi } from "@/services/api";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Finance = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowTransaction[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis | null>(null);
  const [financialStatements, setFinancialStatements] = useState<FinancialStatements | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    fetchFinanceData();
  }, [period]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all finance data in parallel
      const [
        overviewRes,
        receivablesRes,
        payablesRes,
        cashFlowRes,
        profitRes,
        statementsRes,
        budgetRes,
        taxRes
      ] = await Promise.allSettled([
        financeApi.getOverview(period),
        financeApi.getAccountsReceivable({ limit: 10 }),
        financeApi.getAccountsPayable(),
        financeApi.getCashFlowTransactions({ per_page: 10 }),
        financeApi.getProfitAnalysis(),
        financeApi.getFinancialStatements(),
        financeApi.getBudget({ year: new Date().getFullYear() }),
        financeApi.getTaxSummary({ year: new Date().getFullYear() })
      ]);

      // Process overview data
      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setOverview(overviewRes.value.data);
      }

      // Process receivables data
      if (receivablesRes.status === 'fulfilled' && receivablesRes.value.success) {
        setReceivables(receivablesRes.value.data.receivables || []);
      }

      // Process payables data
      if (payablesRes.status === 'fulfilled' && payablesRes.value.success) {
        setPayables(payablesRes.value.data || []);
      }

      // Process cash flow data
      if (cashFlowRes.status === 'fulfilled' && cashFlowRes.value.success) {
        setCashFlow(cashFlowRes.value.data.transactions || []);
      }

      // Process profit analysis data
      if (profitRes.status === 'fulfilled' && profitRes.value.success) {
        setProfitAnalysis(profitRes.value.data);
      }

      // Process financial statements data
      if (statementsRes.status === 'fulfilled' && statementsRes.value.success) {
        setFinancialStatements(statementsRes.value.data);
      }

      // Process budget data
      if (budgetRes.status === 'fulfilled' && budgetRes.value.success) {
        setBudgets(budgetRes.value.data.budgets || []);
      }

      // Process tax summary data
      if (taxRes.status === 'fulfilled' && taxRes.value.success) {
        setTaxSummary(taxRes.value.data);
      }

    } catch (error) {
      console.error("Error fetching finance data:", error);
      setError("Failed to load finance data. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load finance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (paymentData: any) => {
    try {
      const response = await financeApi.createPayment({
        customer_id: Number(paymentData.customerId),
        account_id: 1, // Default account
        amount: Number(paymentData.amount),
        payment_method: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        date: new Date().toISOString().split('T')[0],
        payment_type: 'receipt'
      });

      if (response.success) {
        toast({
          title: "Payment Recorded",
          description: "Payment was recorded successfully.",
        });
        setIsPaymentDialogOpen(false);
        fetchFinanceData(); // Refresh all data
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="flex gap-3 items-center text-lg text-muted-foreground">
            <RefreshCw className="animate-spin h-6 w-6" />
            Loading finance data...
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Unable to Load Finance Data</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchFinanceData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 bg-background min-h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive financial overview and management</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-full sm:w-32 bg-card shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-card shadow-sm hover:bg-accent w-full sm:w-auto" onClick={fetchFinanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <PaymentDialog onSubmit={handleRecordPayment} onClose={() => setIsPaymentDialogOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">Rs. {overview.revenue.total.toLocaleString()}</p>
                  <p className="text-emerald-200 text-xs mt-1">+{overview.revenue.growth}% growth</p>
                </div>
                <div className="bg-emerald-400 bg-opacity-30 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Net Profit</p>
                  <p className="text-2xl font-bold">Rs. {overview.profit.net.toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-1">{overview.profit.margin}% margin</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Cash Flow</p>
                  <p className="text-2xl font-bold">Rs. {overview.cashFlow.net.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs mt-1">Net flow</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold">Rs. {overview.expenses.total.toLocaleString()}</p>
                  <p className="text-orange-200 text-xs mt-1">+{overview.expenses.growth}% growth</p>
                </div>
                <div className="bg-orange-400 bg-opacity-30 p-3 rounded-full">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Breakdown */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash Revenue</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">Rs. {overview.revenue.cash.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Revenue</p>
                  <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">Rs. {overview.revenue.credit.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-xl font-bold text-foreground">Rs. {overview.accountsReceivable.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Sections */}
      <Tabs defaultValue="receivables" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Accounts Receivable
                {overview && (
                  <Badge className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Rs. {overview.accountsReceivable.toLocaleString()}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receivables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No receivables found
                  </div>
                ) : (
                  receivables.map((receivable) => (
                    <div key={receivable.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{receivable.customerName}</p>
                        <p className="text-sm text-muted-foreground">{receivable.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs. {receivable.balance.toLocaleString()}</p>
                        <Badge variant={receivable.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {receivable.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                Accounts Payable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payables found
                  </div>
                ) : (
                  payables.map((payable) => (
                    <div key={payable.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{payable.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">{payable.order_number}</p>
                        <p className="text-sm text-muted-foreground">{payable.contact_person}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs. {parseFloat(payable.due_amount).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{payable.days_outstanding} days</p>
                        <Badge variant={payable.status === 'confirmed' ? 'default' : 'secondary'}>
                          {payable.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-600" />
                Cash Flow Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashFlow.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No cash flow transactions found
                  </div>
                ) : (
                  cashFlow.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.reference}</p>
                        <p className="text-sm text-muted-foreground">{transaction.account_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'inflow' ? '+' : '-'}Rs. {parseFloat(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        <Badge variant={transaction.type === 'inflow' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          {profitAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gross Profit Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">Rs. {parseFloat(profitAnalysis.gross_profit_analysis.total_revenue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>External Purchases:</span>
                    <span className="font-medium">Rs. {parseFloat(profitAnalysis.gross_profit_analysis.total_external_purchases).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Gross Profit:</span>
                    <span className="font-bold text-green-600">Rs. {parseFloat(profitAnalysis.gross_profit_analysis.gross_profit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin:</span>
                    <span className="font-medium">{parseFloat(profitAnalysis.gross_profit_analysis.gross_profit_margin).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Net Profit Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">Rs. {parseFloat(profitAnalysis.net_profit_analysis.total_revenue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span className="font-medium">Rs. {parseFloat(profitAnalysis.net_profit_analysis.total_expenses).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Profit:</span>
                    <span className="font-bold text-blue-600">Rs. {parseFloat(profitAnalysis.net_profit_analysis.net_profit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin:</span>
                    <span className="font-medium">{parseFloat(profitAnalysis.net_profit_analysis.net_profit_margin).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  No profit analysis data available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          {financialStatements ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Income Statement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">Rs. {financialStatements.income_statement.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost of Goods Sold:</span>
                    <span className="font-medium">Rs. {financialStatements.income_statement.cost_of_goods_sold.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gross Profit:</span>
                    <span className="font-medium">Rs. {financialStatements.income_statement.gross_profit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expenses:</span>
                    <span className="font-medium">Rs. {financialStatements.income_statement.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Income:</span>
                    <span className="font-bold text-green-600">Rs. {financialStatements.income_statement.net_income.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Balance Sheet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Assets</h4>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Current Assets:</span>
                        <span>Rs. {financialStatements.balance_sheet.assets.current_assets.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Assets:</span>
                        <span>Rs. {financialStatements.balance_sheet.assets.total_assets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Liabilities</h4>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Current Liabilities:</span>
                        <span>Rs. {financialStatements.balance_sheet.liabilities.current_liabilities.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Liabilities:</span>
                        <span>Rs. {financialStatements.balance_sheet.liabilities.total_liabilities.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Equity</h4>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Total Equity:</span>
                        <span>Rs. {financialStatements.balance_sheet.equity.total_equity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  No financial statements data available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Budget Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No budget data available
                  </div>
                ) : (
                  budgets.map((budget) => (
                    <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{budget.category}</p>
                        <p className="text-sm text-muted-foreground">{budget.year}-{budget.month.padStart(2, '0')}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="font-medium">Rs. {parseFloat(budget.budget_amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Actual</p>
                            <p className="font-medium">Rs. {parseFloat(budget.actual_amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Variance</p>
                            <p className={`font-medium ${parseFloat(budget.variance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Rs. {parseFloat(budget.variance).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Customer type for the picker
interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

// Payment Dialog Component
const PaymentDialog = ({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) => {
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState({
    customerId: '',
    customerName: '',
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: ''
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  // Fetch customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await customersApi.getAll({ limit: 100 });
      if (response.success && response.data?.customers) {
        setCustomers(response.data.customers.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        })));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setPaymentData({
      ...paymentData,
      customerId: customer.id.toString(),
      customerName: customer.name
    });
    setCustomerPickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.customerId) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }
    if (!paymentData.amount) {
      toast({
        title: "Error",
        description: "Please enter payment amount.",
        variant: "destructive",
      });
      return;
    }
    if (!paymentData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please select payment method.",
        variant: "destructive",
      });
      return;
    }
    onSubmit(paymentData);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-green-600" />
          Record Payment
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Picker */}
        <div className="space-y-2">
          <Label htmlFor="customer">Customer *</Label>
          <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerPickerOpen}
                className="w-full justify-between"
                disabled={customersLoading}
              >
                {paymentData.customerName ? (
                  <span className="truncate">{paymentData.customerName}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {customersLoading ? "Loading customers..." : "Select customer..."}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search customers..." />
                <CommandList>
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.name} ${customer.phone} ${customer.email}`}
                        onSelect={() => handleCustomerSelect(customer)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            paymentData.customerId === customer.id.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          {customer.phone && (
                            <span className="text-sm text-muted-foreground">{customer.phone}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="Enter payment amount (e.g., 5000.00)"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            required
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select
            value={paymentData.paymentMethod}
            onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">💵 Cash</SelectItem>
              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
              <SelectItem value="cheque">📋 Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reference (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="reference">Reference <span className="text-muted-foreground">(Optional)</span></Label>
          <Input
            id="reference"
            placeholder="Enter payment reference (e.g., CHQ-001, TXN-123)"
            value={paymentData.reference}
            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
          />
        </div>

        {/* Notes (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes <span className="text-muted-foreground">(Optional)</span></Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes or comments about this payment..."
            rows={3}
            value={paymentData.notes}
            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700"
            disabled={!paymentData.customerId || !paymentData.amount || !paymentData.paymentMethod}
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default Finance;