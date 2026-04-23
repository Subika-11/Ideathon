import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, fetchChatHistory, isLoggedIn } from '@/utils/api';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

// Available languages for the legal assistant
const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'தமிழ் (Tamil)' }, // Wait, hi-IN is Hindi. Will fix below
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
];

const KNOWLEDGE_BASE = {
  property: { label: "Property & Housing", color: "text-blue-400" },
  criminal: { label: "Criminal Law", color: "text-red-400" },
  family: { label: "Family & Matrimonial", color: "text-purple-400" }
};

export default function LegalChatbot({ panel = false }: { panel?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Welcome to **Legal Edge AI**. ⚖️\n\nI am here to help you understand your legal issue. You can type or speak securely.\n\n**Please select your language and describe your issue.**",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // New backend sync state
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('en-IN');
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [structuredData, setStructuredData] = useState<any>(null);

  // Audio/Voice states
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, structuredData]);

  // Handle Speech Recognition setup
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + " " + transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Update speech recognition language when selected language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Fresh start every time the chatbot is opened — no old history loaded
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: "Welcome to **Legal Edge AI**. ⚖️\n\nI am here to help you understand your legal issue. You can type or speak in any language securely.\n\n**Please describe your issue or choose a category below.**",
      },
    ]);
    setConsultationId(null);
    setActiveTrack(null);
    setStructuredData(null);
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput(''); // Clear input for fresh dictation
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const playTTS = useCallback((text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (speakingIdx === idx) {
      setSpeakingIdx(null);
      return;
    }

    // Strip all markdown formatting before speaking
    const cleanText = text
      .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
      .replace(/\*(.+?)\*/g, '$1')      // italic
      .replace(/^#{1,6}\s/gm, '')       // headings
      .replace(/^[•\-\*]\s/gm, '')      // bullets
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/`([^`]+)`/g, '$1')      // inline code
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Wait for voices to load, then pick the best match
    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = language.split('-')[0];
      
      // Try exact match first, then prefix match
      const voice = 
        voices.find(v => v.lang === language) ||
        voices.find(v => v.lang.startsWith(langPrefix)) ||
        voices.find(v => v.lang.startsWith(langPrefix.substring(0, 2)));
      
      if (voice) utterance.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      assignVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = assignVoice;
    }

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }, [language, speakingIdx]);

  const handleSend = async (overrideText?: string, isFinalCommand = false) => {
    const val = overrideText !== undefined ? overrideText : input;
    if (!val.trim()) return;

    if (!isFinalCommand) {
      setMessages(prev => [...prev, { sender: 'user', text: val }]);
    } else {
      setMessages(prev => [...prev, { sender: 'user', text: "Please generate my final structured legal report based on this conversation." }]);
    }
    
    setInput('');
    setIsTyping(true);

    try {
      const sendVal = isFinalCommand ? `GENERATE_FINAL_REPORT ${val}` : val;
      const result = await sendChatMessage(sendVal, activeTrack, language, consultationId);
      
      if (result.consultation_id) setConsultationId(result.consultation_id);
      if (result.active_track) setActiveTrack(result.active_track);
      
      setMessages(prev => [...prev, { sender: 'bot', text: result.reply }]);

      if (result.is_final_structured) {
        setStructuredData(result.structured_data);
      } else {
        // Auto-play TTS for the new bot reply
        setTimeout(() => playTTS(result.reply, messages.length + 1), 500);
      }

    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: "I'm having trouble connecting. Please check your internet." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={panel ? "flex flex-col h-full bg-[#020617] text-slate-100" : "flex flex-col h-[700px] w-full max-w-lg mx-auto bg-[#020617] rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-sans"}>
      
      {/* Premium Dynamic Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-white/[0.05] to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-blue-600 p-[2px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full rounded-[14px] bg-[#020617] flex items-center justify-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-t from-emerald-400 to-blue-400 font-black text-xl italic tracking-tighter">
                  L
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white leading-none">
                  AI Counsel
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${activeTrack ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${activeTrack && activeTrack in KNOWLEDGE_BASE ? (KNOWLEDGE_BASE as any)[activeTrack].color : 'text-slate-500'}`}>
                  {activeTrack && activeTrack in KNOWLEDGE_BASE ? (KNOWLEDGE_BASE as any)[activeTrack].label : 'General Assistance'}
                </p>
              </div>
            </div>
          </div>
          
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">हिंदी (Hindi)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
            <option value="te-IN">తెలుగు (Telugu)</option>
            <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
            <option value="ml-IN">മലയാളം (Malayalam)</option>
            <option value="bn-IN">বাংলা (Bengali)</option>
            <option value="mr-IN">मराठी (Marathi)</option>
            <option value="gu-IN">ગુજરાતી (Gujarati)</option>
            <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="or-IN">ଓଡିଆ (Odia)</option>
            <option value="as-IN">অসমীয়া (Assamese)</option>
            <option value="ur-IN">اردو (Urdu)</option>
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-transparent to-emerald-500/[0.02]">
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] px-5 py-4 rounded-3xl text-[14px] leading-relaxed shadow-xl group ${
              m.sender === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white/[0.05] border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-sm'
            }`}>
              <div className="whitespace-pre-line font-medium">
                {m.text.split('**').map((part, idx) => 
                  idx % 2 === 1 ? <span key={idx} className="text-emerald-400 font-black">{part}</span> : part
                )}
              </div>
              
              {/* Play Sound Button for Bot Messages */}
              {m.sender === 'bot' && (
                <button 
                  onClick={() => playTTS(m.text, i)}
                  className={`absolute -left-12 top-2 p-2 rounded-full border border-white/10 transition-colors ${speakingIdx === i ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 animate-pulse' : 'bg-black/30 text-slate-400 hover:text-white hover:bg-white/10'}`}
                  title="Read Aloud"
                >
                  {speakingIdx === i ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 p-2 items-center">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        {/* Structured Final Output */}
        {structuredData && !isTyping && (
           <div className="mt-8 bg-gradient-to-br from-emerald-900/40 to-black/40 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-emerald-400 font-black text-lg mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Legal Recommendation Report
              </h3>
              
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Summary</h4>
                  <p className="text-slate-200 text-sm">{structuredData.summary}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Required Actions</h4>
                  <div className="text-slate-200 text-sm whitespace-pre-line bg-black/20 p-3 rounded-xl border border-white/5">{structuredData.actions}</div>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Documents Needed</h4>
                  <div className="text-slate-200 text-sm whitespace-pre-line text-emerald-100">{structuredData.documents}</div>
                </div>
              </div>
           </div>
        )}

      </div>

      {/* Action Chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-black/40 border-t border-white/5">
        {(activeTrack && !structuredData) ? (
           <button
            onClick={() => handleSend("Please summarize the issue and provide the final structured report.", true)}
            className="whitespace-nowrap px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-xs font-black uppercase tracking-widest text-white hover:opacity-90 shadow-lg shadow-emerald-500/20"
          >
            Generate Final Report
          </button>
        ) : (
          ['Property Dispute', 'Domestic Violence', 'Theft', 'Fraud'].map((action) => (
            <button
              key={action}
              onClick={() => handleSend(action)}
              className="whitespace-nowrap px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              {action}
            </button>
          ))
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-2 items-center">
          
          <button 
            type="button"
            onClick={toggleListen}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Describe your legal concern..."}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          
          <button 
            onClick={() => handleSend()}
            disabled={isTyping}
            className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7M3 12h18" />
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
}