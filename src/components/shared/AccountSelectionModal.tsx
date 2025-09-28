import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccountSelector } from "./AccountSelector";
import { type Account } from "@/services/accountsApi";

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: string, account: Account) => void;
  title: string;
  description: string;
  amount: number;
  transactionType: 'inflow' | 'outflow';
  filterTypes?: Account['account_type'][];
}

export const AccountSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  amount,
  transactionType,
  filterTypes
}: AccountSelectionModalProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleAccountChange = (accountId: string, account: Account) => {
    setSelectedAccountId(accountId);
    setSelectedAccount(account);
  };

  const handleConfirm = () => {
    if (selectedAccount && selectedAccountId) {
      onConfirm(selectedAccountId, selectedAccount);
      onClose();
      // Reset state
      setSelectedAccountId("");
      setSelectedAccount(null);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setSelectedAccountId("");
    setSelectedAccount(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {description}
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Transaction Amount:</span>
              <span className={`font-bold ${transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                {transactionType === 'inflow' ? '+' : '-'}Rs. {amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">Type:</span>
              <span className={`text-xs px-2 py-1 rounded ${
                transactionType === 'inflow' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {transactionType === 'inflow' ? 'Credit (Money In)' : 'Debit (Money Out)'}
              </span>
            </div>
          </div>

          <AccountSelector
            value={selectedAccountId}
            onValueChange={handleAccountChange}
            label="Select Account"
            placeholder="Choose the account for this transaction"
            filterTypes={filterTypes}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedAccountId}
              className="flex-1"
            >
              Confirm Transaction
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};