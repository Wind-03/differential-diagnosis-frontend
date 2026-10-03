import { Plus, Activity, LogOut, X } from 'lucide-react';
import { ChatSession } from '../types';
import { logout } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNewCase,
  mobileOpen = false,
  onClose,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewCase: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleSelect(id: string) {
    onSelect(id);
    onClose?.();
  }

  function handleNewCase() {
    onNewCase();
    onClose?.();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 max-w-[85vw]
          flex-shrink-0
          bg-panel border-r border-panelBorder
          flex flex-col
          h-full

          transform transition-transform duration-200 ease-out

          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:z-auto md:w-64
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-2 border-b border-panelBorder">
          <div className="w-8 h-8 rounded-lg bg-ink border border-panelBorder flex items-center justify-center">
            <Activity size={16} className="text-risklow" />
          </div>

          <span className="font-display text-white text-sm font-semibold tracking-wide flex-1">
            DIFFERENTIAL DX
          </span>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#8FA1A7] hover:text-white hover:bg-ink/70"
          >
            <X size={18} />
          </button>
        </div>

        {/* New case */}
        <div className="p-3">
          <button
            type="button"
            onClick={handleNewCase}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium bg-ink text-paper border border-panelBorder hover:opacity-90 active:scale-[0.99] transition"
          >
            <Plus size={15} />
            New case
          </button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-2">
          {sessions.length === 0 && (
            <div className="text-[#8FA1A7] text-xs px-3 py-4 text-center">
              No cases yet — start a new one above.
            </div>
          )}

          {sessions
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((session) => (
              <button
                type="button"
                key={session.id}
                onClick={() => handleSelect(session.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl mb-1
                  text-xs transition-colors
                  ${
                    session.id === activeId
                      ? 'bg-ink text-white border border-panelBorder'
                      : 'text-[#8FA1A7] hover:bg-ink/50'
                  }
                `}
              >
                <div className="truncate">
                  {session.title || 'Untitled case'}
                </div>

                <div className="text-[9.5px] text-[#5B6B70] mt-0.5">
                  {new Date(session.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-panelBorder">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-[#8FA1A7] text-xs px-1 py-2 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}