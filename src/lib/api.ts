import {
  AuthResponse,
  ChatHistoryResponse,
  ChatResponse,
  DiagnosisResponse,
  HealthResponse,
  UserResponse,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const ACCESS_TOKEN_KEY = 'dd_access_token';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/**
 * Shared API request helper.
 *
 * Authentication is handled here so every protected request receives
 * the JWT automatically.
 */
async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  const token = getAccessToken();

  const headers = new Headers(init?.headers);

  headers.set('Accept', 'application/json');

  if (init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      `Couldn't reach the API at ${API_BASE_URL}. Confirm the backend is running and reachable from this browser.`
    );
  }

  if (!response.ok) {
    let detail = `Server responded with ${response.status}.`;

    try {
      const body = await response.json();

      if (typeof body?.detail === 'string') {
        detail = body.detail;
      }
    } catch {
      // Keep the HTTP status message when the response isn't JSON.
    }

    if (response.status === 401) {
      clearAccessToken();
    }

    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export interface RegisterRequest {
  email: string;
  password: string;
  name:string;
  practitioner_attestation: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Creates an authenticated practitioner account.
 *
 * This does NOT verify professional identity. The backend records the
 * practitioner as self-attested.
 */
export async function register(
  data: RegisterRequest
): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  setAccessToken(response.access_token);

  return response;
}

/**
 * Authenticates an existing account.
 */
export async function login(
  data: LoginRequest
): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  setAccessToken(response.access_token);

  return response;
}

/**
 * Returns the currently authenticated user.
 */
export function getCurrentUser(): Promise<UserResponse> {
  return request<UserResponse>('/auth/me');
}

/**
 * Logs the user out locally.
 *
 * The current backend uses stateless JWT access tokens, so removing the
 * browser token is the client-side logout operation.
 */
export function logout(): void {
  clearAccessToken();
}

/**
 * Whether this browser currently has an access token.
 */
export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/* -------------------------------------------------------------------------- */
/* Chat                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Primary conversational endpoint exposed by the backend.
 *
 * The backend owns the conversation history and authenticates the session
 * against the current user.
 */
export function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatResponse> {
  return request<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });
}

/**
 * Hydrate a case from the backend's persistent chat history.
 */
export function getChatHistory(
  sessionId: string
): Promise<ChatHistoryResponse> {
  return request<ChatHistoryResponse>(
    `/chat/${encodeURIComponent(sessionId)}`
  );
}

/* -------------------------------------------------------------------------- */
/* Diagnosis                                                                  */
/* -------------------------------------------------------------------------- */

export function runTextDiagnosis(
  text: string,
  sessionId: string
): Promise<DiagnosisResponse> {
  return request<DiagnosisResponse>('/diagnose/text', {
    method: 'POST',
    body: JSON.stringify({
      text,
      session_id: sessionId,
    }),
  });
}

export function runStructuredDiagnosis(
  patientData: Record<string, unknown>,
  sessionId?: string
): Promise<DiagnosisResponse> {
  return request<DiagnosisResponse>('/diagnose/structured', {
    method: 'POST',
    body: JSON.stringify({
      patient_data: patientData,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  });
}

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}