
import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ChatInput({
  onSubmit,
  loading,
}: {
  onSubmit: (text: string) => void;
  loading: boolean;
}) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();

    if (!trimmed || loading) return;

    onSubmit(trimmed);
    setText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-panelBorder p-4">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-end gap-2 bg-paper border border-paperBorder rounded-2xl p-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Describe the patient — symptoms, age, sex, relevant history..."
            className="flex-1 bg-transparent resize-none text-sm text-[#1B2620] px-2 py-1.5 focus:outline-none"
            disabled={loading}
          />

          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            aria-label="Send message"
            className="rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0 bg-ink text-paper disabled:opacity-40 transition-opacity"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>

        <p className="text-[10px] text-[#5B6B70] mt-2 px-1">
          Press Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}

