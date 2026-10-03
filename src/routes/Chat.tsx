
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { v4 as uuidv4 } from 'uuid';

import {
  Info,
  Loader2,
  Menu,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';

import { ChatMessage, ChatSession } from '../types';

import {
  getSessions,
  saveSessions,
} from '../lib/storage';

import {
  ApiError,
  getChatHistory,
  sendChatMessage,
} from '../lib/api';


function makeTitle(text: string): string {
  const trimmed = text.trim();

  return trimmed.length > 42
    ? `${trimmed.slice(0, 42)}...`
    : trimmed;
}


function historyToMessages(
  messages: { role: string; content: string }[]
): ChatMessage[] {
  return messages
    .filter(
      (message) =>
        message.role === 'user' ||
        message.role === 'ai'
    )
    .map((message, index) => ({
      id: `${message.role}-${index}-${message.content.slice(0, 12)}`,
      role: message.role as 'user' | 'ai',
      text: message.content,
      timestamp: Date.now() + index,
    }));
}


function createLocalSession(): ChatSession {
  return {
    id: uuidv4(),
    title: '',
    createdAt: Date.now(),
    messages: [],
  };
}


export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>(
    () => getSessions()
  );

  const [activeId, setActiveId] = useState<string | null>(
    () => getSessions()[0]?.id ?? null
  );

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * localStorage is only a UI cache.
   * The backend/Neon database is the authoritative
   * conversation store.
   */
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);


  /*
   * Mirrors `sessions` for the hydrate-on-switch effect.
   */
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);


  const updateSession = useCallback(
    (
      id: string,
      updater: (session: ChatSession) => ChatSession
    ) => {
      setSessions((previous) =>
        previous.map((session) =>
          session.id === id
            ? updater(session)
            : session
        )
      );
    },
    []
  );


  const hydrateSession = useCallback(
    async (sessionId: string) => {
      setHistoryLoading(true);

      try {
        const history = await getChatHistory(sessionId);

        const backendMessages =
          historyToMessages(history.messages);

        updateSession(sessionId, (session) => ({
          ...session,
          messages: backendMessages,
        }));
      } catch (error) {
        /*
         * A 404 means the local cache contains a session
         * that the backend does not know about.
         */
        if (
          error instanceof ApiError &&
          error.status === 404
        ) {
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : 'Unable to load this conversation from the server.';

        updateSession(sessionId, (session) => ({
          ...session,
          messages: [
            ...session.messages,
            {
              id: uuidv4(),
              role: 'ai',
              text: message,
              isError: true,
              timestamp: Date.now(),
            },
          ],
        }));
      } finally {
        setHistoryLoading(false);
      }
    },
    [updateSession]
  );


  /*
   * Hydrate conversation when changing cases.
   */
  useEffect(() => {
    if (!activeId) {
      return;
    }

    const session =
      sessionsRef.current.find(
        (s) => s.id === activeId
      );

    if (session && session.messages.length === 0) {
      return;
    }

    void hydrateSession(activeId);
  }, [activeId, hydrateSession]);


  /*
   * Keep conversation scrolled to latest message.
   */
  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth',
    });
  }, [activeId, sessions, loading]);


  const activeSession =
    sessions.find(
      (session) => session.id === activeId
    ) ?? null;


  const isEmpty =
    !activeSession ||
    activeSession.messages.length === 0;


  function handleNewCase() {
    const newSession = createLocalSession();

    setSessions((previous) => [
      newSession,
      ...previous,
    ]);

    setActiveId(newSession.id);

    // Close drawer on mobile
    setMobileSidebarOpen(false);
  }


  function handleSelectSession(id: string) {
    setActiveId(id);

    // Close drawer on mobile
    setMobileSidebarOpen(false);
  }


  async function handleSend(text: string) {
    const trimmed = text.trim();

    if (!trimmed || loading) {
      return;
    }

    let sessionId = activeId;

    /*
     * Create local UUID immediately so the new case
     * appears in the sidebar before the API request completes.
     */
    if (!sessionId) {
      const newSession = createLocalSession();

      setSessions((previous) => [
        newSession,
        ...previous,
      ]);

      sessionId = newSession.id;
      setActiveId(sessionId);
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    updateSession(sessionId, (session) => ({
      ...session,
      title:
        session.title ||
        makeTitle(trimmed),
      messages: [
        ...session.messages,
        userMessage,
      ],
    }));

    setLoading(true);

    try {
      const result = await sendChatMessage(
        trimmed,
        sessionId
      );

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'ai',
        text: result.reply,
        timestamp: Date.now(),
      };

      if (result.session_id !== sessionId) {
        setSessions((previous) =>
          previous.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  id: result.session_id,
                  messages: [
                    ...session.messages,
                    assistantMessage,
                  ],
                }
              : session
          )
        );

        setActiveId(result.session_id);
      } else {
        updateSession(
          sessionId,
          (session) => ({
            ...session,
            messages: [
              ...session.messages,
              assistantMessage,
            ],
          })
        );
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Something went wrong reaching the conversational API.';

      updateSession(sessionId, (session) => ({
        ...session,
        messages: [
          ...session.messages,
          {
            id: uuidv4(),
            role: 'ai',
            text: message,
            isError: true,
            timestamp: Date.now(),
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="h-[100dvh] flex bg-ink overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={handleSelectSession}
        onNewCase={handleNewCase}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />


      {/* Main application */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">

        {/* ------------------------------------------------------------ */}
        {/* Header */}
        {/* ------------------------------------------------------------ */}

        <header className="h-14 flex-shrink-0 border-b border-panelBorder flex items-center px-3 sm:px-5">

          <div className="w-full max-w-[900px] mx-auto flex items-center gap-3">

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open sidebar"
              className="
                md:hidden
                w-9 h-9
                flex-shrink-0
                rounded-lg
                flex items-center justify-center
                text-[#8FA1A7]
                hover:text-white
                hover:bg-panel
                transition-colors
              "
            >
              <Menu size={20} />
            </button>


            {/* Conversation title */}
            <div className="min-w-0 flex-1">
              <h1 className="text-white text-sm font-medium truncate">
                {activeSession?.title ||
                  'Differential Dx'}
              </h1>
            </div>


            {/* Header status */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

              {historyLoading && (
                <span className="hidden sm:flex text-[#8FA1A7] text-xs items-center gap-1.5">
                  <Loader2
                    size={12}
                    className="animate-spin"
                  />
                  Syncing
                </span>
              )}


              <div className="
                text-riskmoderate
                text-[10px] sm:text-xs
                px-2 sm:px-3
                py-1.5
                rounded-full
                bg-riskmoderate/10
                border border-riskmoderate/40
                flex items-center gap-1.5
              ">
                <Info size={12} />

                <span className="hidden xs:inline sm:inline">
                  Decision support
                </span>

                {/* Shorter mobile label */}
                <span className="sm:hidden">
                  Support
                </span>
              </div>

            </div>

          </div>
        </header>


        {/* ------------------------------------------------------------ */}
        {/* Messages */}
        {/* ------------------------------------------------------------ */}

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto"
        >

          <div className="
            w-full
            max-w-[900px]
            mx-auto
            px-3 sm:px-5
            py-5 sm:py-8
          ">

            {isEmpty ? (

              /*
               * Empty state
               */
              <div className="
                min-h-[calc(100dvh-14rem)]
                flex
                flex-col
                justify-center
              ">

                <div className="max-w-[720px]">

                  <p className="
                    text-riskmoderate
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    mb-3
                  ">
                    Differential Dx
                  </p>


                  <h2 className="
                    text-white
                    text-2xl
                    sm:text-3xl
                    md:text-4xl
                    font-semibold
                    leading-tight
                    mb-4
                  ">
                    Hello. Let's work through
                    the case together.
                  </h2>


                  <p className="
                    text-[#8FA1A7]
                    text-sm
                    sm:text-base
                    leading-relaxed
                    max-w-[680px]
                  ">
                    Describe the patient and what
                    you know so far. The conversational
                    assistant can ask for relevant
                    information, organize the clinical
                    picture, and use the available
                    differential-diagnosis models
                    when appropriate.
                  </p>


                  <p className="
                    text-[#687A81]
                    text-sm
                    leading-relaxed
                    max-w-[680px]
                    mt-4
                  ">
                    Use the results as decision support
                    alongside clinical judgement,
                    examination, investigations, and
                    other appropriate sources of evidence.
                  </p>

                </div>

              </div>

            ) : (

              /*
               * Conversation
               */
              <div className="flex flex-col gap-5 sm:gap-6">

                {activeSession?.messages.map(
                  (message) => {

                    const isUser =
                      message.role === 'user';

                    return (
                      <article
                        key={message.id}
                        className={`
                          flex flex-col
                          ${
                            isUser
                              ? 'items-end'
                              : 'items-start'
                          }
                        `}
                      >

                        {isUser && (
                          <div className="
                            text-[10px]
                            sm:text-[11px]
                            uppercase
                            tracking-wider
                            text-[#6F8188]
                            mb-1.5
                            sm:mb-2
                          ">
                            You
                          </div>
                        )}


                        {!isUser &&
                          !message.isError && (
                            <div className="
                              text-[10px]
                              sm:text-[11px]
                              uppercase
                              tracking-wider
                              text-[#6F8188]
                              mb-1.5
                              sm:mb-2
                            ">
                              Differential Dx
                            </div>
                          )}


                        <div
                          className={
                            isUser
                              ? `
                                max-w-[92%]
                                sm:max-w-[75%]
                                text-sm
                                sm:text-[15px]
                                leading-6
                                sm:leading-7
                                whitespace-pre-wrap
                                break-words
                                bg-blue-400
                                text-white
                                px-3
                                sm:px-3.5
                                py-2
                                rounded-2xl
                                rounded-tr-sm
                              `
                              : `
                                max-w-[92%]
                                sm:max-w-[75%]
                                text-sm
                                sm:text-[15px]
                                leading-6
                                sm:leading-7
                                whitespace-pre-wrap
                                break-words
                                ${
                                  message.isError
                                    ? 'text-riskhigh'
                                    : 'text-[#D6DEDA]'
                                }
                              `
                          }
                        >
                          {message.text}
                        </div>

                      </article>
                    );
                  }
                )}


                {loading && (
                  <div className="
                    flex
                    flex-col
                    items-start
                    text-[#8FA1A7]
                  ">

                    <div className="
                      text-[10px]
                      sm:text-[11px]
                      uppercase
                      tracking-wider
                      text-[#6F8188]
                      mb-2
                    ">
                      Differential Dx
                    </div>


                    <div className="
                      flex
                      items-center
                      gap-2
                      text-sm
                    ">
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />

                      <span>
                        Reviewing the information provided...
                      </span>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        </div>


        {/* ------------------------------------------------------------ */}
        {/* Input */}
        {/* ------------------------------------------------------------ */}

        <div className="
          flex-shrink-0
          border-t
          border-panelBorder
          bg-ink
        ">

          <div className="
            w-full
            max-w-[900px]
            mx-auto
            px-3
            sm:px-5
            py-3
            sm:py-4
          ">

            <ChatInput
              onSubmit={handleSend}
              loading={loading}
            />


            <div className="flex justify-center mt-2">

              <p className="
                text-[9px]
                sm:text-[10px]
                text-[#687A81]
                text-center
                px-2
              ">
                Decision-support tool. Not a substitute
                for professional clinical judgement.
              </p>

            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
