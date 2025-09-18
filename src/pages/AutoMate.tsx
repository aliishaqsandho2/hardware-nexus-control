import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Bot,
  Mic,
  MicOff,
  Upload,
  Sparkles,
  MessageSquare,
  Camera,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Play,
  TrendingUp,
  Clipboard,
  Receipt,
  BarChart3,
  Settings,
  Send,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GeminiService } from '@/services/geminiApi';
import { getAllApiEndpoints, getEndpointsByAction } from '@/data/apiEndpoints';
import { apiConfig } from '@/utils/apiConfig';
import { Textarea } from '@/components/ui/textarea';

const AutoMate = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ id: number, type: 'user' | 'ai', content: string, timestamp: Date }>>([
    {
      id: 1,
      type: 'ai',
      content: 'Welcome to AutoMate AI! I can help you manage your business operations through voice commands, text input, and image processing. What would you like to do today?',
      timestamp: new Date()
    }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const quickActions = [
    {
      icon: Package,
      title: "Products",
      description: "Add, update, or manage inventory",
      action: "products"
    },
    {
      icon: Users,
      title: "Customers",
      description: "Manage customer data and profiles",
      action: "customers"
    },
    {
      icon: ShoppingCart,
      title: "Sales",
      description: "Process sales and transactions",
      action: "sales"
    },
    {
      icon: Truck,
      title: "Suppliers",
      description: "Manage supplier relationships",
      action: "suppliers"
    },
    {
      icon: Clipboard,
      title: "Purchase Orders",
      description: "Create and manage purchase orders",
      action: "purchase-orders"
    },
    {
      icon: Receipt,
      title: "Orders",
      description: "View and process customer orders",
      action: "orders"
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      description: "Generate reports and insights",
      action: "analytics"
    },
    {
      icon: BarChart3,
      title: "Finance",
      description: "Financial tracking and management",
      action: "finance"
    }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Speak your automation request clearly",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      toast({
        title: "Recording Stopped",
        description: "Processing your voice command...",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        toast({
          title: "File Uploaded",
          description: `${file.name} ready for AI processing`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!textInput.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: textInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput('');

    // Process with AI if action is selected
    if (selectedAction) {
      setTimeout(() => processTextWithAI(textInput), 500);
    } else {
      // AI response suggesting to select action
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          type: 'ai' as const,
          content: 'I understand your request. Please select a category from the Quick Actions to help me provide more targeted assistance with your automation needs.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const processTextWithAI = async (text: string) => {
    try {
      const availableEndpoints = getEndpointsByAction(selectedAction!);
      const result = await GeminiService.processVoiceCommand(text, selectedAction!, availableEndpoints);

      // Show consent dialog instead of direct execution
      setAiPlan(result);
      setShowConsentDialog(true);

    } catch (error) {
      console.error('AI Processing failed:', error);
      const errorResponse = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `❌ Sorry, I encountered an error while processing your request. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  const executeAiPlan = async () => {
    setShowConsentDialog(false);
    setIsProcessing(true);
    setProcessingStep('Executing AI plan...');

    try {
      // Execute API calls if suggested by AI
      if (aiPlan.apiCall && aiPlan.apiCall.endpoint) {
        setProcessingStep('Executing API operations...');

        const response = await fetch(aiPlan.apiCall.endpoint, {
          method: aiPlan.apiCall.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: aiPlan.apiCall.payload ? JSON.stringify(aiPlan.apiCall.payload) : undefined,
        });

        const apiData = await response.json();
        aiPlan.apiResponse = apiData;
      }

      const aiResponse = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: aiPlan.response + (aiPlan.apiResponse ? `\n\n✅ API Operation completed successfully. ${aiPlan.apiResponse.success ? aiPlan.apiResponse.message || 'Operation successful' : 'Check the data for details.'}` : ''),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);

      toast({
        title: "AI Plan Executed",
        description: "Automation completed successfully",
      });

    } catch (error) {
      console.error('Plan execution failed:', error);
      const errorResponse = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `❌ Failed to execute the plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);

      toast({
        title: "Execution Failed",
        description: "There was an error executing the AI plan",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setAiPlan(null);
    }
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: `I want to work with ${action.replace('-', ' ')}`,
      timestamp: new Date()
    };
    setMessages([...messages, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: `Great! I'm ready to help you with ${action.replace('-', ' ')}. You can now use voice commands or upload images to process your ${action.replace('-', ' ')} operations. What specific task would you like me to help you with?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const processWithAI = async () => {
    if (!selectedAction && !textInput.trim()) {
      toast({
        title: "Select an Action",
        description: "Please select what you'd like to work with first or type a message",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Connecting to Gemini AI...');

    try {
      const availableEndpoints = selectedAction ? getEndpointsByAction(selectedAction) : getAllApiEndpoints();
      let result: any = null;

      if (audioBlob) {
        // Process voice command
        setProcessingStep('Transcribing voice command...');

        // For demo purposes, we'll simulate voice transcription
        // In production, you'd use speech-to-text API
        const simulatedVoiceText = "Show me all products and their stock levels";

        setProcessingStep('Processing voice command with AI...');
        result = await GeminiService.processVoiceCommand(
          simulatedVoiceText,
          selectedAction || 'general',
          availableEndpoints
        );
      } else if (uploadedImage) {
        // Process image
        setProcessingStep('Analyzing uploaded document...');

        // Convert image to base64
        const base64 = uploadedImage.split(',')[1];
        result = await GeminiService.processImageAnalysis(
          base64,
          selectedAction || 'general',
          availableEndpoints
        );
      } else if (textInput.trim()) {
        // Process text input
        setProcessingStep('Processing your request with AI...');
        result = await GeminiService.processVoiceCommand(
          textInput,
          selectedAction || 'general',
          availableEndpoints
        );
      } else {
        // Process selected action only
        setProcessingStep('Generating automation suggestions...');
        result = await GeminiService.processVoiceCommand(
          `Help me manage ${selectedAction!.replace('-', ' ')}`,
          selectedAction!,
          availableEndpoints
        );
      }

      // Show consent dialog instead of direct execution
      setAiPlan(result);
      setShowConsentDialog(true);

      setProcessingStep('');
      setIsProcessing(false);

      // Reset inputs after processing
      setAudioBlob(null);
      setUploadedImage(null);
      setTextInput('');

    } catch (error) {
      console.error('AI Processing failed:', error);
      setProcessingStep('');
      setIsProcessing(false);

      const errorResponse = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `❌ Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);

      toast({
        title: "Processing Failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-0">
      <div className='p-0'>
        {/* Header */}
        <div className="flex gap-3 flex-col p-0">
          {/* Chat Interface */}
          <Card className="flex justify-between flex-col">
            <CardHeader className='p-6'>
              <CardTitle className="flex items-center gap-2 pb-2">
                <MessageSquare className="h-5 w-5" />
                AI Assistant Chat
              </CardTitle>
              <CardContent className='flex justify-start gap-3 p-0'>
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={selectedAction === action.action ? "default" : "outline"}
                    className=""
                    onClick={() => handleActionSelect(action.action)}
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className="" />
                      <div className="">
                        <div className="text-xs font-medium">{action.title}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages Area */}
              <div className=" h-[55vh] p-3 overflow-y-auto space-y-4 border rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                        }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}

                {processingStep && (
                  <div className="flex justify-start">
                    <div className="bg-muted border rounded-lg p-3 animate-pulse">
                      <p className="text-sm text-muted-foreground">{processingStep}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Controls */}
              <div className="space-y-4">

                {/* Voice and Image Controls */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>

                    <div className="flex gap-2">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? "destructive" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-4 w-4 mr-2" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Record
                          </>
                        )}
                      </Button>

                      {audioBlob && (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {isRecording && (
                      <div className="flex justify-center space-x-1">
                        <div className="w-1 h-4 bg-destructive rounded animate-bounce"></div>
                        <div className="w-1 h-6 bg-destructive rounded animate-bounce delay-100"></div>
                        <div className="w-1 h-4 bg-destructive rounded animate-bounce delay-200"></div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>

                    {uploadedImage && (
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="Uploaded"
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Badge className="absolute top-1 right-1 text-xs">Ready</Badge>
                      </div>
                    )}
                  </div>
                </div>
                {/* Text Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <textarea
                      placeholder="Type your automation request here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 py-3 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      rows={1} // controls initial height
                    />
                    <Button onClick={handleSendMessage} size="sm" disabled={!textInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>


                {/* Process Button */}
                <Button
                  onClick={processWithAI}
                  disabled={isProcessing || (!audioBlob && !uploadedImage && !selectedAction && !textInput.trim())}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
              </div>

              {/* Consent Dialog */}
              <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      AI Execution Plan
                    </DialogTitle>
                    <DialogDescription>
                      Review the AI's suggested automation plan before execution
                    </DialogDescription>
                  </DialogHeader>

                  {aiPlan && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Intent:</h4>
                        <p className="text-sm text-muted-foreground">{aiPlan.intent}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold">Planned Actions:</h4>
                        <p className="text-sm text-muted-foreground">{aiPlan.action}</p>
                      </div>

                      {aiPlan.apiCall && (
                        <div>
                          <h4 className="font-semibold">API Operations:</h4>
                          <div className="bg-muted p-3 rounded text-sm">
                            <div><strong>Endpoint:</strong> {aiPlan.apiCall.endpoint}</div>
                            <div><strong>Method:</strong> {aiPlan.apiCall.method}</div>
                            {aiPlan.apiCall.payload && (
                              <div><strong>Data:</strong> {JSON.stringify(aiPlan.apiCall.payload, null, 2)}</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          ⚠️ This will execute real API operations on your system. Please review carefully.
                        </p>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={executeAiPlan} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Execute Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AutoMate;