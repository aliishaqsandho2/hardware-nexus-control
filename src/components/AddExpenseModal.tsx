import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, ArrowDownCircle, Building, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { expenseApi } from "@/services/expenseApi";
import { accountsApi, type Account } from "@/services/accountsApi";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
  expense?: any; // For editing
}

export default function AddExpenseModal({ open, onOpenChange, onExpenseAdded, expense }: AddExpenseModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    accountId: "",
    paymentMethod: "cash" as "cash" | "bank_transfer" | "cheque"
  });

  const defaultCategories = [
    "Purchases",
    "Rent", 
    "Utilities",
    "Transportation",
    "Marketing",
    "Office Supplies",
    "Equipment",
    "Insurance",
    "Professional Services",
    "Staff Salaries",
    "Maintenance",
    "Legal & Professional",
    "Bank Charges",
    "Interest",
    "Other"
  ];

  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchCategories();
      
      // Pre-fill form for editing
      if (expense) {
        setFormData({
          category: expense.category || "",
          description: expense.description || "",
          amount: expense.amount?.toString() || "",
          accountId: expense.account_id?.toString() || "",
          paymentMethod: expense.payment_method || "cash"
        });
        if (expense.date) {
          setSelectedDate(new Date(expense.date));
        }
      } else {
        // Reset form for new expense
        setFormData({
          category: "",
          description: "",
          amount: "",
          accountId: "",
          paymentMethod: "cash"
        });
        setSelectedDate(new Date());
      }
    }
  }, [open, expense]);

  const fetchAccounts = async () => {
    try {
      const response = await accountsApi.getAccounts({ active: true });
      if (response.success) {
        setAccounts(Array.isArray(response.data) ? response.data : []);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]); // Ensure accounts is always an array
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await expenseApi.getCategories();
      if (response.success) {
        const apiCategories = response.data; // API now returns string[] directly
        setCategories([...new Set([...defaultCategories, ...apiCategories])]);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description || !formData.amount || !selectedDate || !formData.accountId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const amount = parseFloat(formData.amount);
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount,
        date: formattedDate,
        account_id: parseInt(formData.accountId),
        reference: expense ? expense.reference : `EXP-${Date.now()}`,
        payment_method: formData.paymentMethod,
        receipt_url: expense?.receipt_url || ""
      };

      let response;
      if (expense) {
        response = await expenseApi.updateExpense(expense.id, expenseData);
      } else {
        response = await expenseApi.createExpense(expenseData);
      }

      if (response.success) {
        toast({
          title: "Success",
          description: expense ? "Expense updated successfully" : "Expense added successfully",
        });
        
        // Reset form
        setFormData({
          category: "",
          description: "",
          amount: "",
          accountId: "",
          paymentMethod: "cash"
        });
        setSelectedDate(new Date());
        
        onExpenseAdded();
        onOpenChange(false);
      } else {
        throw new Error(response.message || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountBadge = (accountType: string) => {
    const variants = {
      asset: 'default',
      expense: 'secondary',
      bank: 'outline',
      cash: 'destructive'
    };
    
    return variants[accountType as keyof typeof variants] || 'secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 p-3 rounded-lg">
              <ArrowDownCircle className="h-6 w-6 text-destructive" />
            </div>
            {expense ? "Edit Expense" : "Add New Expense"}
            <Badge variant="outline" className="ml-auto text-xs">Debit Entry</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Record a business expense that will debit the selected account
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Category and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">Amount (Rs.) *</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <ArrowDownCircle className="h-4 w-4 text-destructive" />
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10 h-11"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter detailed description of the expense"
              className="min-h-[80px] resize-none"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expense Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Select expense date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Account and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account to Debit *</Label>
              <Select value={formData.accountId} onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select account to debit" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{account.account_name}</span>
                        </div>
                        <Badge variant={getAccountBadge(account.account_type) as any} className="ml-2 text-xs">
                          {account.account_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.accountId && (
                <p className="text-xs text-muted-foreground">
                  This account will be debited with Rs. {formData.amount || "0"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method *</Label>
              <Select value={formData.paymentMethod} onValueChange={(value: "cash" | "bank_transfer" | "cheque") => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Cash Payment
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="cheque">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Cheque Payment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accounting Info */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-destructive" />
              Accounting Entry Preview
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Debit:</p>
                <p className="font-medium">
                  {formData.category || "Expense Category"} - Rs. {formData.amount || "0"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Credit:</p>
                <p className="font-medium">
                  {accounts.find(acc => acc.id.toString() === formData.accountId)?.account_name || "Selected Account"} - Rs. {formData.amount || "0"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-destructive-foreground"
            >
              {loading ? (expense ? "Updating..." : "Adding...") : (expense ? "Update Expense" : "Add Expense")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}