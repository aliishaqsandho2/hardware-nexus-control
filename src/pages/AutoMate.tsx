import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  FileText,
  DollarSign,
  UserCheck,
  Calculator,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GeminiService } from '@/services/geminiApi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllApiEndpoints, getEndpointsByAction } from '@/data/apiEndpoints';
import { 
  comprehensiveApiRegistry, 
  getAllEndpoints, 
  getEndpointsByCategory, 
  searchEndpoints,
  executeApiCall,
  apiCategories,
  type ApiEndpoint
} from '@/data/comprehensiveApiRegistry';
import { apiConfig } from '@/utils/apiConfig';
import { Textarea } from '@/components/ui/textarea';

// Voice interfaces
interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Eleven Labs voices
const voices = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
];

// Eleven Labs API key
const ELEVEN_LABS_API_KEY = 'sk_f592f2c44060e596a964585f7c3c6e6e35170c87da00c37d';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyCa4pclqzhR4PaUyr81irTxp1rPQzEK3IU');

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
  const [sessionConsents, setSessionConsents] = useState<Set<string>>(new Set());
  const [showApiExplorer, setShowApiExplorer] = useState(false);
  const [selectedApiCategory, setSelectedApiCategory] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [apiParameters, setApiParameters] = useState<any>({});
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [executingApi, setExecutingApi] = useState(false);
  const [quickOptions, setQuickOptions] = useState<string[]>([]);
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [showParameterDialog, setShowParameterDialog] = useState(false);
  const [pendingEndpoint, setPendingEndpoint] = useState<ApiEndpoint | null>(null);
  const [parameterInputs, setParameterInputs] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<Array<{ id: number, type: 'user' | 'ai', content: string, timestamp: Date }>>([
    {
      id: 1,
      type: 'ai',
      content: 'Hi! I\'m your business automation assistant. I can help you with everything from checking sales reports to managing inventory, customers, and finances. What would you like me to help you with today?\n\nSelect any category above to get started, or simply describe what you need assistance with.',
      timestamp: new Date()
    }
  ]);
  
  // Voice state
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const conversationHistoryRef = useRef<string>('');
  const { toast } = useToast();

  // Icon mapping to resolve the icon names safely
  const iconMap: Record<string, React.ComponentType<any>> = {
    BarChart3,
    Package,
    Users,
    ShoppingCart,
    Truck,
    Receipt,
    FileText,
    Settings,
    CheckCircle,
    Calculator,
    DollarSign,
    UserCheck
  };

  // Initialize quick options on component mount
  React.useEffect(() => {
    // Keep quick options empty for cleaner interface
    setQuickOptions([]);
    setShowQuickOptions(false);
  }, []);

  // Generate quick actions from API categories
  const quickActions = Object.entries(apiCategories).map(([key, category]) => ({
    icon: iconMap[category.icon] || Package, // Fallback to Package if icon not found
    title: category.name,
    description: category.description,
    action: key,
    color: category.color
  }));

  // Voice to text functionality

  const startVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening",
        description: "Speak your message...",
      });
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTextInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Speech Recognition Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive"
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, [toast]);


  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      await audio.play();
      
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      toast({
        title: "Text-to-Speech Error",
        description: "Failed to generate speech. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };


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
          content: 'I understand! Let me help you with that. Feel free to select one of the business areas below so I can assist you better, or just tell me more specifically what you need.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  // Enhanced consent logic
  const requiresConsent = (apiCall: any): boolean => {
    if (!apiCall || !apiCall.method) return false;
    
    const writeOperations = ['POST', 'PUT', 'DELETE', 'PATCH'];
    return writeOperations.includes(apiCall.method.toUpperCase());
  };

  // Create optimized API context payload
  const createApiContextPayload = (categoryKey: string) => {
    const endpoints = getEndpointsByCategory(categoryKey);
    
    return {
      category: apiCategories[categoryKey],
      totalApis: endpoints.length,
      endpoints: endpoints.map(endpoint => ({
        id: `${endpoint.category}_${endpoint.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: endpoint.name,
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        desc: endpoint.description,
        params: endpoint.parameters ? {
          path: Object.keys(endpoint.parameters.path || {}),
          query: Object.keys(endpoint.parameters.query || {}),
          body: Object.keys(endpoint.parameters.body || {})
        } : {},
        responseType: endpoint.responseType,
        example: endpoint.example?.request || null
      })),
      readOps: endpoints.filter(e => e.method === 'GET').length,
      writeOps: endpoints.filter(e => ['POST', 'PUT', 'DELETE'].includes(e.method)).length
    };
  };

  const processTextWithAI = async (text: string) => {
    setIsProcessing(true);
    setProcessingStep('Understanding your request...');

    try {
      // Get available endpoints based on selected category
      const availableEndpoints = selectedAction ? getEndpointsByCategory(selectedAction) : getAllEndpoints();
      
      // Create API context for Gemini
      const apiContext = availableEndpoints.map(endpoint => ({
        name: endpoint.name,
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        description: endpoint.description,
        category: endpoint.category,
        parameters: endpoint.parameters || {}
      }));

      // Create intelligent system prompt
      const systemPrompt = `You are an intelligent business automation assistant with access to a comprehensive business management API. 

Available API Endpoints:
${JSON.stringify(apiContext, null, 2)}

Your task is to:
1. Understand the user's business request
2. Identify the most appropriate API endpoint(s) to fulfill their request
3. Determine required parameters
4. Provide a helpful response

User Request: "${text}"

Analyze this request and respond with a JSON object containing:
{
  "understanding": "What the user wants to accomplish",
  "selectedEndpoint": "The best matching API endpoint object from the available list",
  "parameters": "Any required parameters for the API call",
  "response": "A helpful explanation of what you're doing and what they can expect",
  "quickActions": ["Array of 4-6 related actions the user might want to take next"]
}

If the request is unclear or you need more information, set selectedEndpoint to null and ask clarifying questions in the response.
Always be helpful and provide actionable suggestions.`;

      setProcessingStep('Analyzing with Gemini AI...');
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const aiResponse = JSON.parse(jsonMatch[0]);
      
      setProcessingStep('Executing your request...');

      // If AI selected an endpoint, execute it
      if (aiResponse.selectedEndpoint) {
        const endpoint = availableEndpoints.find(ep => 
          ep.name === aiResponse.selectedEndpoint.name || 
          ep.endpoint === aiResponse.selectedEndpoint.endpoint
        );

        if (endpoint) {
          // Check if endpoint requires consent
          if (requiresConsent({ method: endpoint.method, endpoint: endpoint.endpoint })) {
            const consentKey = `${endpoint.method}_${endpoint.endpoint}`;
            
            if (sessionConsents.has(consentKey)) {
              // Already consented, execute directly
              await executeIntelligentApiCall(endpoint, aiResponse.parameters, aiResponse.response);
            } else {
              // Require consent
              setAiPlan({
                endpoint,
                parameters: aiResponse.parameters,
                response: aiResponse.response,
                quickActions: aiResponse.quickActions
              });
              setShowConsentDialog(true);
              setIsProcessing(false);
              setProcessingStep('');
              return;
            }
          } else {
            // Read operations - execute directly
            await executeIntelligentApiCall(endpoint, aiResponse.parameters, aiResponse.response);
          }

          // Set quick actions
          if (aiResponse.quickActions && aiResponse.quickActions.length > 0) {
            setQuickOptions(aiResponse.quickActions);
            setShowQuickOptions(true);
          }
        }
      } else {
        // AI needs clarification
        const clarificationMessage = {
          id: messages.length + 1,
          type: 'ai' as const,
          content: aiResponse.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, clarificationMessage]);

        if (aiResponse.quickActions && aiResponse.quickActions.length > 0) {
          setQuickOptions(aiResponse.quickActions);
          setShowQuickOptions(true);
        }
      }

    } catch (error) {
      console.error('AI Processing failed:', error);
      const errorResponse = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `I apologize, but I'm having trouble understanding that request. Could you please try rephrasing it? I'm here to help with your business operations like:\n\n• Getting dashboard statistics\n• Viewing product information\n• Managing customers\n• Checking orders and sales\n• Financial reports`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const executeIntelligentApiCall = async (endpoint: ApiEndpoint, parameters: any, aiExplanation: string) => {
    try {
      const result = await executeApiCall(endpoint, parameters || {});
      
      let responseContent = aiExplanation + '\n\n';
      
      if (result.success) {
        responseContent += '✅ **Task Completed Successfully!**\n\n';
        
        // Format the data based on endpoint type
        if (result.data) {
          if (Array.isArray(result.data)) {
            responseContent += `📊 **Found ${result.data.length} items:**\n`;
            result.data.slice(0, 5).forEach((item: any, index: number) => {
              responseContent += `${index + 1}. `;
              if (item.name) responseContent += `**${item.name}**`;
              if (item.id) responseContent += ` (ID: ${item.id})`;
              if (item.price) responseContent += ` - $${item.price}`;
              if (item.stock) responseContent += ` - ${item.stock} in stock`;
              if (item.phone) responseContent += ` - 📞 ${item.phone}`;
              if (item.email) responseContent += ` - 📧 ${item.email}`;
              responseContent += '\n';
            });
            if (result.data.length > 5) {
              responseContent += `... and ${result.data.length - 5} more items\n`;
            }
          } else if (typeof result.data === 'object') {
            responseContent += '📊 **Results:**\n';
            Object.entries(result.data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                responseContent += `• **${formattedKey}:** ${value}\n`;
              }
            });
          }
        }
      } else {
        responseContent += `❌ **Error:** ${result.message || 'Operation failed'}`;
      }

      const successMessage = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: responseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);

      toast({
        title: "Task Completed",
        description: `Successfully executed: ${endpoint.name}`,
      });

    } catch (error) {
      const errorMessage = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `❌ **Failed to execute ${endpoint.name}:** ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or ask me to help with something else.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const executeAiPlan = async () => {
    setShowConsentDialog(false);
    
    // Add consent to session cache
    if (aiPlan.endpoint) {
      const consentKey = `${aiPlan.endpoint.method}_${aiPlan.endpoint.endpoint}`;
      setSessionConsents(prev => new Set([...prev, consentKey]));
    }
    
    await executeIntelligentApiCall(aiPlan.endpoint, aiPlan.parameters, aiPlan.response);
    
    // Set quick actions if available
    if (aiPlan.quickActions && aiPlan.quickActions.length > 0) {
      setQuickOptions(aiPlan.quickActions);
      setShowQuickOptions(true);
    }
    
    setAiPlan(null);
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

    // Send optimized API context to AI
    const apiPayload = createApiContextPayload(action);
    
    setTimeout(() => {
      const content = `Great choice! I'm now ready to help you with ${apiPayload.category.name.toLowerCase()}. I can help you with ${apiPayload.category.description.toLowerCase()}. 

What specific task would you like me to help you with? For example, you can ask me to:
• Show you reports and analytics
• Find specific information
• Update or add new data
• Generate summaries

Just tell me what you need in simple terms!`;

      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);

      // Extract and show quick options from the AI response
      const options = extractOptionsFromMessage(content);
      
      // Add specific API endpoints as options for the selected category
      const categoryEndpoints = getEndpointsByCategory(action);
      const endpointOptions = categoryEndpoints.slice(0, 6).map(endpoint => endpoint.name);
      
      const allOptions = [...options, ...endpointOptions];
      const uniqueOptions = [...new Set(allOptions)].slice(0, 8);
      
      if (uniqueOptions.length > 0) {
        setQuickOptions(uniqueOptions);
        setShowQuickOptions(true);
      }
    }, 1000);
  };

  // Helper function to format API responses nicely
  const formatApiResponse = (endpoint: ApiEndpoint, data: any): string => {
    if (!data || !data.success) {
      return `❌ Failed to execute "${endpoint.name}": ${data?.message || 'Unknown error'}`;
    }

    // Handle different types of responses
    if (endpoint.name.toLowerCase().includes('list') || endpoint.name.toLowerCase().includes('all')) {
      // For list endpoints, show a summary table
      const items = data.data?.customers || data.data?.products || data.data?.orders || data.data || [];
      
      if (Array.isArray(items)) {
        const totalItems = items.length;
        const pagination = data.data?.pagination;
        
        // Show first few items as examples
        let summary = `✅ Successfully executed "${endpoint.name}"\n\n`;
        summary += `📊 **Summary:** Found ${totalItems} items${pagination ? ` (Page ${pagination.currentPage} of ${pagination.totalPages}, Total: ${pagination.totalItems})` : ''}\n\n`;
        
        if (totalItems > 0) {
          summary += `**Sample Data:**\n`;
          const sampleItems = items.slice(0, 3);
          
          sampleItems.forEach((item, index) => {
            summary += `${index + 1}. `;
            if (item.name) summary += `**${item.name}** `;
            if (item.id) summary += `(ID: ${item.id}) `;
            if (item.phone && item.phone !== 'N/A') summary += `📞 ${item.phone} `;
            if (item.email && item.email !== null) summary += `📧 ${item.email} `;
            if (item.totalPurchases) summary += `💰 ${item.totalPurchases} `;
            if (item.price) summary += `💰 ${item.price} `;
            if (item.stock) summary += `📦 ${item.stock} units `;
            summary += `\n`;
          });
          
          if (totalItems > 3) {
            summary += `... and ${totalItems - 3} more items\n\n`;
          }
          
          // Add action options
          summary += `**What would you like to do next?**\n`;
          summary += `• View specific item details\n`;
          summary += `• Filter or search the results\n`;
          summary += `• Export the data\n`;
          summary += `• Get more detailed information`;
        }
        
        return summary;
      }
    }
    
    // For single item endpoints
    if (endpoint.name.toLowerCase().includes('get') && endpoint.name.toLowerCase().includes('by id')) {
      const item = data.data;
      let summary = `✅ Successfully executed "${endpoint.name}"\n\n`;
      
      if (item) {
        summary += `**Item Details:**\n`;
        Object.entries(item).forEach(([key, value]) => {
          if (value !== null && value !== 'N/A' && value !== '') {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            summary += `• **${formattedKey}:** ${value}\n`;
          }
        });
      }
      
      return summary;
    }
    
    // For dashboard/stats endpoints
    if (endpoint.name.toLowerCase().includes('dashboard') || endpoint.name.toLowerCase().includes('stats')) {
      const stats = data.data;
      let summary = `✅ Successfully executed "${endpoint.name}"\n\n`;
      summary += `📊 **Dashboard Overview:**\n`;
      
      Object.entries(stats).forEach(([key, value]) => {
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        summary += `• **${formattedKey}:** ${value}\n`;
      });
      
      return summary;
    }
    
    // Default formatted response
    return `✅ Successfully executed "${endpoint.name}"\n\n${JSON.stringify(data, null, 2)}`;
  };

  const handleQuickOptionClick = async (option: string) => {
    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: option,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuickOptions([]);
    setShowQuickOptions(false);
    
    // Try to find direct API match first
    const allEndpoints = getAllEndpoints();
    const directMatch = allEndpoints.find(endpoint => 
      endpoint.name.toLowerCase() === option.toLowerCase() ||
      endpoint.name.toLowerCase().includes(option.toLowerCase()) ||
      option.toLowerCase().includes(endpoint.name.toLowerCase())
    );

    if (directMatch) {
      // Check if endpoint requires parameters
      const needsParameters = directMatch.parameters && (
        (directMatch.parameters.path && Object.keys(directMatch.parameters.path).length > 0) ||
        (directMatch.parameters.body && Object.keys(directMatch.parameters.body).length > 0)
      );

      if (needsParameters) {
        // Show parameter input dialog
        setPendingEndpoint(directMatch);
        setParameterInputs({});
        setShowParameterDialog(true);
      } else {
        // Execute API directly
        await executeEndpointWithFormatting(directMatch, {});
      }
    } else {
      // Process with AI if no direct match
      setTimeout(() => processTextWithAI(option), 500);
    }
  };

  const executeEndpointWithFormatting = async (endpoint: ApiEndpoint, parameters: any) => {
    setIsProcessing(true);
    setProcessingStep(`Executing ${endpoint.name}...`);
    
    try {
      const result = await executeApiCall(endpoint, parameters);
      const formattedResponse = formatApiResponse(endpoint, result);
      
      const successMessage = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: formattedResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      
      toast({
        title: "API Executed",
        description: `${endpoint.name} completed successfully`,
      });
    } catch (error) {
      const errorMessage = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `❌ Failed to execute "${endpoint.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "API Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const extractOptionsFromMessage = (content: string): string[] => {
    const options: string[] = [];
    
    // Enhanced patterns to catch various formats of AI suggestions
    const patterns = [
      // "I can help you with:" followed by bullet points
      /I can help you with:?\s*(?:the following)?[^\n]*\n?((?:\s*[-•*]\s*[^\n]+\n?)+)/gi,
      // "Here are some things:" format  
      /(?:Here are|I can do|Available options|You can ask me to)[:\s]*\n?((?:\s*[-•*]\s*[^\n]+\n?)+)/gi,
      // Direct bullet lists
      /((?:^\s*[-•*]\s*[^\n]+\n?)+)/gm,
      // Numbered lists
      /((?:^\s*\d+\.\s*[^\n]+\n?)+)/gm,
      // Dash separated items
      /(?:tasks?:?\s*)?[-–]\s*([^-–\n]+?)(?:\s*[-–]|\n|$)/gi,
      // API names in the format "Get Something" or "Fetch Something"
      /((?:Get|Fetch|Show|Retrieve|Display|List|Find|Search|Create|Update|Delete|Generate)\s+[A-Z][a-zA-Z\s]+)/gi
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Split by lines and clean each line
          const lines = match.split('\n');
          lines.forEach(line => {
            const cleanOption = line
              .replace(/^[\s\d\.•*-–]+/, '') // Remove bullets, numbers, dashes
              .replace(/[,.]$/, '') // Remove trailing punctuation
              .trim();
            
            // Only add meaningful options
            if (cleanOption.length > 5 && cleanOption.length < 80 && 
                !cleanOption.match(/^(I can|Here are|Available|You can|the following)/i)) {
              options.push(cleanOption);
            }
          });
        });
      }
    });

    // Context-aware options based on selected action
    if (selectedAction) {
      const categoryEndpoints = getEndpointsByCategory(selectedAction);
      categoryEndpoints.forEach(endpoint => {
        // Check if the content mentions this endpoint's functionality
        const keywords = endpoint.name.toLowerCase().split(' ');
        const hasKeywords = keywords.some(keyword => 
          content.toLowerCase().includes(keyword) && keyword.length > 2
        );
        
        if (hasKeywords || content.toLowerCase().includes(endpoint.name.toLowerCase())) {
          options.push(endpoint.name);
        }
      });
    }

    // Remove duplicates and limit options
    const uniqueOptions = [...new Set(options)];
    return uniqueOptions.slice(0, 8); // Limit to 8 options for better UX
  };

  const executeApiDirectly = async (endpoint: ApiEndpoint, parameters: any) => {
    setExecutingApi(true);
    try {
      const result = await executeApiCall(endpoint, parameters);
      setApiResponse(result);
      
      const successMessage = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `✅ Successfully executed ${endpoint.name}. Check the API Explorer for detailed response.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);

      toast({
        title: "API Executed Successfully",
        description: `${endpoint.name} completed successfully`,
      });
    } catch (error) {
      const errorMessage = {
        id: messages.length + 1,
        type: 'ai' as const,
        content: `❌ Failed to execute ${endpoint.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "API Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setExecutingApi(false);
    }
  };

  return (
    <div className="p-0">
      <div className='p-0'>
        {/* Header with Tabs */}
        <div className="flex gap-3 flex-col p-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={!showApiExplorer ? "default" : "outline"}
                onClick={() => setShowApiExplorer(false)}
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </Button>
              <Button
                variant={showApiExplorer ? "default" : "outline"}
                onClick={() => setShowApiExplorer(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                API Explorer
              </Button>
            </div>
          </div>

          {!showApiExplorer ? (
            /* AI Chat Interface */
            <Card className="flex justify-between flex-col">
              <CardHeader className='p-6'>
                <CardTitle className="flex items-center gap-2 pb-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Assistant - Comprehensive Business API Access
                </CardTitle>
                {/* Removed quick action buttons as requested */}
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
                       <div className="flex items-center justify-between gap-2 mt-2">
                         <span className="text-xs opacity-70">
                           {message.timestamp.toLocaleTimeString()}
                         </span>
                         {message.type === 'ai' && (
                           <Button
                             onClick={() => speakResponse(message.content)}
                             variant="ghost"
                             size="sm"
                             disabled={isSpeaking}
                             className="h-6 px-2 text-xs"
                           >
                             {isSpeaking ? (
                               <VolumeX className="h-3 w-3" />
                             ) : (
                               <Volume2 className="h-3 w-3" />
                             )}
                             Speak
                           </Button>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}

                 {/* Quick Options */}
                 {showQuickOptions && quickOptions.length > 0 && (
                   <div className="flex justify-start">
                     <div className="max-w-[80%] space-y-2">
                       <p className="text-xs text-muted-foreground px-3">Quick options:</p>
                       <div className="flex flex-wrap gap-2">
                         {quickOptions.map((option, index) => (
                           <Button
                             key={index}
                             variant="outline"
                             size="sm"
                             onClick={() => handleQuickOptionClick(option)}
                             className="text-xs h-8"
                           >
                             {option}
                           </Button>
                         ))}
                       </div>
                     </div>
                   </div>
                 )}

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
                {/* Text Input with Action Buttons */}
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
                      rows={1}
                    />
                    
                    {/* Action buttons on the right */}
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={startVoiceRecognition}
                        variant="outline"
                        size="sm"
                        disabled={isProcessing || isListening}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                        {isListening ? 'Listening...' : 'Voice'}
                      </Button>
                      
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
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      
                      <Button onClick={handleSendMessage} size="sm" disabled={!textInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Uploaded image preview */}
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

              {/* Parameter Input Dialog */}
              <Dialog open={showParameterDialog} onOpenChange={setShowParameterDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Enter API Parameters
                    </DialogTitle>
                    <DialogDescription>
                      {pendingEndpoint && `"${pendingEndpoint.name}" requires some parameters. Please fill them in below.`}
                    </DialogDescription>
                  </DialogHeader>

                  {pendingEndpoint && (
                    <div className="space-y-4">
                      {/* Path Parameters */}
                      {pendingEndpoint.parameters?.path && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Required Parameters</h4>
                          {Object.entries(pendingEndpoint.parameters.path).map(([key, desc]) => (
                            <div key={key} className="mb-3">
                              <label className="text-sm font-medium mb-1 block">{key}</label>
                              <Input
                                placeholder={String(desc)}
                                value={parameterInputs[key] || ''}
                                onChange={(e) => setParameterInputs(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }))}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Body Parameters */}
                      {pendingEndpoint.parameters?.body && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Request Data</h4>
                          {Object.entries(pendingEndpoint.parameters.body).map(([key, desc]) => (
                            <div key={key} className="mb-3">
                              <label className="text-sm font-medium mb-1 block">{key}</label>
                              <Input
                                placeholder={String(desc)}
                                value={parameterInputs[key] || ''}
                                onChange={(e) => setParameterInputs(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }))}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowParameterDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (pendingEndpoint) {
                          setShowParameterDialog(false);
                          
                          // Format parameters properly
                          const formattedParams: any = {};
                          if (pendingEndpoint.parameters?.path) {
                            formattedParams.path = {};
                            Object.keys(pendingEndpoint.parameters.path).forEach(key => {
                              formattedParams.path[key] = parameterInputs[key];
                            });
                          }
                          if (pendingEndpoint.parameters?.body) {
                            formattedParams.body = {};
                            Object.keys(pendingEndpoint.parameters.body).forEach(key => {
                              formattedParams.body[key] = parameterInputs[key];
                            });
                          }
                          
                          await executeEndpointWithFormatting(pendingEndpoint, formattedParams);
                          setPendingEndpoint(null);
                          setParameterInputs({});
                        }
                      }}
                      disabled={!pendingEndpoint || (pendingEndpoint.parameters?.path && 
                        Object.keys(pendingEndpoint.parameters.path).some(key => !parameterInputs[key]))}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Execute API
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>


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
                        <h4 className="font-medium text-sm mb-2">AI Response:</h4>
                        <p className="text-sm text-muted-foreground">
                          {aiPlan.response}
                        </p>
                      </div>
                      
                      {aiPlan.endpoint && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Planned API Call:</h4>
                          <p className="text-sm text-muted-foreground">
                            {aiPlan.endpoint.name} - {aiPlan.endpoint.description}
                          </p>
                        </div>
                      )}
                      
                      {aiPlan.endpoint && requiresConsent({ method: aiPlan.endpoint.method, endpoint: aiPlan.endpoint.endpoint }) && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-sm mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Write Operation</span>
                          </div>
                          <p className="text-orange-600 dark:text-orange-400 text-sm">
                            This will execute real API operations on your system. Please review carefully.
                          </p>
                          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                            <strong>{aiPlan.endpoint.method}</strong> {aiPlan.endpoint.endpoint}
                          </div>
                        </div>
                      )}

                      {aiPlan.endpoint && !requiresConsent({ method: aiPlan.endpoint.method, endpoint: aiPlan.endpoint.endpoint }) && (
                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Read Operation - Safe</span>
                          </div>
                        </div>
                      )}

                      {sessionConsents.size > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Session consents active: {sessionConsents.size} operations
                        </div>
                      )}
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
          ) : (
            /* API Explorer Interface */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* API Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    API Categories
                  </CardTitle>
                  <Input
                    placeholder="Search APIs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {Object.entries(apiCategories).map(([key, category]) => {
                      const endpoints = getEndpointsByCategory(key);
                      const filteredEndpoints = searchQuery 
                        ? searchEndpoints(searchQuery).filter(e => e.category === key)
                        : endpoints;
                      
                      if (searchQuery && filteredEndpoints.length === 0) return null;
                      
                      return (
                        <div key={key}>
                          <Button
                            variant={selectedApiCategory === key ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSelectedApiCategory(key)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {React.createElement(eval(category.icon), { className: "h-4 w-4" })}
                              <div className="text-left flex-1">
                                <div className="font-medium text-sm">{category.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {filteredEndpoints.length} endpoints
                                </div>
                              </div>
                            </div>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {apiCategories[selectedApiCategory]?.name || 'Endpoints'}
                  </CardTitle>
                  <CardDescription>
                    {apiCategories[selectedApiCategory]?.description || 'Select endpoints to execute'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {(searchQuery ? searchEndpoints(searchQuery) : getEndpointsByCategory(selectedApiCategory)).map((endpoint, index) => (
                      <Button
                        key={index}
                        variant={selectedEndpoint?.name === endpoint.name ? "default" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setSelectedEndpoint(endpoint);
                          setApiParameters({});
                          setApiResponse(null);
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Badge variant={endpoint.method === 'GET' ? 'secondary' : endpoint.method === 'POST' ? 'default' : endpoint.method === 'PUT' ? 'outline' : 'destructive'}>
                            {endpoint.method}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{endpoint.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{endpoint.endpoint}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* API Details & Execution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    API Execution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEndpoint ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">{selectedEndpoint.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{selectedEndpoint.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant={selectedEndpoint.method === 'GET' ? 'secondary' : 'default'}>
                            {selectedEndpoint.method}
                          </Badge>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{selectedEndpoint.endpoint}</code>
                        </div>
                      </div>

                      {/* Parameter Inputs */}
                      {selectedEndpoint.parameters && (
                        <div className="space-y-3">
                          {selectedEndpoint.parameters.path && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Path Parameters</h5>
                              {Object.entries(selectedEndpoint.parameters.path).map(([key, desc]) => (
                                <div key={key} className="mb-2">
                                  <label className="text-xs font-medium">{key}</label>
                                  <Input
                                    placeholder={String(desc)}
                                    value={apiParameters.path?.[key] || ''}
                                    onChange={(e) => setApiParameters(prev => ({
                                      ...prev,
                                      path: { ...prev.path, [key]: e.target.value }
                                    }))}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedEndpoint.parameters.query && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Query Parameters</h5>
                              {Object.entries(selectedEndpoint.parameters.query).map(([key, desc]) => (
                                <div key={key} className="mb-2">
                                  <label className="text-xs font-medium">{key}</label>
                                  <Input
                                    placeholder={String(desc)}
                                    value={apiParameters.query?.[key] || ''}
                                    onChange={(e) => setApiParameters(prev => ({
                                      ...prev,
                                      query: { ...prev.query, [key]: e.target.value }
                                    }))}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedEndpoint.parameters.body && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Request Body</h5>
                              <Textarea
                                placeholder="Enter JSON body parameters..."
                                value={apiParameters.body ? JSON.stringify(apiParameters.body, null, 2) : ''}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    setApiParameters(prev => ({ ...prev, body: parsed }));
                                  } catch {
                                    // Invalid JSON, keep as string
                                  }
                                }}
                                rows={4}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() => executeApiDirectly(selectedEndpoint, apiParameters)}
                        disabled={executingApi}
                        className="w-full"
                      >
                        {executingApi ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute API
                          </>
                        )}
                      </Button>

                      {/* API Response */}
                      {apiResponse && (
                        <div className="mt-4">
                          <h5 className="font-medium text-sm mb-2">Response</h5>
                          <pre className="text-xs bg-muted p-3 rounded max-h-40 overflow-auto">
                            {JSON.stringify(apiResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select an API endpoint to view details and execute</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoMate;