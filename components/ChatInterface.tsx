import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Send, User, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, MessageRole } from '../types';
import { chatWithLumenStream } from '../services/geminiService';
import { Button } from './Button';

// ... (renderWithSubscripts helper remains same)

interface ChatInterfaceProps {
  onClose?: () => void;
  boilerContext?: any;
  initialQuestion?: string;
}

const renderWithSubscripts = (text: string): ReactNode => {
  // Remove dollar signs
  let cleanText = text.replace(/\$([^$]+)\$/g, '$1');
  
  // Pattern to match chemical formulas like O2, CO2, H2O, etc.
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const regex = /([A-Z][a-z]?)(\d+)/g;
  
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(cleanText.substring(lastIndex, match.index));
    }
    
    // Add the element with subscript
    parts.push(
      <span key={match.index}>
        {match[1]}
        <sub>{match[2]}</sub>
      </span>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < cleanText.length) {
    parts.push(cleanText.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : cleanText;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, boilerContext, initialQuestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: MessageRole.Model,
      content: "Hello! I'm Clusterics, your AI Engineering Assistant. I have real-time access to the boiler's combustion telemetry. How can I assist with optimization or diagnostics today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Initial Question Auto-Send
  useEffect(() => {
    if (initialQuestion && !hasInitializedRef.current) {
        hasInitializedRef.current = true;
        
        const runInitialQuery = async () => {
            // Add User Message
            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: MessageRole.User,
                content: initialQuestion,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, userMsg]);
            setIsTyping(true);

            try {
                // Initial history is just the greeting
                const history = [{
                    role: 'model',
                    parts: [{ text: "Hello! I'm Clusterics, your AI Engineering Assistant. I have real-time access to the boiler's combustion telemetry. How can I assist with optimization or diagnostics today?" }]
                }];
                
                let prompt = initialQuestion;
                if (boilerContext) {
                    prompt = `[CURRENT BOILER TELEMETRY: ${JSON.stringify(boilerContext)}] User Question: ${initialQuestion}`;
                }

                const botMsgId = (Date.now() + 1).toString();
                let messageAdded = false;

                await chatWithLumenStream(history, prompt, (streamedText) => {
                    if (!messageAdded) {
                        setMessages(prev => [...prev, {
                            id: botMsgId,
                            role: MessageRole.Model,
                            content: streamedText,
                            timestamp: Date.now()
                        }]);
                        messageAdded = true;
                    } else {
                        setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, content: streamedText } : msg));
                    }
                });
            } catch (error) {
                console.error("Initial Query Error", error);
            } finally {
                setIsTyping(false);
            }
        };
        
        runInitialQuery();
    }
  }, [initialQuestion, boilerContext]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.User,
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Format history for API
      const history = messages.map(m => ({
        role: m.role === MessageRole.User ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      // Inject context if available
      let prompt = input;
      if (boilerContext) {
        prompt = `[CURRENT BOILER TELEMETRY: ${JSON.stringify(boilerContext)}] User Question: ${input}`;
      }

      const botMsgId = (Date.now() + 1).toString();
      let messageAdded = false;

      // Stream the response
      await chatWithLumenStream(history, prompt, (streamedText) => {
        // Add message on first chunk only
        if (!messageAdded) {
          const botMsg: ChatMessage = {
            id: botMsgId,
            role: MessageRole.Model,
            content: streamedText,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, botMsg]);
          messageAdded = true;
        } else {
          // Update existing message with streamed content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === botMsgId 
                ? { ...msg, content: streamedText }
                : msg
            )
          );
        }
      });
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.Model,
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 shadow-2xl relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border border-white/20">
                <Sparkles size={16} className="text-white" />
            </div>
            <div>
                <h3 className="text-white font-bold text-sm">Clusterics AI</h3>
                <p className="text-xs text-slate-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Online
                </p>
            </div>
        </div>
        {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                <X size={20} />
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start ${msg.role === MessageRole.User ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === MessageRole.Model && (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2 mt-1 border border-emerald-200 shrink-0">
                <Sparkles size={14} className="text-emerald-600" />
              </div>
            )}
            
            <div className={`
              max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === MessageRole.User 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-500/20' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }
            `}>
              {msg.role === MessageRole.Model ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="mb-1">{children}</p>,
                      // ... (rest of markdown components)
                      strong: ({children}) => <strong className="font-bold text-slate-900">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      ul: ({children}) => <ul className="list-disc list-inside">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside">{children}</ol>,
                      li: ({children}) => <li>{children}</li>,
                      code: ({children}) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    }}
                  >
                    {msg.content.replace(/\$([^$]+)\$/g, '$1')}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>

            {msg.role === MessageRole.User && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-2 mt-1 shrink-0">
                <User size={14} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start justify-start animate-pulse">
             <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mr-2 mt-1 border border-emerald-200">
                <Sparkles size={14} className="text-emerald-600" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-emerald-500/50 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20">
          <input
            type="text"
            className="flex-1 bg-transparent text-slate-900 px-2 py-1 focus:outline-none placeholder-slate-400 text-sm"
            placeholder="Ask Clusterics..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping}
            className="!p-2 !rounded-lg !bg-emerald-600 hover:!bg-emerald-700"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};