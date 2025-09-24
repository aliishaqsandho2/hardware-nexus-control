import { useState, useEffect } from "react";
import { Plus, Search, Calendar, TrendingUp, Edit2, Trash2, Download, Tag, Clock, RefreshCw, ArrowDownCircle, Wallet, CreditCard, Building, Receipt, BarChart3, PieChartIcon, CheckSquare, FileDown, PlayCircle, PauseCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { expenseApi, type Expense, type ScheduledExpense } from "@/services/expenseApi";
import AddExpenseModal from "@/components/AddExpenseModal";
import ScheduleExpenseModal from "@/components/ScheduleExpenseModal";
import AddExpenseCategoryModal from "@/components/AddExpenseCategoryModal";

interface ExpenseSummary {
  total: { count: number; amount: number };
  by_category: Array<{ 
    category: string; 
    amount: number; 
    count: number; 
    percentage: number; 
  }>;
  by_payment_method: Array<{ 
    payment_method: string; 
    amount: number; 
    count: number; 
    percentage: number; 
  }>;
  monthly_trend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export default function ExpenseTracking() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [scheduledExpenses, setScheduledExpenses] = useState<ScheduledExpense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    total: { count: 0, amount: 0 },
    by_category: [],
    by_payment_method: [],
    monthly_trend: []
  });
  const [upcomingExecutions, setUpcomingExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("month");
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledExpense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("expenses");

  useEffect(() => {
    fetchExpenses();
    fetchExpenseSummary();
    fetchCategories();
  }, [selectedCategory, selectedDateRange, currentPage]);

  useEffect(() => {
    if (activeTab === "scheduled") {
      fetchScheduledExpenses();
      fetchUpcomingExecutions();
    }
  }, [activeTab]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 50
      };
      
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      // Add date range filter
      if (selectedDateRange === "today") {
        const today = new Date().toISOString().split('T')[0];
        params.date_from = today;
        params.date_to = today;
      } else if (selectedDateRange === "week") {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.date_from = weekAgo.toISOString().split('T')[0];
        params.date_to = today.toISOString().split('T')[0];
      } else if (selectedDateRange === "month") {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        params.date_from = monthAgo.toISOString().split('T')[0];
        params.date_to = today.toISOString().split('T')[0];
      }

      const response = await expenseApi.getExpenses(params);
      
      if (response.success) {
        setExpenses(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expense data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseSummary = async () => {
    try {
      const params: any = {};
      
      if (selectedDateRange === "today") {
        const today = new Date().toISOString().split('T')[0];
        params.date_from = today;
        params.date_to = today;
      } else if (selectedDateRange === "week") {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.date_from = weekAgo.toISOString().split('T')[0];
        params.date_to = today.toISOString().split('T')[0];
      } else if (selectedDateRange === "month") {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        params.date_from = monthAgo.toISOString().split('T')[0];
        params.date_to = today.toISOString().split('T')[0];
      }

      const response = await expenseApi.getExpenseSummary(params);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching expense summary:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await expenseApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchScheduledExpenses = async () => {
    try {
      const response = await expenseApi.getScheduledExpenses();
      if (response.success) {
        setScheduledExpenses(response.data);
      }
    } catch (error) {
      console.error('Error fetching scheduled expenses:', error);
    }
  };

  const fetchUpcomingExecutions = async () => {
    try {
      const response = await expenseApi.getNextExecutions(7);
      if (response.success) {
        setUpcomingExecutions(response.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming executions:', error);
    }
  };

  const handleCreateExpense = async (expenseData: any) => {
    try {
      const response = await expenseApi.createExpense(expenseData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
        setShowAddModal(false);
        fetchExpenses();
        fetchExpenseSummary();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExpense = async (id: number, expenseData: any) => {
    try {
      const response = await expenseApi.updateExpense(id, expenseData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
        setEditingExpense(null);
        fetchExpenses();
        fetchExpenseSummary();
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const response = await expenseApi.deleteExpense(id);
      if (response.success) {
        toast({
          title: "Success", 
          description: "Expense deleted successfully",
        });
        fetchExpenses();
        fetchExpenseSummary();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) {
      toast({
        title: "Warning",
        description: "Please select expenses to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedExpenses.length} selected expenses?`)) return;

    try {
      const response = await expenseApi.bulkDeleteExpenses(selectedExpenses);
      if (response.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setSelectedExpenses([]);
        fetchExpenses();
        fetchExpenseSummary();
      }
    } catch (error) {
      console.error('Error bulk deleting expenses:', error);
      toast({
        title: "Error",
        description: "Failed to delete expenses",
        variant: "destructive",
      });
    }
  };

  const handleExportExpenses = async () => {
    try {
      const params: any = {};
      
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (selectedDateRange === "today") {
        const today = new Date().toISOString().split('T')[0];
        params.date_from = today;
        params.date_to = today;
      } else if (selectedDateRange === "week") {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.date_from = weekAgo.toISOString().split('T')[0];
        params.date_to = today.toISOString().split('T')[0];
      } else if (selectedDateRange === "month") {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        params.date_from = monthAgo.toISOString().split('T')[0];
        params.date_to = today.toISOString().split('T')[0];
      }

      const response = await expenseApi.exportExpenses(params);
      if (response.success) {
        // Create and download file
        const jsonData = JSON.stringify(response.data.data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: `Exported ${response.data.export_info.total_records} expenses`,
        });
      }
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast({
        title: "Error",
        description: "Failed to export expenses",
        variant: "destructive",
      });
    }
  };

  const handleScheduledExpenseToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const response = await expenseApi.updateScheduledExpenseStatus(id, newStatus as any);
      if (response.success) {
        toast({
          title: "Success",
          description: `Scheduled expense ${newStatus}`,
        });
        fetchScheduledExpenses();
      }
    } catch (error) {
      console.error('Error updating scheduled expense status:', error);
      toast({
        title: "Error",
        description: "Failed to update scheduled expense status",
        variant: "destructive",
      });
    }
  };

  const handleExecuteScheduledExpense = async (id: number) => {
    try {
      const response = await expenseApi.executeScheduledExpense(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Scheduled expense executed successfully",
        });
        fetchScheduledExpenses();
        fetchExpenses();
        fetchExpenseSummary();
        fetchUpcomingExecutions();
      }
    } catch (error) {
      console.error('Error executing scheduled expense:', error);
      toast({
        title: "Error",
        description: "Failed to execute scheduled expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScheduledExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled expense?')) return;
    
    try {
      const response = await expenseApi.deleteScheduledExpense(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Scheduled expense deleted successfully",
        });
        fetchScheduledExpenses();
      }
    } catch (error) {
      console.error('Error deleting scheduled expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete scheduled expense",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const todayExpenses = expenses
    .filter(expense => {
      const today = new Date().toISOString().split('T')[0];
      return expense.date === today;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const thisMonthExpenses = expenses
    .filter(expense => {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const expenseMonth = expense.date.slice(0, 7);
      return expenseMonth === thisMonth;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      case 'cheque': return <Receipt className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      cash: 'default',
      bank_transfer: 'secondary', 
      cheque: 'outline'
    };
    
    return (
      <Badge variant={variants[method as keyof typeof variants] as any || 'secondary'} className="flex items-center gap-1">
        {getPaymentMethodIcon(method)}
        {method.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      inactive: 'outline'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getFrequencyBadge = (frequency: string) => {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {frequency}
      </Badge>
    );
  };

  const pieChartColors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground animate-pulse">Loading expense data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background/95 to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
            <p className="text-muted-foreground">Track and manage your business expenses efficiently</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchExpenses()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-destructive to-destructive/90 text-destructive-foreground border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-destructive-foreground/80 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold">Rs. {(summary.total?.amount || 0).toLocaleString()}</p>
                <p className="text-xs text-destructive-foreground/60 mt-1">{summary.total?.count || 0} transactions</p>
              </div>
              <div className="bg-destructive-foreground/20 p-3 rounded-full">
                <ArrowDownCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold">Rs. {(thisMonthExpenses || 0).toLocaleString()}</p>
                <p className="text-xs text-orange-200 mt-1">{expenses.filter(e => e.date.slice(0, 7) === new Date().toISOString().slice(0, 7)).length} transactions</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Today</p>
                <p className="text-2xl font-bold">Rs. {(todayExpenses || 0).toLocaleString()}</p>
                <p className="text-xs text-amber-200 mt-1">{expenses.filter(e => e.date === new Date().toISOString().split('T')[0]).length} transactions</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-primary-foreground/60 mt-1">Scheduled: {scheduledExpenses.length}</p>
              </div>
              <div className="bg-primary-foreground/20 p-3 rounded-full">
                <Tag className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Regular Expenses
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          {/* Filters and Actions */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search expenses, categories, or references..." 
                    className="pl-10 border-border bg-background/50" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-full sm:w-40 border-border bg-background/50">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40 border-border bg-background/50">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Expense
                </Button>
                <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
                <Button variant="outline" onClick={handleExportExpenses}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {selectedExpenses.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedExpenses.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.by_category || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {(summary.by_category || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {(summary.by_category || []).slice(0, 5).map((cat, index) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pieChartColors[index % pieChartColors.length] }}
                        />
                        <span className="text-foreground font-medium">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">Rs. {cat.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Breakdown */}
            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(summary.by_payment_method || []).map((method, index) => (
                    <div key={method.payment_method} className="bg-muted/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(method.payment_method)}
                          <span className="text-sm font-medium text-foreground">
                            {method.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant="outline">{method.percentage}%</Badge>
                      </div>
                      <p className="text-lg font-bold text-foreground">Rs. {method.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{method.count} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Table */}
          <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">Recent Expenses</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedExpenses(filteredExpenses.map(e => e.id));
                    } else {
                      setSelectedExpenses([]);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/20">
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="text-foreground font-semibold">Date</TableHead>
                      <TableHead className="text-foreground font-semibold">Category</TableHead>
                      <TableHead className="text-foreground font-semibold">Description</TableHead>
                      <TableHead className="text-foreground font-semibold">Amount</TableHead>
                      <TableHead className="text-foreground font-semibold">Payment Method</TableHead>
                      <TableHead className="text-foreground font-semibold w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredExpenses || []).map((expense) => (
                      <TableRow key={expense.id} className="border-border hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedExpenses.includes(expense.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExpenses([...selectedExpenses, expense.id]);
                              } else {
                                setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-foreground font-medium">{expense.date}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{expense.description}</TableCell>
                        <TableCell className="text-foreground font-bold">Rs. {expense.amount.toLocaleString()}</TableCell>
                        <TableCell>{getPaymentMethodBadge(expense.payment_method)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingExpense(expense)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Edit2 className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          {/* Upcoming Executions */}
          <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Upcoming Executions (Next 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingExecutions.map((execution) => (
                  <Card key={execution.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {execution.days_until} days
                        </Badge>
                        <span className="text-sm font-bold text-foreground">
                          Rs. {parseFloat(execution.amount).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-medium mb-1">
                        {execution.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {execution.next_execution} • {execution.frequency}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Expenses List */}
          <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">Scheduled Expenses</CardTitle>
              <Button onClick={() => setShowScheduleModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Scheduled Expense
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledExpenses.map((scheduled) => (
                  <Card key={scheduled.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{scheduled.description}</h4>
                            {getStatusBadge(scheduled.status)}
                            {getFrequencyBadge(scheduled.frequency)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Category</p>
                              <p className="font-medium text-foreground">{scheduled.category}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Amount</p>
                              <p className="font-bold text-foreground">Rs. {scheduled.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Next Execution</p>
                              <p className="font-medium text-foreground">{scheduled.next_execution}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Executions</p>
                              <p className="font-medium text-foreground">{scheduled.execution_count}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleScheduledExpenseToggle(scheduled.id, scheduled.status)}
                            className="h-8 w-8 p-0"
                          >
                            {scheduled.status === 'active' ? (
                              <PauseCircle className="h-4 w-4 text-orange-500" />
                            ) : (
                              <PlayCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExecuteScheduledExpense(scheduled.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Zap className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingScheduled(scheduled)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScheduledExpense(scheduled.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddExpenseModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onExpenseAdded={() => {
          setEditingExpense(null);
          fetchExpenses();
          fetchExpenseSummary();
        }}
        expense={editingExpense}
      />

      <ScheduleExpenseModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        onExpenseScheduled={() => {
          fetchScheduledExpenses();
        }}
      />

      <AddExpenseCategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onCategoryAdded={() => {
          fetchCategories();
        }}
      />
    </div>
  );
}