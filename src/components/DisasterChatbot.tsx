"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  ExternalLink, 
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Home,
  CloudRain,
  Radio,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';

interface ChatSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

interface DisasterChatbotProps {
  currentLocation?: string;
  embedded?: boolean;
}

const PROMPT_SUGGESTIONS = [
  {
    icon: AlertTriangle,
    title: "Active Threats & Alerts",
    desc: "Active weather warnings and emergency advisories.",
    query: "What are the active weather warnings and natural disaster alerts in this sector right now?"
  },
  {
    icon: Home,
    title: "Nearby Relief Shelters",
    desc: "Designated relief camps, occupancy rates, and supplies.",
    query: "Find the nearest verified relief shelters, their capacity, and safe routes."
  },
  {
    icon: CloudRain,
    title: "Flood & Cyclone Threat",
    desc: "Waterlogging vulnerability and localized wind gusts.",
    query: "Assess the current flood, cyclone trajectory, and wind gust threats for this area."
  },
  {
    icon: Radio,
    title: "Evacuation & Helplines",
    desc: "Civil defense evacuation steps and hotline numbers.",
    query: "Provide immediate civil defense evacuation steps, supply checklist, and emergency hotline numbers."
  }
];

export const DisasterChatbot: React.FC<DisasterChatbotProps> = ({
  currentLocation = "Active Sector",
  embedded = false,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const result = await api.chatWithAssistant(history, currentLocation);

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        sources: result.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: "Operational directive: Network communication intermittent. Move away from unreinforced masonry, avoid low-lying flood channels, and monitor district emergency radio frequencies.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-white dark:bg-black text-neutral-900 dark:text-white select-text">
      {/* 1. SCROLLABLE CONVERSATION AREA (Scrolls strictly internally, never pushes prompt bar) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 text-xs sm:text-sm">
        {/* EMPTY STATE (Brand Logo & Emergency Field Intelligence) */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-md bg-white dark:bg-black p-1.5 flex items-center justify-center">
              <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
              <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                Emergency Field Intelligence
              </h2>
              <p className="text-[11px] text-neutral-500">
                Direct tactical directives, verified relief camps, and atmospheric sensor updates for {currentLocation}.
              </p>
            </div>

            {/* Prompt Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg text-left pt-1">
              {PROMPT_SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.query)}
                    className="group p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-left space-y-1 cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-1.5 text-neutral-900 dark:text-white font-semibold text-xs">
                      <Icon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CHAT MESSAGES */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 flex-shrink-0 mt-1 bg-white dark:bg-black">
                <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
                <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
              </div>
            )}
            <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[85%]`}>
              <div
                className={`w-full rounded-2xl p-3 leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-br-xs font-medium'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-bl-xs border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {/* Message Content Rendered as Markdown */}
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1.5 [&_strong]:font-bold [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_table]:text-[11px] [&_table]:border [&_th]:p-1.5 [&_td]:p-1.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{m.content}</p>
                )}

                {/* Verified Sources with Favicons */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Verified Intelligence Sources ({m.sources.length}):
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {m.sources.map((src, sIdx) => {
                        const domain = src.domain || 'news';
                        const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                        return (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-1.5 rounded-md bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition text-xs group"
                          >
                            <img
                              src={src.favicon || fallbackFavicon}
                              alt=""
                              className="w-3.5 h-3.5 rounded-xs flex-shrink-0 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== fallbackFavicon) {
                                  target.src = fallbackFavicon;
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-neutral-900 dark:text-white truncate text-[11px]">
                                  {src.title}
                                </span>
                                <span className="text-[9px] text-neutral-400 font-mono">
                                  ({domain})
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-black dark:group-hover:text-white flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[9px] text-neutral-400 mt-1 px-1 font-mono">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 py-1.5">
            <div className="w-6 h-6 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 flex-shrink-0 bg-white dark:bg-black">
              <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
              <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
            </div>
            <div className="flex items-center space-x-2 text-neutral-500 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900 dark:text-white" />
              <span>Retrieving real-time field telemetry and emergency updates...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. BIG PROMPT BAR PERMANENTLY PINNED AT THE BOTTOM */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/80 p-2 focus-within:border-black dark:focus-within:border-white transition-all shadow-xs"
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask field intelligence assistant (e.g. evacuation corridors, shelter availability, live weather)..."
            className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none resize-none px-1.5 py-1 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60 mt-1">
            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Clear Chat</span>
                </button>
              )}
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                Enter ↵ to send • Shift+Enter for newline
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold text-xs hover:opacity-90 disabled:opacity-30 transition cursor-pointer flex-shrink-0 shadow-xs"
            >
              <span>Dispatch</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
