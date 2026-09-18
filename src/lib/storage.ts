import { ChatMessage, ChatSession } from '../types';

const SESSIONS_KEY = 'dd_sessions';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeMessage(value: unknown): ChatMessage | null {
  if (
    !isRecord(value) ||
    (value.role !== 'user' && value.role !== 'ai')
  ) {
    return null;
  }

  return {
    id:
      typeof value.id === 'string'
        ? value.id
        : crypto.randomUUID(),

    role: value.role,

    text:
      typeof value.text === 'string'
        ? value.text
        : '',

    timestamp:
      typeof value.timestamp === 'number'
        ? value.timestamp
        : Date.now(),

    diagnosis: isRecord(value.diagnosis)
      ? (value.diagnosis as unknown as ChatMessage['diagnosis'])
      : undefined,

    isError: value.isError === true,
  };
}

function normalizeSession(value: unknown): ChatSession | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,

    title:
      typeof value.title === 'string'
        ? value.title
        : '',

    createdAt:
      typeof value.createdAt === 'number'
        ? value.createdAt
        : Date.now(),

    messages:
      Array.isArray(value.messages)
        ? value.messages
            .map(normalizeMessage)
            .filter(
              (m): m is ChatMessage =>
                m !== null
            )
        : [],
  };
}

/**
 * Returns locally cached case/session data.
 *
 * IMPORTANT:
 * localStorage is only a UI cache.
 * The backend/Neon database is authoritative for authenticated
 * conversation history.
 */
export function getSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
          .map(normalizeSession)
          .filter(
            (s): s is ChatSession =>
              s !== null
          )
      : [];
  } catch (error) {
    console.error(
      'Failed to read sessions from storage:',
      error
    );

    return [];
  }
}

/**
 * Saves only the local UI cache.
 *
 * Do not treat this as the source of truth for patient conversations.
 */
export function saveSessions(
  sessions: ChatSession[]
): void {
  try {
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify(sessions)
    );
  } catch (error) {
    console.error(
      'Failed to save sessions to storage:',
      error
    );
  }
}

export function clearSessions(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error(
      'Failed to clear sessions from storage:',
      error
    );
  }
}