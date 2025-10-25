export const GEMINI_API_KEY = "AIzaSyBm-JYWO7AtzUPM8_BEEMSqaARcRqHKWPA";
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export class GeminiService {
  private static async makeRequest(request: GeminiRequest): Promise<string> {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  static async processVoiceCommand(
    voiceText: string, 
    selectedAction: string,
    availableEndpoints: Record<string, any>
  ): Promise<{
    intent: string;
    action: string;
    parameters: Record<string, any>;
    apiCall: {
      endpoint: string;
      method: string;
      payload?: any;
    } | null;
    response: string;
    quickOptions?: string[];
  }> {
    const systemPrompt = `You are an AI assistant for a business management system. 

Available API endpoints:
${JSON.stringify(availableEndpoints, null, 2)}

The user wants to work with: ${selectedAction}

Analyze the voice command and return a JSON response with:
{
  "intent": "what the user wants to do",
  "action": "specific action to take", 
  "parameters": "extracted parameters",
  "apiCall": {
    "endpoint": "exact API endpoint to call",
    "method": "HTTP method",
    "payload": "request body if needed"
  },
  "response": "friendly response to user with specific actionable suggestions",
  "quickOptions": ["List of clickable options user can choose from"]
}

IMPORTANT: Always include quickOptions array with 4-8 specific actionable items the user can click on.
For example, if they ask about dashboard, include options like:
- "Get Dashboard Stats"
- "Get Enhanced Dashboard Stats" 
- "Get Revenue Trend"
- "Get Category Performance"
- "Get Daily Sales"
- "Get Inventory Status"

Make sure quickOptions match actual API endpoint names when possible.
If you cannot determine a specific API call, set apiCall to null but still provide quickOptions.

Voice command: "${voiceText}"`;

    const request: GeminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await this.makeRequest(request);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        intent: 'unknown',
        action: 'parse_error',
        parameters: {},
        apiCall: null,
        response: 'I had trouble understanding your request. Please try again with a clearer command.',
        quickOptions: [
          "Get Dashboard Stats",
          "List All Products", 
          "List All Customers",
          "Get Enhanced Dashboard Stats",
          "Get Daily Sales",
          "Show basic dashboard statistics"
        ]
      };
    }
  }

  static async processImageAnalysis(
    imageBase64: string,
    selectedAction: string,
    availableEndpoints: Record<string, any>
  ): Promise<{
    analysis: string;
    extractedData: Record<string, any>;
    suggestedActions: string[];
    apiCalls: Array<{
      endpoint: string;
      method: string;
      payload?: any;
    }>;
    response: string;
  }> {
    const systemPrompt = `You are an AI assistant analyzing business documents/images for a management system.

Available API endpoints:
${JSON.stringify(availableEndpoints, null, 2)}

Context: User is working with ${selectedAction}

Analyze this image and extract relevant business data. Return JSON with:
{
  "analysis": "description of what you see",
  "extractedData": "structured data extracted from image",
  "suggestedActions": ["list of suggested actions"],
  "apiCalls": [{"endpoint": "api to call", "method": "HTTP method", "payload": "data to send"}],
  "response": "friendly response to user"
}`;

    const request: GeminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              text: `data:image/jpeg;base64,${imageBase64}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await this.makeRequest(request);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        analysis: 'Image analysis failed',
        extractedData: {},
        suggestedActions: [],
        apiCalls: [],
        response: 'I had trouble analyzing the image. Please try uploading a clearer image.'
      };
    }
  }

  static async translateToUrdu(text: string): Promise<string> {
    try {
      const systemPrompt = `You are a translator. Translate the following name/text to Urdu. Return ONLY the Urdu translation, nothing else. Do not add any explanations or additional text.

Text to translate: "${text}"`;

      const request: GeminiRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
        }
      };

      const response = await this.makeRequest(request);
      return response.trim();
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text if translation fails
    }
  }

  static async rewriteRomanUrduToUrdu(text: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert Urdu translator. The user has written a message in Roman Urdu (Urdu written in English/Latin script). Your task is to convert this Roman Urdu text into proper Urdu script (اردو).

IMPORTANT RULES:
1. Return ONLY the Urdu script translation
2. Do NOT add any explanations, notes, or additional text
3. Maintain the exact meaning and tone of the original message
4. Use proper Urdu grammar and spelling
5. Keep numbers and currency symbols (like PKR) as they are

Roman Urdu text to convert:
"${text}"`;

      const request: GeminiRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      };

      const response = await this.makeRequest(request);
      return response.trim();
    } catch (error) {
      console.error('Roman Urdu to Urdu conversion failed:', error);
      throw error;
    }
  }
}