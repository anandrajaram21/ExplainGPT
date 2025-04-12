// API helper functions for making requests to the backend

/**
 * Base URL for the backend API
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic type for API responses
 */
export type ApiResponse<T> = {
  status: number;
  data?: T;
  error?: string;
};

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
    const response = await fetch(`${API_BASE_URL}/model/token_probs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    return {
      status: 500,
      error: `Error processing prompt: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 