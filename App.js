import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MoreVertical, Phone, Paperclip, Smile, Mic, CheckCheck } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Olá! Bem-vindo ao ChatBot Pro.', sender: 'bot', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, text: 'Como posso ajudar você hoje?', sender: 'bot', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Simulação de resposta do Bot
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: 'Recebi sua mensagem! Esta é uma demonstração em JavaScript Puro sem build step.',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      {/* Container Principal Mobile/Desktop */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-gray-200">
        
        {/* Header do Chat */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot size={24} className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-emerald-600 rounded-full"></span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Assistente Virtual</h1>
              <p className="text-xs text-emerald-100 opacity-90">Online agora</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="hover:bg-white/10 p-2 rounded-full transition"><Phone size={20} /></button>
            <button className="hover:bg-white/10 p-2 rounded-full transition"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Área de Mensagens (Background Pattern) */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>
          
          <div className="space-y-4 relative z-10">
            {/* Aviso de Criptografia */}
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-100 text-yellow-800 text-[10px] px-3 py-1 rounded-lg shadow-sm flex items-center gap-1">
                <span className="font-bold">🔒</span> As mensagens são protegidas.
              </div>
            </div>

            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[80%] rounded-lg px-3 py-2 shadow-sm relative text-sm
                    ${isUser ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}
                  `}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                      <span className="text-[10px]">{msg.time}</span>
                      {isUser && <CheckCheck size={12} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white rounded-lg px-4 py-3 shadow-sm rounded-tl-none flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="bg-[#f0f2f5] p-3 flex items-center gap-2">
          <button type="button" className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition">
            <Smile size={24} />
          </button>
          <button type="button" className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition">
            <Paperclip size={24} />
          </button>
          
          <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-transparent focus-within:border-emerald-500 transition-all">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite uma mensagem" 
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            />
          </div>

          {input.trim() ? (
            <button type="submit" className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition transform active:scale-95">
              <Send size={20} className="ml-0.5" />
            </button>
          ) : (
            <button type="button" className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition">
              <Mic size={20} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}