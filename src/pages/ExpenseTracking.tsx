
import { useState, useEffect } from "react";
import { Plus, Search, Filter, Calendar, TrendingUp, TrendingDown, Edit2, Trash2, Eye, Download, DollarSign, ChevronDown, Tag, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { expenseApi, type Expense } from "@/services/expenseApi";
import AddExpenseModal from "@/components/AddExpenseModal";
import ScheduleExpenseModal from "@/components/ScheduleExpenseModal";
import AddExpenseCategoryModal from "@/components/AddExpenseCategoryModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ExpenseSummary {
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
}

export default function ExpenseTracking() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    expensesByCategory: [],
    expensesByPaymentMethod: [],
    expensesByAccount: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchExpenses();
    fetchExpenseSummary();
  }, [selectedCategory, currentPage]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 50
      };
      
      if (selectedCategory) {
        params.category = selectedCategory;
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
      const response = await expenseApi.getExpenseSummary({ period: 'month' });
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching expense summary:', error);
    }
  };

  const calculateSummary = (expenseData: Expense[]) => {
    const totalExpenses = expenseData.reduce((sum, exp) => sum + exp.amount, 0);
    
    const categoryMap = new Map();
    const paymentMethodMap = new Map();
    
    expenseData.forEach(expense => {
      // Categories
      const cat = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: cat.amount + expense.amount,
        count: cat.count + 1
      });
      
      // Payment methods
      const pm = paymentMethodMap.get(expense.payment_method) || { amount: 0, count: 0 };
      paymentMethodMap.set(expense.payment_method, {
        amount: pm.amount + expense.amount,
        count: pm.count + 1
      });
    });
    
    setSummary({
      totalExpenses,
      expensesByCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / totalExpenses) * 100
      })),
      expensesByPaymentMethod: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
        payment_method: method,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / totalExpenses) * 100
      })),
      expensesByAccount: [],
      monthlyTrend: []
    });
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

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const todayExpenses = expenses
    .filter(expense => {
      const today = new Date().toLocaleDateString('en-GB');
      return expense.date === today;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const thisMonthExpenses = expenses
    .filter(expense => {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const expenseMonth = expense.date.split('/').reverse().join('-').slice(0, 7);
      return expenseMonth === thisMonth;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const getPaymentMethodBadge = (method: string | undefined | null) => {
    // Handle undefined, null, or empty method
    if (!method) {
      return (
        <Badge variant="secondary">
          Unknown
        </Badge>
      );
    }

    const variants = {
      cash: 'default',
      bank_transfer: 'outline', 
      cheque: 'secondary'
    };
    
    return (
      <Badge variant={variants[method as keyof typeof variants] as any || 'secondary'}>
        {method.replace('_', ' ')}
      </Badge>
    );
  };

  const pieChartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-slate-600">Loading expense data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 min-h-[calc(100vh-65px)]">
      {/* Top Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
        <Button 
          variant="outline"
          onClick={() => setShowScheduleModal(true)}
          className="border-border hover:bg-accent"
        >
          <Clock className="h-4 w-4 mr-2" />
          Schedule Expense
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-border hover:bg-accent">
              <Tag className="h-4 w-4 mr-2" />
              Categories
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowCategoryModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View All Categories
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-destructive text-destructive-foreground border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-destructive-foreground/80 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold">Rs. {(summary.totalExpenses || 0).toLocaleString()}</p>
              </div>
              <div className="bg-destructive-foreground/20 p-3 rounded-full">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500 text-white border-2 shadow-lg dark:bg-orange-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold">Rs. {(thisMonthExpenses || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500 text-white border-2 shadow-lg dark:bg-yellow-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Today</p>
                <p className="text-2xl font-bold">Rs. {(todayExpenses || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold">{(summary.expensesByCategory || []).length}</p>
              </div>
              <div className="bg-primary-foreground/20 p-3 rounded-full">
                <Badge className="bg-primary-foreground/20 text-primary-foreground">{expenses.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Expenses */}
      <Card className="shadow-lg border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center gap-2">
            <div className="bg-accent p-2 rounded-lg">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            Scheduled Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No scheduled expenses</p>
            <p className="text-sm">Use the "Schedule Expense" button to create recurring expenses.</p>
          </div>
        </CardContent>
      </Card>

      {/* Expense Management */}
      <Card className=" shadow-xl border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Eye className="h-5 w-5 text-indigo-600" />
            </div>
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="Search expenses..." 
                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-500 font-semibold">Category</TableHead>
                  <TableHead className="text-slate-500 font-semibold">Description</TableHead>
                  <TableHead className="text-slate-500 font-semibold">Amount</TableHead>
                  <TableHead className="text-slate-500 font-semibold">Date</TableHead>
                  <TableHead className="text-slate-500 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="border-slate-100 hover:bg-slate-50">
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700">{expense.description}</TableCell>
                    <TableCell className="font-semibold text-red-600">Rs. {(expense.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-slate-600">{expense.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingExpense(expense)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium">No expenses found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddExpenseModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onExpenseAdded={fetchExpenses}
      />

      <ScheduleExpenseModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        onExpenseScheduled={fetchExpenses}
      />

      <AddExpenseCategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onCategoryAdded={fetchExpenses}
      />

      {/* Edit Expense Modal */}
      {editingExpense && (
        <ExpenseFormModal
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) {
              setEditingExpense(null);
            }
          }}
          expense={editingExpense}
          onSubmit={(data) => handleUpdateExpense(editingExpense.id, data)}
        />
      )}
    </div>
  );
}

const ExpenseFormModal = ({ 
  open, 
  onOpenChange, 
  expense, 
  onSubmit 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSubmit: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    accountId: '',
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'cheque',
    reference: '',
    date: ''
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category,
        description: expense.description || '',
        amount: expense.amount.toString(),
        accountId: '',
        payment_method: expense.payment_method,
        reference: expense.reference,
        date: expense.date
      });
    } else {
      setFormData({
        category: '',
        description: '',
        amount: '',
        accountId: '',
        payment_method: 'cash',
        reference: '',
        date: new Date().toLocaleDateString('en-GB')
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      reference: formData.reference || `EXP-${Date.now()}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => setFormData({...formData, category: value})} value={formData.category}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="office_supplies">Office Supplies</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="professional_services">Professional Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description"
              placeholder="Expense description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Rs.)</Label>
            <Input 
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Debit from Account</Label>
            <Select onValueChange={(value) => setFormData({...formData, accountId: value})} value={formData.accountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BA001">Main Business Account (BA001)</SelectItem>
                <SelectItem value="CA001">Cash Register (CA001)</SelectItem>
                <SelectItem value="SA001">Staff Salary Account (SA001)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select onValueChange={(value: 'cash' | 'bank_transfer' | 'cheque') => setFormData({...formData, payment_method: value})} value={formData.payment_method}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input 
              id="reference"
              placeholder="Transaction reference"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">{expense ? 'Update' : 'Add'} Expense</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-800 flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Office Supplies"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">Amount (Rs.) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Describe the expense..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-sm font-medium text-slate-700">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date ? formData.date.split('/').reverse().join('-') : ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setFormData({ ...formData, date: date.toLocaleDateString('en-GB') });
              }}
              required
              className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={!formData.category || !formData.amount || !formData.date}
            >
              {expense ? 'Update Expense' : 'Add Expense'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
