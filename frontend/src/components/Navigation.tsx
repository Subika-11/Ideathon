import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LegalChatbot from './LegalChatbot';
import { X } from 'lucide-react';

type Page = 'home' | 'kiosk' | 'features' | 'tracking' | 'impact' | 'chatbot';

export default function Navigation({
  currentPage,
  onNavigate,
  compact = false,
}: {
  currentPage: string;
  onNavigate: (p: Page) => void;
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [showChat, setShowChat] = useState(false);

  /* 🔹 LISTEN for global "open-chat" event */
  useEffect(() => {
    const openChat = () => setShowChat(true);
    window.addEventListener('open-chat', openChat);
    return () => window.removeEventListener('open-chat', openChat);
  }, []);

  const items = [
    { id: 'home', label: t('nav.home') },
    { id: 'kiosk', label: t('nav.kiosk') },
    { id: 'features', label: t('nav.features') },
    { id: 'tracking', label: t('nav.tracking') },
    { id: 'impact', label: t('nav.impact') },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050a18]/80 backdrop-blur-xl border-b border-white/5">
        {compact && (
          <div className="absolute right-4 top-4 z-50">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-400 outline-none cursor-pointer"
            >
              <option value="en" className="bg-[#050a18]">English</option>
              <option value="hi" className="bg-[#050a18]">Hindi(हिन्दी)</option>
              <option value="ta" className="bg-[#050a18]">Tamil(தமிழ்)</option>
              <option value="bn" className="bg-[#050a18]">Bengali(বাংলা)</option>
            </select>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 relative">
            {compact ? (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                onClick={() => onNavigate('home')}
              >
                <span className="text-2xl italic text-white group-hover:text-emerald-400 transition">
                  Legal
                </span>
                <span className="text-2xl font-black text-emerald-500 uppercase tracking-tight group-hover:text-white transition">
                  Edge
                </span>
              </div>
            ) : (
              <div
                className="flex-none flex gap-1 cursor-pointer group"
                onClick={() => onNavigate('home')}
              >
                <span className="text-2xl italic text-white group-hover:text-emerald-400 transition">
                  Legal
                </span>
                <span className="text-2xl font-black text-emerald-500 uppercase tracking-tight group-hover:text-white transition">
                  Edge
                </span>
              </div>
            )}

            {!compact && (
              <div className="hidden md:flex flex-1 justify-center gap-6">
                {items.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id as Page)}
                      className={`text-xs font-black uppercase tracking-[0.22em] transition ${
                        active
                          ? 'text-emerald-500 border-b border-emerald-500 pb-1'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-none flex items-center gap-4">
              {!compact && (
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="hidden sm:block bg-transparent text-xs font-bold text-emerald-400 outline-none cursor-pointer"
                >
                  <option value="en" className="bg-[#050a18]">English</option>
                  <option value="hi" className="bg-[#050a18]">Hindi(हिन्दी)</option>
                  <option value="ta" className="bg-[#050a18]">Tamil(தமிழ்)</option>
                  <option value="bn" className="bg-[#050a18]">Bengali(বাংলা)</option>
                </select>
              )}

              {!compact && (
                <button
                  onClick={() => setShowChat(true)}
                  className="px-3 py-2 bg-emerald-600 text-white text-sm font-bold rounded-md hover:bg-emerald-500 transition"
                >
                  {t('nav.assistant')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showChat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-16">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            onClick={() => { window.speechSynthesis.cancel(); setShowChat(false); }}
          />
          <div className="relative w-full max-w-xl z-10 h-full flex flex-col">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => { window.speechSynthesis.cancel(); setShowChat(false); }}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 min-h-0 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <LegalChatbot panel={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
