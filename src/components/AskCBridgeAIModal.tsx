import React, { useState } from 'react';
import { UserRole, SourceTrace } from '../types';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  ShieldCheck, 
  Layers, 
  BookOpen 
} from 'lucide-react';
import { SourceTraceViewer } from './SourceTraceViewer';

interface AskCBridgeAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserRole;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  moduleCode?: string;
  sourceTrace?: SourceTrace;
}

export const AskCBridgeAIModal: React.FC<AskCBridgeAIModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Welcome to C-Bridge AI Assistant. I am configured with context for Phase 1 (U.S. Food Import Readiness & FSVP Documentation Support).\n\nHow can I assist your regulatory consulting workflow today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleCode: 'CB-9110 / SB-9100',
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'What needs to be done?',
    'What is Samar\'s current FSVP status?',
    'Explain FSVP supplier verification rules (21 CFR 1.506)',
    'Show Husni approval workflow rules',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ask-cbridge-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, userRole: currentUser }),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            moduleCode: data.moduleCode || 'CB-9119',
            sourceTrace: data.sourceTrace,
          },
        ]);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.error('Ask AI error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `C-Bridge Operating Response:\n\nRegarding Phase 1 (U.S. Food Import Readiness): Current priorities include completing the FSVP Foreign Supplier Review Checklist (SB-9113) and reviewing Prof. Haskell follow-up (SB-9111). Final approvals are handled by Husni Hasan in CB-9110.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'CB-9119',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-end z-50 p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl h-[90vh] flex flex-col justify-between shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white">ASK C-BRIDGE AI</span>
                <span className="bg-teal-950 text-teal-300 text-[10px] px-2 py-0.2 rounded border border-teal-800 font-mono">
                  Regulatory Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Context Active: Phase 1 U.S. Food Import Readiness & FSVP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="h-7 w-7 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1.5 ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 font-mono">
                  <span>{msg.sender === 'user' ? 'You' : 'C-Bridge AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                {msg.moduleCode && (
                  <div className="pt-1 border-t border-slate-800/80 text-[10px] text-teal-400 font-mono flex items-center space-x-1">
                    <Layers className="h-3 w-3" />
                    <span>Module Context: {msg.moduleCode}</span>
                  </div>
                )}

                {msg.sourceTrace && (
                  <SourceTraceViewer sourceTrace={msg.sourceTrace} />
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-teal-400 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800 w-fit">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>C-Bridge AI is analyzing regulatory context...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts & Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask C-Bridge AI about FSVP, QA, or governance..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-teal-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputQuery.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white p-3 rounded-xl transition cursor-pointer shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
