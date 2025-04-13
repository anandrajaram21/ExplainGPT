import { API_BASE_URL, ApiResponse } from './config';

/**
 * Type for attention data request
 */
export type AttentionRequest = {
  text: string;
};

/**
 * Type for attention data response
 */
export type AttentionResponse = {
  tokens: string[];
  attention: number[][][][]; // [layer][head][from_token][to_token]
  num_layers: number;
  num_heads: number;
  seq_len: number;
};

/**
 * Fetches attention weights for visualization
 */
export async function getAttentionData(request: AttentionRequest): Promise<ApiResponse<AttentionResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/attention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      return {
        status: response.status,
        error: `Failed to get attention data: ${response.statusText}`
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
      error: `Error getting attention data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 