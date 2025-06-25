interface AxiosRequestConfig {
  method?: string;
  url?: string;
  data?: unknown;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
}

interface AxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
}

interface AxiosError extends Error {
  config: AxiosRequestConfig;
  response?: {
    status: number;
    data: unknown;
    headers: Record<string, string>;
  };
}

const createAxiosError = (message: string, config: AxiosRequestConfig, response?: Response): AxiosError => {
  const error = new Error(message) as AxiosError;
  error.config = config;
  if (response) {
    error.response = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: null
    };
  }
  return error;
};

const request = async function<T = unknown>(config: string | AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const fullConfig: AxiosRequestConfig = typeof config === 'string' ? { url: config } : config;
  
  try {
    // Determine if the data is URLSearchParams
    const isFormData = fullConfig.data instanceof URLSearchParams;
    
    // Set appropriate content type and body
    const headers = {
      ...(fullConfig.headers || {})
    };
    
    // Only set Content-Type if not already set
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = isFormData ? 'application/x-www-form-urlencoded' : 'application/json';
    }
    
    let body: string | URLSearchParams | undefined;
    if (fullConfig.data) {
      body = isFormData ? (fullConfig.data as URLSearchParams) : JSON.stringify(fullConfig.data);
    }
    
    const response = await fetch(fullConfig.url!, {
      method: fullConfig.method || 'GET',
      headers,
      body,
      redirect: fullConfig.maxRedirects === 0 ? 'error' : 'follow',
    });

    const validateStatus = fullConfig.validateStatus || ((status: number) => status >= 200 && status < 300);
    
    if (!validateStatus(response.status)) {
      throw createAxiosError(
        `Request failed with status ${response.status}`,
        fullConfig,
        response
      );
    }

    const data = await response.json();
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config: fullConfig
    };
  } catch (error) {
    if (error instanceof Error) {
      throw createAxiosError(error.message, fullConfig);
    }
    throw error;
  }
};

interface AxiosInstance {
  <T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
  isAxiosError: (error: unknown) => error is AxiosError;
}

const axios = request as AxiosInstance;

axios.get = async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return request({ ...config, method: 'GET', url });
};

axios.post = async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return request({ ...config, method: 'POST', url, data });
};

axios.isAxiosError = (error: unknown): error is AxiosError => {
  return !!(error && typeof error === 'object' && error !== null && 'config' in error && 'message' in error);
};

export default axios;
