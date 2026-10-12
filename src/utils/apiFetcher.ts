// import { useNavigate } from 'react-router-dom';

/**
 * Handle 401 Unauthorized responses
 */
const handle401Error = () => {
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('allowedOrganization');
    localStorage.removeItem('roles');
    localStorage.removeItem('permissions'); 
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/'; 
};

/**
 * Unified structure for API responses.
 */
export interface ApiResponse<T = any> {

    success: boolean;
    data: T | null; // Generic type for response data
    status: number | null;
    error: string | null;
    message?: string;
}


/**
 * Fetcher function for POST requests with JSON body.
 */
export const apiPostFetcher = async <T>(
    url: string,
    body: object,
    token: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            body: JSON.stringify(body),
            ...options,
        });

        const status = response.status;
        let data: T | null = null;
        let error: string | null = null;
        let message: string | undefined;

        try {
            data = await response.json();
            message = (data as any)?.message;
        } catch {
            data = null;
        }

        const success = response.ok;

        if (!success) {
            error = (data as any)?.error || `Error ${status}`;
        }

        return { success, data, status, error, message };
    } catch (err: any) {
        return { success: false, data: null, status: null, error: err.message || "Network Error" };
    }
};


/**
 * Fetcher function for PUT requests with JSON body.
 */
export const apiPutFetcher = async <T>(
    url: string,
    body: Record<string, unknown>,
    token: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            body: JSON.stringify(body),
            ...options,
        });

        const status = response.status;
        let data: T | string | null = null;
        let error: string | null = null;
        let message: string | undefined;

        try {
            data = await response.json();
            message = (data as any)?.message;
        } catch {
            data = await response.text();
        }

        if (!response.ok) {
            error = (data as any)?.message || `Error ${status}`;
            if (status === 401) {
                handle401Error();
            }
        }

        return { success: response.ok, data: data as T, status, error, message };
    } catch (err: any) {
        console.error("API PUT fetcher error:", err);
        return { success: false, data: null, status: null, error: err.message || "Network Error" };
    }
};

/**
 * Fetcher function for POST requests with FormData.
 */
export const postFormDataAPI = async <T>(
    url: string,
    formData: FormData,
    token: string
): Promise<ApiResponse<T>> => {
    const defaultHeaders: Record<string, string> = {
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: defaultHeaders, // Do not set 'Content-Type'; browser handles it for FormData
            body: formData,
        });

        const status = response.status;
        let data: T | string | null = null;
        let error: string | null = null;
        let message: string | undefined;

        try {
            data = await response.json();
            message = (data as any)?.message;
        } catch {
            data = await response.text();
        }

        if (!response.ok) {
            error = (data as any)?.message || `Error ${status}`;
            if (status === 401) {
                handle401Error();
            }
        }

        return { success: response.ok, data: data as T, status, error, message };
    } catch (err: any) {
        console.error("API POST FormData fetcher error:", err);
        return { success: false, data: null, status: null, error: err.message || "Network Error" };
    }
};

/**
 * Fetcher function for PUT requests with FormData.
 */
export const updateFormDataAPI = async <T>(
    url: string,
    formData: FormData,
    token: string
): Promise<ApiResponse<T>> => {
    const defaultHeaders: Record<string, string> = {
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: defaultHeaders,
            body: formData,
        });

        const status = response.status;
        let data: T | string | null = null;
        let error: string | null = null;
        let message: string | undefined;

        try {
            data = await response.json();
            message = (data as any)?.message;
        } catch {
            data = await response.text();
        }

        if (!response.ok) {
            error = (data as any)?.message || `Error ${status}`;
            if (status === 401) {
                handle401Error();
            }
        }

        return {success: response.ok, data: data as T, status, error, message };
    } catch (err: any) {
        console.error("API PUT FormData fetcher error:", err);
        return { success: false, data: null, status: null, error: err.message || "Network Error" };
    }
};

/**
 * Fetcher function for GET requests.
 */
export const apiGetFetcher = async <T>(
    url: string,
    token: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            ...options,
        });

        const status = response.status;
        let data: T | string | null = null;
        let error: string | null = null;
        let message: string | undefined;

        try {
            data = await response.json();
            message = (data as any)?.message;
        } catch {
            console.error("Cannot parse the response from the server.");
        }

        if (!response.ok) {
            error = (data as any)?.message || `Error ${status}`;
            if (status === 401) {
                handle401Error();
            }
        }

        return {success: response.ok, data: data as T, status, error, message };
    } catch (err: any) {
        console.error("API GET fetcher error:", err);
        return { success: false, data: null, status: null, error: err.message || "Network Error" };
    }
};

/**
 * Fetcher function for DELETE requests.
 */
export const apiDeleteFetcher = async <T>(
    url: string,
    token: string,
    body?: BodyInit | null,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        body, // Pass the body directly (already stringified if provided)
        ...options,
      });

      const status = response.status;
      let data: T | string | null = null;
      let error: string | null = null;
      let message: string | undefined;

      try {
        data = await response.json();
        message = (data as any)?.message;
      } catch {
        console.error("Error parsing the response.");
      }

      if (!response.ok) {
        error = (data as any)?.message || `Error ${status}`;
        if (status === 401) {
          handle401Error();
        }
      }

      return { success: response.ok, data: data as T, status, error, message };
    } catch (err: any) {
      console.error("API DELETE fetcher error:", err);
      return { success: false, data: null, status: null, error: err.message || "Network Error" };
    }
  };


  export const apiPatchFetcher = async (
    url: string,
    payload: any,
    token: string
  ): Promise<ApiResponse<any>> => {
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return {
        success: res.ok,
        status: res.status,
        data,
        error: !res.ok ? data?.error || "Request failed" : null,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        status: 500,
        data: null,
        error: "Network error",
      };
    }
  };
  
