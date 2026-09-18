// API response types mirror app/schemas.py in the backend.
// Keep these aligned with the Pydantic contracts.

export interface TopFactor {
  feature: string;
  value: number;
  direction: string;
  magnitude: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verification_status: "self_attested" | string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  verification_status: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface ModelExplanation {
  base_rate_probability: number;
  raw_model_probability: number;
  top_factors: TopFactor[];
}

export interface DiagnosisResponse {
  session_id: string;
  primary_diagnosis: string;
  full_diagnosis: string;
  malaria_probability: number;
  covid_probability: number;
  confidence: number;
  malaria_model_prediction: string;
  covid_model_prediction: string;
  recommendations: string[];
  malaria_explanation: ModelExplanation;
  covid_explanation: ModelExplanation;
  covid_model_status: string;
  extracted_features?: Record<string, unknown> | null;
}

export interface HealthResponse {
  status: string;
  malaria_model_loaded: boolean;
  covid_model_loaded: boolean;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
}

export interface BackendChatMessage {
  role: string;
  content: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: BackendChatMessage[];
}

// Frontend view-models. These are deliberately separate from backend schemas.

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  diagnosis?: DiagnosisResponse;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export interface VerificationRecord {
  fullName: string;
  licenseNumber: string;
  issuingBody: string;
  profession: string;
  verifiedAt: number;
}
