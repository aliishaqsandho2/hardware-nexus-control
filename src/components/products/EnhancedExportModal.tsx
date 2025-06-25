
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { FileText, RefreshCw, ChevronDown, Check, Download, Package } from "lucide-react";

interface EnhancedExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: any[];
  onExport: (selectedCategories: string[], exportType: string) => Promise<void>;
  exportLoading: boolean;
}

export const EnhancedExportModal = ({ 
  open, 
  onOpenChange, 
  categories, 
  onExport, 
  exportLoading 
}: EnhancedExportModalProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["all"]);
  const [exportType, setExportType] = useState("detailed");
  const [exportProgress, setExportProgress] = useState(0);

  const availableCategories = categories.filter(cat => cat.value !== "all");

  const handleCategoryToggle = (categoryValue: string) => {
    if (categoryValue === "all") {
      setSelectedCategories(["all"]);
    } else {
      setSelectedCategories(prev => {
        const newSelection = prev.includes("all") 
          ? [categoryValue]
          : prev.includes(categoryValue)
            ? prev.filter(cat => cat !== categoryValue)
            : [...prev, categoryValue];
        
        return newSelection.length === 0 ? ["all"] : newSelection.filter(cat => cat !== "all");
      });
    }
  };

  const handleSelectAll = () => {
    setSelectedCategories(["all"]);
  };

  const handleSelectNone = () => {
    setSelectedCategories([]);
  };

  const getSelectedCategoryLabel = () => {
    if (selectedCategories.includes("all") || selectedCategories.length === 0) {
      return "All Categories";
    }
    if (selectedCategories.length === 1) {
      const category = categories.find(cat => cat.value === selectedCategories[0]);
      return category?.label || selectedCategories[0];
    }
    return `${selectedCategories.length} Categories Selected`;
  };

  const handleExport = async () => {
    const categoriesToExport = selectedCategories.includes("all") || selectedCategories.length === 0 
      ? ["all"] 
      : selectedCategories;
    
    await onExport(categoriesToExport, exportType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Products to PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">Detailed Report (All Fields)</SelectItem>
                <SelectItem value="summary">Summary Report (Basic Info)</SelectItem>
                <SelectItem value="stock">Stock Report (Stock & Values)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Categories</Label>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-10"
                  disabled={exportLoading}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>{getSelectedCategoryLabel()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-white border shadow-lg">
                <DropdownMenuLabel>Choose Categories to Export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="flex gap-2 p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex-1 h-8"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                    className="flex-1 h-8"
                  >
                    Clear
                  </Button>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuCheckboxItem
                  checked={selectedCategories.includes("all")}
                  onCheckedChange={() => handleCategoryToggle("all")}
                  className="font-medium"
                >
                  All Categories
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                
                {availableCategories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.value}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  >
                    {category.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected Categories Preview */}
            {selectedCategories.length > 0 && !selectedCategories.includes("all") && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCategories.map((catValue) => {
                  const category = categories.find(cat => cat.value === catValue);
                  return (
                    <Badge 
                      key={catValue} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {category?.label || catValue}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export Progress */}
          {exportLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating PDF...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Export Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Export Details:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Includes product name, SKU, category, stock, and pricing</li>
                  <li>• Stock values calculated using cost prices</li>
                  <li>• Export date and summary included</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleExport} 
            disabled={exportLoading || selectedCategories.length === 0}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {exportLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={exportLoading}
            className="px-6"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
