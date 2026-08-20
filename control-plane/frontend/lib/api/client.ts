// Base API Client for THEDAL Control Plane

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : endpoint.startsWith("/api")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorData.error || errorDetail;
      } catch {
        errorDetail = await response.text() || errorDetail;
      }
      throw new ApiError(errorDetail, response.status, errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err.message || "Failed to connect to THEDAL backend service",
      0,
      { isNetworkError: true }
    );
  }
}
