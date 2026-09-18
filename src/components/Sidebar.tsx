import { Plus, Activity, LogOut } from 'lucide-react';
import { ChatSession } from '../types';
import { logout } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNewCase,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewCase: () => void;
}) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="w-64 flex-shrink-0 bg-panel border-r border-panelBorder flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 border-b border-panelBorder">
        <div className="w-8 h-8 rounded-lg bg-ink border border-panelBorder flex items-center justify-center">
          <Activity size={16} className="text-risklow" />
        </div>

        <span className="font-display text-white text-sm font-semibold tracking-wide">
          DIFFERENTIAL DX
        </span>
      </div>

      <div className="p-3">
        <button
          onClick={onNewCase}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium bg-ink text-paper border border-panelBorder hover:opacity-90"
        >
          <Plus size={15} />
          New case
        </button>
      </div>

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
              key={session.id}
              onClick={() => onSelect(session.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 text-xs transition-colors ${
                session.id === activeId
                  ? 'bg-ink text-white border border-panelBorder'
                  : 'text-[#8FA1A7] hover:bg-ink/50'
              }`}
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

      <div className="p-3 border-t border-panelBorder">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-[#8FA1A7] text-xs px-1 py-1.5 hover:text-white"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  );
}