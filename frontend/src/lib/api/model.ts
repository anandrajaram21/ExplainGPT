import { API_BASE_URL, ApiResponse, DEFAULT_HEADERS, handleApiError } from './config';

/**
 * Type for model change request
 */
export type ModelChangeRequest = {
  model_name: string;
};

/**
 * Type for model change response
 */
export type ModelChangeResponse = {
  status: number;
  message: string;
};

/**
 * Type for playground parameters
 */
export type PlaygroundParams = {
  text: string;
  temperature: number;
  top_k: number;
  top_p: number;
  max_length: number;
  num_return_sequences: number;
};

/**
 * Type for playground response
 */
export type PlaygroundResponse = {
  status: number;
  outputs: string[];
  message?: string;
};

/**
 * Changes the active model
 */
export async function changeModel(modelName: string): Promise<ApiResponse<ModelChangeResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/model/change_model`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ model_name: modelName }),
    });

    if (!response.ok) {
      return {
        status: response.status,
        error: `Failed to change model: ${response.statusText}`
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
 * Sends a playground request to generate text with specific parameters
 */
export async function generatePlaygroundText(params: PlaygroundParams): Promise<ApiResponse<PlaygroundResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/playground`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return {
        status: response.status,
        error: `Failed to generate text: ${response.statusText}`
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