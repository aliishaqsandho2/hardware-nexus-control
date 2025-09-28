import { useToast } from '@/hooks/use-toast';
import { newFinanceApi } from '@/services/newFinanceApi';
import { accountsApi, type Account } from '@/services/accountsApi';

export interface CashflowTransaction {
  type: 'inflow' | 'outflow';
  amount: number;
  accountId: number;
  reference: string;
  description: string;
  date?: string;
}

export const useCashflowManager = () => {
  const { toast } = useToast();

  const validateAccountBalance = async (account: Account, amount: number, transactionType: 'inflow' | 'outflow'): Promise<boolean> => {
    try {
      if (transactionType === 'outflow' && (account.account_type === 'cash' || account.account_type === 'bank')) {
        const currentBalance = parseFloat(account.balance?.toString() || '0');
        if (currentBalance < amount) {
          toast({
            title: "Insufficient Balance",
            description: `Account ${account.account_name} has insufficient balance (${currentBalance.toLocaleString()}) for this transaction (${amount.toLocaleString()})`,
            variant: "destructive"
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error validating account balance:', error);
      toast({
        title: "Balance Check Failed",
        description: "Could not verify account balance. Please check account status.",
        variant: "destructive"
      });
      return false;
    }
  };

  const createCashflowEntry = async (transaction: CashflowTransaction) => {
    try {
      console.log('Creating cashflow entry:', transaction);
      
      // Get fresh account data for balance validation
      const { accountsApi } = await import('@/services/accountsApi');
      const accountResponse = await accountsApi.getAccount(transaction.accountId);
      
      if (!accountResponse.success || !accountResponse.data) {
        throw new Error('Could not fetch account information');
      }

      const account = accountResponse.data;
      
      // Validate account balance before proceeding
      const isBalanceValid = await validateAccountBalance(account, transaction.amount, transaction.type);
      if (!isBalanceValid) {
        throw new Error('Transaction cancelled due to insufficient balance');
      }
      
      // Create the cashflow entry
      const response = await newFinanceApi.createFinanceCashFlow({
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date || new Date().toISOString().split('T')[0],
        account_id: transaction.accountId,
        reference: transaction.reference,
        description: transaction.description
      });

      if (response.success) {
        // Update account balance
        try {
          const balanceUpdateType = transaction.type === 'inflow' ? 'credit' : 'debit';
          await accountsApi.updateAccountBalance(
            transaction.accountId,
            transaction.amount,
            balanceUpdateType,
            transaction.description
          );
          
          console.log(`Account balance updated: ${balanceUpdateType} ${transaction.amount}`);
        } catch (balanceError) {
          console.error('Failed to update account balance:', balanceError);
          // Don't throw error here as cashflow was created successfully
        }

        toast({
          title: "Transaction Recorded",
          description: `${transaction.type === 'inflow' ? 'Credit' : 'Debit'} of Rs. ${transaction.amount.toLocaleString()} recorded successfully`,
        });

        return response;
      } else {
        throw new Error(response.message || 'Failed to create cashflow entry');
      }
    } catch (error) {
      console.error('Failed to create cashflow entry:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to record the transaction",
        variant: "destructive"
      });
      throw error;
    }
  };

  const createSaleCashflow = async (
    saleAmount: number,
    accountId: number,
    account: Account,
    orderNumber: string,
    customerName?: string
  ) => {
    const transaction: CashflowTransaction = {
      type: 'inflow',
      amount: saleAmount,
      accountId,
      reference: orderNumber,
      description: `Sale ${customerName ? `to ${customerName}` : '(Walk-in customer)'} - Revenue`
    };

    return await createCashflowEntry(transaction);
  };

  const createPurchaseCashflow = async (
    purchaseAmount: number,
    accountId: number,
    account: Account,
    orderNumber: string,
    supplierName?: string
  ) => {
    const transaction: CashflowTransaction = {
      type: 'outflow',
      amount: purchaseAmount,
      accountId,
      reference: orderNumber,
      description: `Purchase ${supplierName ? `from ${supplierName}` : ''} - Stock purchase`
    };

    return await createCashflowEntry(transaction);
  };

  const createCancellationCashflow = async (
    originalAmount: number,
    accountId: number,
    account: Account,
    orderNumber: string,
    isRefund = true
  ) => {
    const transaction: CashflowTransaction = {
      type: isRefund ? 'outflow' : 'inflow', // Refund is outflow, cancellation before payment might be inflow reversal
      amount: originalAmount,
      accountId,
      reference: `${orderNumber}-CANCEL`,
      description: `Order cancellation - ${isRefund ? 'Refund processed' : 'Payment reversed'}`
    };

    return await createCashflowEntry(transaction);
  };

  const createExpenseCashflow = async (
    expenseAmount: number,
    accountId: number,
    account: Account,
    category: string,
    description: string,
    reference?: string
  ) => {
    const transaction: CashflowTransaction = {
      type: 'outflow',
      amount: expenseAmount,
      accountId,
      reference: reference || `EXP-${Date.now()}`,
      description: `${category} expense - ${description}`
    };

    return await createCashflowEntry(transaction);
  };

  return {
    createCashflowEntry,
    createSaleCashflow,
    createPurchaseCashflow,
    createCancellationCashflow,
    createExpenseCashflow,
    validateAccountBalance
  };
};