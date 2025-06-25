
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pin, PinOff, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { useStockManagement } from '@/hooks/useStockManagement';

interface ProductCardProps {
  product: any;
  isPinned: boolean;
  quantityInput: string;
  onTogglePin: (productId: number) => void;
  onQuantityChange: (productId: number, value: string) => void;
  onAddToCart: (product: any, quantity?: number) => void;
  onAddCustomQuantity: (product: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isPinned,
  quantityInput,
  onTogglePin,
  onQuantityChange,
  onAddToCart,
  onAddCustomQuantity
}) => {
  const { toast } = useToast();
  const { validateStock } = useStockManagement();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleQuantityInputChange = (value: string) => {
    // Allow decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onQuantityChange(product.id, value);
    }
  };

  const handleAddCustomQuantity = async () => {
    const quantity = parseFloat(quantityInput);
    
    if (quantityInput && !isNaN(quantity) && quantity > 0) {
      // Validate stock before adding to cart
      if (!product.incompleteQuantity && !product.needsQuantityUpdate) {
        setIsValidating(true);
        try {
          const validation = await validateStock(product.id, quantity);
          
          if (!validation.isValid) {
            toast({
              title: "Insufficient Stock",
              description: validation.message,
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error('Stock validation error:', error);
          toast({
            title: "Validation Error",
            description: "Could not validate stock availability",
            variant: "destructive"
          });
          return;
        } finally {
          setIsValidating(false);
        }
      }
      
      onAddCustomQuantity(product);
    } else {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
    }
  };

  const handleQuickAdd = async () => {
    // Use quantity from input if available, otherwise default to 1
    const quantity = quantityInput && !isNaN(parseFloat(quantityInput)) ? parseFloat(quantityInput) : 1;
    
    // Validate stock before adding to cart (unless incomplete quantity)
    if (!product.incompleteQuantity && !product.needsQuantityUpdate) {
      setIsValidating(true);
      try {
        const validation = await validateStock(product.id, quantity);
        
        if (!validation.isValid) {
          toast({
            title: "Insufficient Stock",
            description: validation.message,
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Stock validation error:', error);
        toast({
          title: "Validation Error",
          description: "Could not validate stock availability",
          variant: "destructive"
        });
        return;
      } finally {
        setIsValidating(false);
      }
    }
    
    onAddToCart(product, quantity);
  };

  // Check if product has incomplete quantity information
  const hasIncompleteQuantity = product.incompleteQuantity || product.needsQuantityUpdate;
  const isOutOfStock = !hasIncompleteQuantity && (product.stock || 0) <= 0;

  return (
    <>
      <Card className={`hover:shadow-md transition-all duration-200 h-full ${
        isPinned 
          ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
          : hasIncompleteQuantity
          ? 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
          : isOutOfStock
          ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
          : 'border-border bg-card'
      } relative`}>
        {/* Pin Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTogglePin(product.id)}
          className="absolute top-1 right-1 h-5 w-5 p-0 z-10"
        >
          {isPinned ? 
            <Pin className="h-2.5 w-2.5 text-blue-600" /> : 
            <PinOff className="h-2.5 w-2.5 text-muted-foreground" />
          }
        </Button>

        {/* Details Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDetailsOpen(true)}
          className="absolute top-1 right-7 h-5 w-5 p-0 z-10"
          title="View product details"
        >
          <Info className="h-2.5 w-2.5 text-muted-foreground hover:text-blue-600" />
        </Button>

        {/* Stock Status Warning */}
        {(hasIncompleteQuantity || isOutOfStock) && (
          <div className="absolute top-1 left-1 h-5 w-5 z-10" title={
            hasIncompleteQuantity 
              ? (product.quantityNote || "Incomplete quantity information")
              : "Out of stock"
          }>
            <AlertTriangle className={`h-2.5 w-2.5 ${
              isOutOfStock ? 'text-red-600' : 'text-orange-600'
            }`} />
          </div>
        )}
        
        <CardContent className="p-2 h-full flex flex-col">
          <div className="flex-1 space-y-2">
            {/* Product Info */}
            <div className="space-y-0.5">
              <h3 className="font-medium text-card-foreground text-xs leading-tight line-clamp-2 min-h-[2rem] pr-12">
                {product.name}
              </h3>
              <p className="text-[10px] text-muted-foreground">SKU: {product.sku}</p>
            </div>
            
            {/* Price and Stock */}
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-blue-600">
                PKR {product.price.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {hasIncompleteQuantity ? (
                  <span className="text-orange-600 font-medium">
                    Quantity unknown
                  </span>
                ) : isOutOfStock ? (
                  <span className="text-red-600 font-medium">
                    Out of stock
                  </span>
                ) : (
                  <>
                    {product.stock} {product.unit} available
                  </>
                )}
              </div>
              {hasIncompleteQuantity && product.quantityNote && (
                <div className="text-[9px] text-orange-600 italic">
                  {product.quantityNote}
                </div>
              )}
            </div>
          </div>

          {/* Actions - Always at bottom */}
          <div className="space-y-1.5 mt-auto">
            {/* Quantity Input */}
            <div className="flex items-center gap-1">
              <Input
                type="text"
                placeholder={`Qty (${product.unit})`}
                value={quantityInput}
                onChange={(e) => handleQuantityInputChange(e.target.value)}
                className="h-6 text-[10px] flex-1 bg-background border-input px-1"
                disabled={isOutOfStock && !hasIncompleteQuantity}
              />
              <Button
                onClick={handleAddCustomQuantity}
                className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                disabled={isOutOfStock && !hasIncompleteQuantity || !quantityInput || isValidating}
              >
                <Plus className="h-2.5 w-2.5" />
              </Button>
            </div>
            
            {/* Quick Add Button - Now uses input quantity or defaults to 1 */}
            <Button
              onClick={handleQuickAdd}
              className={`w-full text-white text-[10px] h-6 ${
                hasIncompleteQuantity 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : isOutOfStock
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isOutOfStock && !hasIncompleteQuantity || isValidating}
            >
              {isValidating ? (
                'Validating...'
              ) : hasIncompleteQuantity ? (
                <>Quick Add ({quantityInput || '1'} {product.unit}) ⚠️</>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                <>Quick Add ({quantityInput || '1'} {product.unit})</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        product={product}
      />
    </>
  );
};
