import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Repeat, Edit2, Trash2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ScheduledExpense {
  id: number;
  category: string;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_execution: string;
  status: 'active' | 'paused' | 'inactive';
  account_id?: number;
  payment_method: string;
  created_at: string;
  last_executed?: string;
  execution_count?: number;
}

interface ScheduledExpensesListProps {
  onEdit?: (expense: ScheduledExpense) => void;
  onToggleStatus?: (id: number, status: 'active' | 'paused') => void;
  onDelete?: (id: number) => void;
}

export default function ScheduledExpensesList({ onEdit, onToggleStatus, onDelete }: ScheduledExpensesListProps) {
  const { toast } = useToast();
  const [scheduledExpenses, setScheduledExpenses] = useState<ScheduledExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledExpenses();
  }, []);

  const fetchScheduledExpenses = async () => {
    try {
      setLoading(true);
      // API call to fetch scheduled expenses
      const response = await fetch('/wp-json/ims/v1/finance/expenses/scheduled');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScheduledExpenses(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching scheduled expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const response = await fetch(`/wp-json/ims/v1/finance/expenses/scheduled/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScheduledExpenses(prev => 
            prev.map(expense => 
              expense.id === id ? { ...expense, status: newStatus as any } : expense
            )
          );
          toast({
            title: "Status Updated",
            description: `Scheduled expense ${newStatus === 'active' ? 'activated' : 'paused'}`,
          });
          if (onToggleStatus) onToggleStatus(id, newStatus as any);
        }
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled expense?')) return;

    try {
      const response = await fetch(`/wp-json/ims/v1/finance/expenses/scheduled/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScheduledExpenses(prev => prev.filter(expense => expense.id !== id));
          toast({
            title: "Deleted",
            description: "Scheduled expense deleted successfully",
          });
          if (onDelete) onDelete(id);
        }
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

  const getFrequencyBadge = (frequency: string) => {
    const variants = {
      daily: 'default',
      weekly: 'secondary',
      monthly: 'outline',
      yearly: 'destructive'
    };
    return (
      <Badge variant={variants[frequency as keyof typeof variants] as any}>
        <Repeat className="h-3 w-3 mr-1" />
        {frequency}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      inactive: 'outline'
    };
    const colors = {
      active: 'text-green-600',
      paused: 'text-yellow-600',
      inactive: 'text-gray-600'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
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
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p>Loading scheduled expenses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background via-background to-accent/5 shadow-xl border-2 border-accent/20 hover:border-accent/30 transition-all duration-500">
      <CardHeader className="pb-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-t-lg">
        <CardTitle className="text-foreground flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl shadow-lg">
            <Clock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Scheduled Expenses
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Automated recurring expense management</p>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-accent to-primary text-primary-foreground px-3 py-1 shadow-md"
          >
            <Repeat className="h-3 w-3 mr-1" />
            {scheduledExpenses.length} scheduled
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {scheduledExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="bg-accent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-accent animate-pulse" />
            </div>
            <p className="text-lg font-medium mb-3 text-foreground">No scheduled expenses yet</p>
            <p className="text-sm max-w-md mx-auto leading-relaxed">
              Set up recurring expenses to automate your financial planning. Use the "Schedule Expense" button to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledExpenses.map((expense, index) => (
              <div 
                key={expense.id} 
                className="group bg-gradient-to-r from-card via-card to-accent/5 border-2 border-border/50 rounded-xl p-5 hover:border-accent/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fade-in 0.5s ease-out forwards'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {expense.description}
                      </h4>
                      <div className="flex gap-2">
                        {getStatusBadge(expense.status)}
                        {getFrequencyBadge(expense.frequency)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="bg-accent/20 p-1.5 rounded-lg">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {expense.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          Next: {new Date(expense.next_execution).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {expense.execution_count && (
                        <div className="flex items-center gap-2">
                          <div className="bg-accent/10 p-1.5 rounded-lg">
                            <Repeat className="h-4 w-4 text-accent" />
                          </div>
                          <span>Executed {expense.execution_count}x</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="bg-gradient-to-br from-destructive/10 to-destructive/20 p-3 rounded-xl border border-destructive/20">
                      <p className="font-bold text-xl text-destructive">
                        Rs. {expense.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        via {expense.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    {expense.last_executed && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Last executed: {new Date(expense.last_executed).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={expense.status === 'active' ? "outline" : "default"}
                      onClick={() => handleToggleStatus(expense.id, expense.status)}
                      className={`h-9 px-4 shadow-md transition-all duration-200 ${
                        expense.status === 'active' 
                          ? 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700' 
                          : 'hover:bg-emerald-600 bg-emerald-500 text-white'
                      }`}
                    >
                      {expense.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit && onEdit(expense)}
                      className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(expense.id)}
                      className="h-9 w-9 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}