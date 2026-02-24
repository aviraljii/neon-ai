/**
 * Centralized API client for all backend requests
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  chatHistory: ChatMessage[];
  imageUrl?: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  error?: string;
}

interface UploadResponse {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Send a chat message to the AI
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const endpoint = BASE_URL ? `${BASE_URL}/api/chat` : '/api/chat';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const errorText = await response.text();
      throw new Error(
        response.ok
          ? 'Neon AI returned an unexpected response format.'
          : `Neon AI request failed (${response.status}): ${errorText.slice(0, 200)}`
      );
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      const baseError = data?.error || 'Failed to get response from Neon AI';
      const errorWithCode = data?.code ? `${data.code}: ${baseError}` : baseError;
      throw new Error(errorWithCode);
    }

    return {
      success: true,
      response: data.response || 'No response received. Please try again.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return {
      success: false,
      response: '',
      error: errorMessage,
    };
  }
}

/**
 * Upload an image file
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  try {
    // Validate file
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPG, PNG, and WEBP images are allowed');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB');
    }

    const formData = new FormData();
    formData.append('image', file);

    const endpoint = BASE_URL ? `${BASE_URL}/api/upload` : '/api/upload';
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    const url = String(data.url || '');
    if (!url) {
      throw new Error('Upload did not return a URL');
    }

    return {
      success: true,
      url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return {
      success: false,
      url: '',
      error: errorMessage,
    };
  }
}

/**
 * Parse API error message
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
