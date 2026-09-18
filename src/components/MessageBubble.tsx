import { AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';
import DiagnosisCard from './DiagnosisCard';

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-paper text-[#1B2620] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-2xl text-sm whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.isError) {
    return (
      <div className="flex justify-start">
        <div className="bg-riskhigh/10 border border-riskhigh/40 rounded-2xl px-4 py-3 max-w-2xl flex gap-2.5">
          <AlertTriangle size={16} className="text-riskhigh flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-riskhigh text-sm font-medium mb-0.5">Request failed</div>
            <div className="text-[#8FA1A7] text-xs whitespace-pre-wrap">{message.text}</div>
          </div>
        </div>
      </div>
    );
  }

  if (message.diagnosis) {
    return (
      <div className="flex justify-start">
        <DiagnosisCard result={message.diagnosis} />
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-panel border border-panelBorder rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl text-sm text-white whitespace-pre-wrap leading-6">
        {message.text}
      </div>
    </div>
  );
}
