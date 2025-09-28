import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Banknote, PiggyBank, CreditCard, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountsApi, type Account } from "@/services/accountsApi";

interface AccountSelectorProps {
  value?: string;
  onValueChange: (accountId: string, account: Account) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  filterTypes?: Account['account_type'][];
  required?: boolean;
}

export const AccountSelector = ({ 
  value, 
  onValueChange, 
  label = "Select Account",
  placeholder = "Choose an account",
  className = "",
  filterTypes,
  required = false
}: AccountSelectorProps) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const accountTypeIcons = {
    bank: Building2,
    cash: Banknote,
    asset: PiggyBank,
    liability: CreditCard,
    equity: DollarSign,
    revenue: TrendingUp,
    expense: TrendingDown
  };

  const accountTypeColors = {
    bank: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",
    cash: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300", 
    asset: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300",
    liability: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300",
    equity: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300",
    revenue: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300",
    expense: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    // Auto-select cash account as default if no value is set
    if (!value && accounts.length > 0) {
      const cashAccount = accounts.find(acc => acc.account_type === 'cash' && acc.is_active);
      if (cashAccount && onValueChange) {
        onValueChange(cashAccount.id.toString(), cashAccount);
      }
    }
  }, [accounts, value, onValueChange]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsApi.getAccounts({ 
        active: true,
        limit: 100 
      });
      
      if (response.success) {
        const accountsData = (response.data as any)?.accounts || response.data || [];
        let filteredAccounts = Array.isArray(accountsData) ? accountsData : [];
        
        // Filter by account types if specified
        if (filterTypes && filterTypes.length > 0) {
          filteredAccounts = filteredAccounts.filter(account => 
            filterTypes.includes(account.account_type)
          );
        }
        
        setAccounts(filteredAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (accountId: string) => {
    const selectedAccount = accounts.find(acc => acc.id.toString() === accountId);
    if (selectedAccount) {
      onValueChange(accountId, selectedAccount);
    }
  };

  const getSelectedAccount = () => {
    return accounts.find(acc => acc.id.toString() === value);
  };

  const selectedAccount = getSelectedAccount();

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={handleValueChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading accounts..." : placeholder}>
            {selectedAccount && (
              <div className="flex items-center gap-2">
                <div className="bg-muted p-1 rounded">
                  {(() => {
                    const IconComponent = accountTypeIcons[selectedAccount.account_type];
                    return <IconComponent className="h-3 w-3" />;
                  })()}
                </div>
                <span className="font-medium">{selectedAccount.account_name}</span>
                <Badge variant="outline" className={`text-xs ${accountTypeColors[selectedAccount.account_type]}`}>
                  {selectedAccount.account_type}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => {
            const IconComponent = accountTypeIcons[account.account_type];
            return (
              <SelectItem key={account.id} value={account.id.toString()}>
                <div className="flex items-center gap-2 w-full">
                  <div className="bg-muted p-1 rounded">
                    <IconComponent className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{account.account_name}</span>
                      <Badge variant="outline" className={`text-xs ml-2 ${accountTypeColors[account.account_type]}`}>
                        {account.account_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {account.account_code} • Balance: Rs. {parseFloat(account.balance?.toString() || '0').toLocaleString()}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};