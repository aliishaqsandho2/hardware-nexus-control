import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GEMINI_API_KEY = "AIzaSyDscgxHRLCy4suVBigT1g_pXMnE7tH_Ejw";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface EnhancedStats {
  financial: {
    todayRevenue: number;
    monthRevenue: number;
    profitMargin: number;
    revenueGrowth: number;
    netProfit: number;
    grossProfit: number;
    monthExpenses: number;
  };
  sales: {
    todaySales: number;
    weekSales: number;
    avgOrderValue: number;
    highValueSales: Array<{
      orderNumber: string;
      amount: number;
      customer: string;
      date: string;
    }>;
  };
  inventory: {
    totalInventoryValue: number;
    lowStockItems: number;
    deadStockValue: number;
    inventoryTurnover: number;
    fastMovingProducts: Array<{
      name: string;
      sold: number;
      remaining: number;
    }>;
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    avgCustomerValue: number;
    totalReceivables: number;
  };
  cashFlow: {
    netCashFlow: number;
    monthlyInflows: number;
    monthlyOutflows: number;
  };
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    action: string;
  }>;
}

const Reports = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your business AI assistant. I have access to all your current business data including sales, inventory, finances, and customer information. Feel free to ask me anything about your business performance, trends, or get recommendations for improvement.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch enhanced stats from the API
  const { data: enhancedStats, isLoading: statsLoading } = useQuery({
    queryKey: ['enhanced-stats'],
    queryFn: async () => {
      const response = await fetch('https://zaidawn.site/wp-json/ims/v1/dashboard/enhanced-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAIResponse = (text: string) => {
    // Clean the text first - remove extra asterisks and clean up formatting
    let cleanText = text.replace(/\*{3,}/g, '**'); // Replace 3+ asterisks with 2
    cleanText = cleanText.replace(/\*{2}\s*\*{2}/g, '**'); // Remove empty bold tags
    
    // Split text into paragraphs
    const paragraphs = cleanText.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return null;
      
      // Check if it's a header (starts with ** and ends with **)
      if (paragraph.match(/^\*\*[^*]+\*\*$/)) {
        const headerText = paragraph.replace(/^\*\*|\*\*$/g, '').trim();
        return (
          <h3 key={index} className="text-lg font-semibold text-blue-700 mb-3 mt-4 first:mt-0 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
            {headerText}
          </h3>
        );
      }
      
      // Check if it's a list item (starts with * or -)
      if (paragraph.match(/^[\*\-]\s/)) {
        const listItems = paragraph.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="space-y-2 mb-4 ml-4">
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="text-gray-700 flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>{item.replace(/^[\*\-]\s/, '').trim()}</span>
              </li>
            ))}
          </ul>
        );
      }
      
      // Check if it's a numbered list
      if (paragraph.match(/^\d+\./)) {
        const listItems = paragraph.split('\n').filter(item => item.trim());
        return (
          <ol key={index} className="space-y-2 mb-4 ml-4">
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="text-gray-700 flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                  {itemIndex + 1}
                </span>
                <span>{item.replace(/^\d+\.\s?/, '').trim()}</span>
              </li>
            ))}
          </ol>
        );
      }
      
      // Regular paragraph with inline formatting
      if (paragraph.trim()) {
        // Format bold text (**text**) - be more careful with replacement
        let formattedText = paragraph.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        
        return (
          <p 
            key={index} 
            className="text-gray-700 leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  const generateBusinessContext = (businessData: EnhancedStats) => {
    const currentDate = new Date().toLocaleDateString();
    
    return `
BUSINESS CONTEXT & CURRENT DATA (as of ${currentDate}):

FINANCIAL OVERVIEW:
- Today's Revenue: ${formatCurrency(businessData.financial?.todayRevenue || 0)}
- Monthly Revenue: ${formatCurrency(businessData.financial?.monthRevenue || 0)}
- Net Profit: ${formatCurrency(businessData.financial?.netProfit || 0)}
- Gross Profit: ${formatCurrency(businessData.financial?.grossProfit || 0)}
- Monthly Expenses: ${formatCurrency(businessData.financial?.monthExpenses || 0)}
- Profit Margin: ${businessData.financial?.profitMargin || 0}%
- Revenue Growth: ${businessData.financial?.revenueGrowth || 0}%

SALES PERFORMANCE:
- Today's Sales: ${businessData.sales?.todaySales || 0} orders
- Weekly Sales: ${businessData.sales?.weekSales || 0} orders
- Average Order Value: ${formatCurrency(businessData.sales?.avgOrderValue || 0)}
- Recent High-Value Sales: ${businessData.sales?.highValueSales?.slice(0, 3).map(s => `${formatCurrency(s.amount)} from ${s.customer}`).join(', ') || 'No recent high-value sales'}

INVENTORY STATUS:
- Total Inventory Value: ${formatCurrency(businessData.inventory?.totalInventoryValue || 0)}
- Low Stock Items: ${businessData.inventory?.lowStockItems || 0} products need attention
- Dead Stock Value: ${formatCurrency(businessData.inventory?.deadStockValue || 0)}
- Inventory Turnover: ${businessData.inventory?.inventoryTurnover || 0}
- Top Selling Products: ${businessData.inventory?.fastMovingProducts?.slice(0, 3).map(p => `${p.name} (${p.sold} sold, ${p.remaining} remaining)`).join(', ') || 'No fast-moving products data'}

CUSTOMER INSIGHTS:
- Total Customers: ${businessData.customers?.totalCustomers || 0}
- New Customers This Month: ${businessData.customers?.newCustomersThisMonth || 0}
- Average Customer Value: ${formatCurrency(businessData.customers?.avgCustomerValue || 0)}
- Outstanding Receivables: ${formatCurrency(businessData.customers?.totalReceivables || 0)}

CASH FLOW:
- Net Cash Flow: ${formatCurrency(businessData.cashFlow?.netCashFlow || 0)}
- Monthly Inflows: ${formatCurrency(businessData.cashFlow?.monthlyInflows || 0)}
- Monthly Outflows: ${formatCurrency(businessData.cashFlow?.monthlyOutflows || 0)}

ALERTS & CRITICAL ISSUES:
${businessData.alerts?.map(alert => `- ${alert.title}: ${alert.message}`).join('\n') || 'No critical alerts'}

BUSINESS TYPE: This appears to be a manufacturing/trading business dealing with wood products, sheets, and building materials based on the product names (MDF, HDX, KMI, ZRK series products).

RESPONSE FORMAT REQUIREMENTS:
- Please format your response using proper headings with ** for main sections
- Use bullet points (*) for lists and recommendations
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Keep responses well-structured and easy to read
- Use bold text (**text**) for important numbers or key points
- Provide helpful, actionable insights and recommendations based on this current business data
- Keep responses conversational and easy to understand for business owners
- Use Pakistani Rupees (PKR) for all currency references
`;
  };

  const sendMessageToGemini = async (userMessage: string) => {
    if (!enhancedStats?.data) {
      throw new Error('Business data not available');
    }

    const businessContext = generateBusinessContext(enhancedStats.data);
    
    const prompt = `${businessContext}

USER QUESTION: ${userMessage}

Please provide a helpful, well-formatted response based on the current business data above. Use the formatting guidelines specified in the context to make your response clear and professional.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response at the moment. Please try again.';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToGemini(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble accessing the information right now. Please check your connection and try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (statsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading business data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ask AI
                </h1>
                <p className="text-gray-600">Your intelligent business assistant</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Connected
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Data Updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-6 space-y-6 pb-32">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                
                <Card className={`max-w-2xl ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-white shadow-lg border-0'
                }`}>
                  <CardContent className="p-6">
                    {message.type === 'user' ? (
                      <p className="text-white leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {formatAIResponse(message.content)}
                      </div>
                    )}
                    <p className={`text-xs mt-3 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                {message.type === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <Card className="bg-white shadow-lg border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white/80 backdrop-blur-sm shadow-lg absolute bottom-0 left-0 right-0">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Ask me anything about your business performance, sales trends, inventory, or get recommendations..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="h-12 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
