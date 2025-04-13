import { API_BASE_URL, ApiResponse, DEFAULT_HEADERS, handleApiError } from './config';

/**
 * Type for a chat message
 */
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Type for chat request
 */
export type ChatRequest = {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

/**
 * Type for chat response
 */
export type ChatResponse = {
  status: number;
  output?: string;
  message?: string;
};

/**
 * Sends a chat request to the backend
 */
export async function sendChatRequest(chatData: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(chatData),
    });
    
    if (!response.ok) {
      return {
        status: response.status,
        error: `Failed to process chat: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      status: response.status,
      data
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Sends a streaming chat request and returns a readable stream
 */
export async function createChatStream(chatData: ChatRequest): Promise<ReadableStream<Uint8Array> | null> {
  // Make sure stream is enabled
  const streamData = { ...chatData, stream: true };
  
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(streamData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process chat: ${response.statusText}`);
    }
    
    return response.body;
  } catch (error) {
    console.error('Error creating chat stream:', error);
    return null;
  }
} 