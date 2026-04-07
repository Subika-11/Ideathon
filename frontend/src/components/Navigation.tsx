import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LegalChatbot from './LegalChatbot';

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
  const panelWidthPx = 360;

  /* 🔹 Prevent layout shift when chat opens */
  useEffect(() => {
    const pad = showChat ? `${panelWidthPx}px` : '';
    const prev = document.body.style.paddingRight;
    document.body.style.paddingRight = pad;
    return () => {
      document.body.style.paddingRight = prev;
    };
  }, [showChat]);

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
                  Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showChat && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
            onClick={() => setShowChat(false)}
          />
          <div className="absolute top-0 right-0 h-screen w-[360px] pointer-events-auto bg-[#050a18] shadow-2xl">
            <div className="h-full flex flex-col">
              <div className="flex justify-end p-3">
                <button
                  onClick={() => setShowChat(false)}
                  className="bg-slate-800 text-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-slate-700"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <LegalChatbot panel />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
