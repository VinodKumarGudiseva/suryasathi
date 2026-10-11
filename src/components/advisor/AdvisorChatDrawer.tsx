import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  ExternalLink,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { AdvisorMessage, SolarPlan } from '../../types/solar';
import { solarAdvisorService } from '../../services/solarAdvisorService';

interface AdvisorChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: SolarPlan;
}

export const AdvisorChatDrawer: React.FC<AdvisorChatDrawerProps> = ({
  isOpen,
  onClose,
  currentPlan,
}) => {
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Namaste! I am your SuryaSathi Advisor. I can help answer questions about the PM Surya Ghar: Muft Bijli Yojana, net-metering approvals with ${
        currentPlan?.location.discomName || 'your local DISCOM'
      }, subsidy calculations, and system sizing. How can I assist your rooftop solar journey today?`,
      timestamp: 'Just now',
      suggestedActions: [
        'Am I eligible for PM Surya Ghar?',
        'How much subsidy can I get?',
        'What documents do I need?',
        'How does net metering work?',
        'What should I do next?',
        'Is my recommended system size suitable?',
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    const userMsg: AdvisorMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await solarAdvisorService.askSolarAdvisor(
        trimmed,
        currentPlan,
        messages
      );
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      const errorMsg: AdvisorMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I apologize, but I encountered a temporary connection issue. Please try again or visit pmsuryaghar.gov.in for official updates.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">SuryaSathi Advisor</h3>
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30">
                  PM Surya Ghar
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {currentPlan
                  ? `Plan Context: ${currentPlan.recommendedSystemKw} kW in ${currentPlan.location.city}`
                  : 'AI-assisted rooftop solar guidance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Sources / Knowledge Grounding */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Grounding Sources (PM Surya Ghar / MNRE)
                        </span>
                        {msg.confidence !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            {msg.confidence >= 0.8 ? 'Grounded in scheme data' : 'Please verify this answer'}
                          </span>
                        )}
                      </div>
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="text-[11px] bg-slate-50 p-2 rounded border border-slate-150 text-slate-600">
                          <a
                            href={src.url || 'https://pmsuryaghar.gov.in'}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-amber-700 hover:underline flex items-center gap-1"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {src.snippet && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{src.snippet}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* References Fallback if no structured sources */}
                  {(!msg.sources || msg.sources.length === 0) && msg.references && msg.references.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Official Scheme Reference
                      </span>
                      {msg.references.map((ref, idx) => (
                        <a
                          key={idx}
                          href={ref.url || 'https://pmsuryaghar.gov.in'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>{ref.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleSend(action)}
                          className="text-[11px] font-medium bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 text-right ${
                      isUser ? 'text-amber-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 max-w-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>SuryaSathi Advisor is reasoning with scheme data...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="p-4 border-t border-slate-200 bg-white"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about subsidies, DISCOM net metering, or sizing..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Information based on PM Surya Ghar guidelines • Always confirm with your local DISCOM
          </p>
        </form>
      </div>
    </div>
  );
};
