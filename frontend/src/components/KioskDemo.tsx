import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  FileText,
  Bell,
  HelpCircle,
  Phone,
  Search,
  Gavel,
  List,
  Monitor,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import Navigation from './Navigation';

type Page = 'home' | 'chatbot' | 'features' | 'tracking' | 'impact' | 'kiosk' | 'reminders';

interface KioskDemoProps {
  onNavigate: (page: Page) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}



export default function KioskDemo({ onNavigate }: KioskDemoProps) {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<
    'home' | 'orders' | 'cause' | 'helpdesk'
  >('home');

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Keep a ref to the latest onNavigate so the onend closure never goes stale
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);

  // Direct ref to React's setActivePanel — stable across renders
  const setActivePanelRef = useRef(setActivePanel);

  // Direct ref to React's setVoiceFeedback — stable across renders  
  const setVoiceFeedbackRef = useRef(setVoiceFeedback);

  /* ── Route voice transcript → action ─────────────────────────────────────── */
  // This runs inside recognition.onend via resolveAndShowRef, so it must only
  // use refs — never close over state or props directly.
  const handleVoiceCommand = (said: string) => {
    const text = said.toLowerCase().replace(/[.,!?]/g, '').trim();
    let feedback = '';

    if (/\bcase\b|\b k status\b|\bcnr\b|\btracking\b|\btrack\b/.test(text)) {
      onNavigateRef.current('tracking');
      feedback = t('kiosk.feedback.opening_tracking');

    } else if (/legal|lawyer|chatbot|counsel|advocate|advic|guidanc|assist/.test(text)) {
      onNavigateRef.current('chatbot');
      feedback = t('kiosk.feedback.opening_chatbot');

    } else if (/remind|alert/.test(text)) {
      onNavigateRef.current('reminders');
      feedback = t('kiosk.feedback.opening_reminders');

    } else if (/contact|helpdesk|help.?desk|support|phone|call/.test(text)) {
      setActivePanelRef.current('helpdesk');
      feedback = t('kiosk.feedback.opening_helpdesk');

    } else if (/judicial|order/.test(text)) {
      setActivePanelRef.current('orders');
      feedback = t('kiosk.feedback.showing_orders');

    } else if (/hearing|cause.?list|schedul/.test(text)) {
      setActivePanelRef.current('cause');
      feedback = t('kiosk.feedback.showing_hearings');

    } else {
      feedback = t('kiosk.feedback.not_recognized');
    }

    setVoiceFeedbackRef.current(feedback);
    setTimeout(() => setVoiceFeedbackRef.current(null), feedback.startsWith('❓') ? 5000 : 3000);
  };

  // Stable ref so recognition.onend (created once) always calls the latest version
  const handleVoiceCommandRef = useRef(handleVoiceCommand);
  handleVoiceCommandRef.current = handleVoiceCommand;

  /* ── Init Speech Recognition (runs once) ────────────────────────────────── */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setVoiceFeedback(null);
      transcriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
      transcriptRef.current = text;
    };

    recognition.onend = () => {
      setIsListening(false);
      const said = transcriptRef.current.trim();
      if (said) handleVoiceCommandRef.current(said);
    };

    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const startListening = () => recognitionRef.current?.start();

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 overflow-hidden flex flex-col font-sans">
      <Navigation currentPage="kiosk" onNavigate={onNavigate} />

      <main className="flex-1 flex items-center justify-center p-4 mt-4">
        <div className="aspect-square w-[95vw] max-w-[820px] max-h-[82vh] bg-slate-950/40 backdrop-blur-md rounded-[2.5rem] p-4 shadow-2xl border-[3px] border-emerald-500/30 ring-4 ring-black/20 flex flex-col">
          <div className="bg-white rounded-[2rem] h-full w-full flex flex-col overflow-hidden shadow-inner">

            {/* HEADER */}
            <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-200" />
                <div>
                  <h1 className="text-2xl font-semibold uppercase">
                    {t('kiosk.title')}
                  </h1>
                  <p className="text-[10px] opacity-85 uppercase tracking-widest mt-1">
                    {t('kiosk.subtitle')}
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* SIDEBAR */}
              <aside className="w-60 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                  {t('kiosk.quick_services')}
                </p>

                {[
                  { icon: Search,   label: t('kiosk.cnr_search'),         id: 'tracking' },
                  { icon: FileText, label: t('kiosk.case_status'),         id: 'tracking' },
                  { icon: Gavel,    label: t('kiosk.judicial_orders'),     id: 'orders'   },
                  { icon: List,     label: t('kiosk.hearing_list'),        id: 'cause'    },
                  { icon: Monitor,  label: t('kiosk.virtual_proceedings'), id: 'virtual'  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.id === 'tracking') onNavigate('tracking');
                      if (item.id === 'orders')   setActivePanel('orders');
                      if (item.id === 'cause')    setActivePanel('cause');
                    }}
                    className="flex items-center justify-between px-3 py-3 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </aside>

              {/* MAIN */}
              <main className="flex-1 px-8 py-8 flex flex-col overflow-y-auto">

                {/* PANEL OVERLAY — floats above content, always visible */}
                {activePanel !== 'home' && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setActivePanel('home')}
                  >
                    <div
                      className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 border border-emerald-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {activePanel === 'orders' && (
                        <>
                          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                            <Gavel className="w-5 h-5 text-emerald-600" />
                            {t('kiosk.judicial_orders')}
                          </h2>
                          <ul className="text-sm space-y-3 text-slate-600">
                            <li className="p-3 rounded-xl bg-slate-50 border">• 12 Feb 2026 – Interim stay granted</li>
                            <li className="p-3 rounded-xl bg-slate-50 border">• 05 Jan 2026 – Notice issued to respondent</li>
                            <li className="p-3 rounded-xl bg-slate-50 border">• 18 Dec 2025 – Case admitted</li>
                          </ul>
                        </>
                      )}
                      {activePanel === 'cause' && (
                        <>
                          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                            <List className="w-5 h-5 text-emerald-600" />
                            {t('kiosk.hearing_list')}
                          </h2>
                          <ul className="text-sm space-y-3 text-slate-600">
                            <li className="p-3 rounded-xl bg-slate-50 border">• 15 Feb 2026 – Arguments Hearing</li>
                            <li className="p-3 rounded-xl bg-slate-50 border">• 28 Apr 2026 – Evidence Review</li>
                            <li className="p-3 rounded-xl bg-slate-50 border">• 10 Jun 2026 – Final Submission</li>
                          </ul>
                        </>
                      )}
                      {activePanel === 'helpdesk' && (
                        <>
                          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                            <Phone className="w-5 h-5 text-emerald-600" />
                            {t('kiosk.contact_helpdesk')}
                          </h2>
                          <div className="text-sm space-y-3 text-slate-600">
                            <p className="p-3 rounded-xl bg-slate-50 border">📞 044-2567-8899</p>
                            <p className="p-3 rounded-xl bg-slate-50 border">🕘 10:00 AM – 5:00 PM</p>
                            <p className="p-3 rounded-xl bg-slate-50 border">📍 Chennai District Court Facilitation Center</p>
                          </div>
                        </>
                      )}
                      <button
                        onClick={() => setActivePanel('home')}
                        className="mt-6 w-full py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-widest hover:bg-slate-200 transition"
                      >
                        {t('kiosk.close')}
                      </button>
                    </div>
                  </div>
                )}

                {/* MENU CARDS */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <MenuCard
                    icon={Search}
                    title={t('kiosk.case_status')}
                    subtitle={t('kiosk.case_status_sub')}
                    onClick={() => onNavigate('tracking')}
                  />
                  <MenuCard
                    icon={HelpCircle}
                    title={t('kiosk.legal_assistance')}
                    subtitle={t('kiosk.legal_assistance_sub')}
                    onClick={() => onNavigate('chatbot')}
                  />
                  <MenuCard
                    icon={Bell}
                    title={t('kiosk.reminders')}
                    subtitle={t('kiosk.reminders_sub')}
                    onClick={() => onNavigate('reminders')}
                  />
                  <MenuCard
                    icon={Phone}
                    title={t('kiosk.contact_helpdesk')}
                    subtitle={t('kiosk.contact_helpdesk_sub')}
                    onClick={() => setActivePanel('helpdesk')}
                  />
                </div>

                {/* VOICE INPUT */}
                <div className="mt-6">
                  <button
                    onClick={startListening}
                    className={`w-full flex items-center justify-center gap-4 py-4 rounded-2xl text-xs uppercase tracking-widest text-white transition-all ${
                      isListening
                        ? 'bg-emerald-700 animate-pulse'
                        : 'bg-slate-900 hover:bg-emerald-800'
                    }`}
                  >
                    <div className="p-1.5 rounded-full bg-emerald-500">
                      <Mic className="w-4 h-4" />
                    </div>
                    {isListening ? t('kiosk.listening') : t('kiosk.speak_query')}
                  </button>

                  {/* Live transcript */}
                  {transcript && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 text-slate-700 text-sm">
                      <strong>{t('kiosk.you_said')}:</strong> {transcript}
                    </div>
                  )}

                  {/* Voice action feedback */}
                  {voiceFeedback && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                      {voiceFeedback}
                    </div>
                  )}

                  {/* Hint text */}
                  {!isListening && !transcript && !voiceFeedback && (
                    <p className="mt-2 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                      {t('kiosk.try_saying')}
                    </p>
                  )}
                </div>
              </main>
            </div>

            {/* FOOTER */}
            <footer className="bg-slate-50 px-10 py-3 flex justify-between items-center text-[8px] text-slate-400 uppercase tracking-[0.2em] border-t">
              <span>LEGAL EDGE • DIGITAL JUSTICE ACCESS</span>
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-emerald-600 font-bold"
              >
                {t('kiosk.exit_kiosk')}
              </button>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Menu Card ────────────────────────────────────────────────────────────── */
function MenuCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        group
        rounded-lg
        p-[2px]
        bg-gradient-to-br from-emerald-500/25 to-emerald-500/10
        hover:from-emerald-500/40 hover:to-emerald-500/15
        transition
      "
    >
      <div
        className="
          h-full w-full
          rounded-md
          bg-white border
          px-6 py-7
          flex flex-col items-center justify-center
        "
      >
        <div className="w-11 h-11 rounded-md bg-emerald-50 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>

        <p className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
          {title}
        </p>

        <p className="text-[11px] text-slate-500 mt-1 text-center leading-snug">
          {subtitle}
        </p>
      </div>
    </button>
  );
}
