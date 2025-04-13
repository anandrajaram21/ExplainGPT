import { API_BASE_URL, ApiResponse, DEFAULT_HEADERS, handleApiError } from './config';

/**
 * Type for token probability data
 */
export type TokenProbability = {
  id: number;
  text: string;
  probability: number;
  selected?: boolean;
};

/**
 * Type for a token step with alternatives
 */
export type TokenStep = {
  step: number;
  generated_token: {
    id: number;
    text: string;
    score: number;
    probability: number;
  };
  top_alternatives: TokenProbability[];
};

/**
 * Type for token probabilities response
 */
export type TokenProbsResponse = {
  status: number;
  token_probs: TokenStep[];
};

/**
 * Type for prompt request
 */
export type PromptRequest = {
  text: string;
  max_length?: number;
};

/**
 * Sends a prompt to the backend and gets token probabilities
 */
export async function sendPrompt(promptData: PromptRequest): Promise<ApiResponse<TokenProbsResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/token_probs`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(promptData),
    });
    
    if (!response.ok) {
      return {
        status: response.status,
        error: `Failed to process prompt: ${response.statusText}`
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