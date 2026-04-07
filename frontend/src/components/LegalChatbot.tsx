import React, { useState, useRef, useEffect } from 'react';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const KNOWLEDGE_BASE = {
  property: {
    label: "Property & Housing",
    color: "text-blue-400",
    docs: "**Required Documents for Property Disputes:**\n\n• Original Sale Deed / Gift Deed\n• Property Tax Receipts (Last 3 years)\n• Encumbrance Certificate (EC)\n• Survey Map & Possession Certificate",
    filing: "**Filing Procedure (Civil Court):**\n\n1. **Legal Notice:** Send a formal notice to the opposite party.\n2. **Plaint Drafting:** Prepare the 'Plaint' with facts and prayers.\n3. **Court Fee:** Calculate and pay fees based on property value.\n4. **Summons:** Court issues notice to the defendant.",
  },
  criminal: {
    label: "Criminal Law",
    color: "text-red-400",
    docs: "**Evidence Checklist for Criminal Matters:**\n\n• Copy of the FIR (First Information Report)\n• Medical Reports (MLC) if physical injury occurred\n• Witness Statements (Names & Contact info)\n• Digital Evidence (Photos/CCTV/Call Logs)",
    filing: "**Criminal Procedure (Stages):**\n\n1. **Registration:** Filing FIR at the Police Station.\n2. **Investigation:** Police collect evidence and record statements.\n3. **Charge Sheet:** Police submit report to the Magistrate.\n4. **Trial:** Framing of charges and examination of witnesses.",
  },
  family: {
    label: "Family & Matrimonial",
    color: "text-purple-400",
    docs: "**Family Court Documentation:**\n\n• Marriage Registration Certificate\n• Address Proof of both parties\n• Financial Disclosure (Income/Assets affidavit)\n• Birth Certificates of children (if applicable)",
    filing: "**Family Court Process:**\n\n1. **Petition:** File the case in the specialized Family Court.\n2. **Counseling:** Mandatory meeting with a court counselor.\n3. **Interim Orders:** Court may pass orders for maintenance.\n4. **Final Decree:** Judgment after trial or mutual settlement.",
  }
};

export default function LegalChatbot({ panel = false }: { panel?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Welcome to **Legal Edge AI**. ⚖️\n\nI am designed to provide preliminary guidance for rural and marginalized citizens. \n\n**Please describe your issue below to begin.**",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTrack, setActiveTrack] = useState<keyof typeof KNOWLEDGE_BASE | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleLogic = (userInput: string) => {
    const t = userInput.toLowerCase();
    let reply = "";

    if (t.includes('land') || t.includes('home') || t.includes('property') || t.includes('rent')) {
      setActiveTrack('property');
      reply = "Track set to **Property Law**. I can now provide specific checklists for land and housing disputes.";
    } else if (t.includes('theft') || t.includes('assault') || t.includes('police') || t.includes('criminal')) {
      setActiveTrack('criminal');
      reply = "Track set to **Criminal Law**. Please ensure you have filed an FIR at your local station.";
    } else if (t.includes('marriage') || t.includes('divorce') || t.includes('family')) {
      setActiveTrack('family');
      reply = "Track set to **Family Law**. I can guide you through Family Court procedures and mediation.";
    } else if (t.includes('doc')) {
      reply = activeTrack ? KNOWLEDGE_BASE[activeTrack].docs : "Please select a **Case Category** first to see the specific document checklist.";
    } else if (t.includes('filing') || t.includes('process')) {
      reply = activeTrack ? KNOWLEDGE_BASE[activeTrack].filing : "Filing procedures vary by case. Please select a category (Property/Criminal/Family) first.";
    } else if (t.includes('aid') || t.includes('free')) {
      reply = "Under **Section 12 of the Legal Services Act**, you may be eligible for **Free Legal Aid**. Would you like to check your eligibility for a pro-bono lawyer?";
    } else {
      reply = "I've noted that. You can type **'Documents'**, **'Filing Process'**, or **'Legal Aid'** to get more specific details for your case.";
    }

    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  const onSend = (text?: string) => {
    const val = text || input;
    if (!val.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: val }]);
    setInput('');
    handleLogic(val);
  };

  return (
    <div className={panel ? "flex flex-col h-full bg-[#020617] text-slate-100" : "flex flex-col h-[650px] w-full max-w-lg mx-auto bg-[#020617] rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-sans"}>
      
      {/* Premium Dynamic Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-white/[0.05] to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            {/* Animated Avatar Box */}
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-blue-600 p-[2px] shadow-lg shadow-emerald-500/20 transition-transform duration-500 group-hover:rotate-6">
                <div className="w-full h-full rounded-[14px] bg-[#020617] flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-t from-emerald-400 to-blue-400 font-black text-xl italic tracking-tighter">
                    L
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#020617] rounded-full flex items-center justify-center border border-white/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white leading-none">
                  Justice Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                  v2.0
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className={`h-1 w-1 rounded-full ${activeTrack ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <p className={`text-[10px] font-black uppercase tracking-[0.1em] transition-colors duration-300 ${activeTrack ? KNOWLEDGE_BASE[activeTrack].color : 'text-slate-500'}`}>
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTrack(null)}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-emerald-500/[0.02]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] px-5 py-4 rounded-3xl text-[14px] leading-relaxed shadow-xl ${
              m.sender === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white/[0.05] border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-sm'
            }`}>
              <div className="whitespace-pre-line font-medium">
                {m.text.split('**').map((part, idx) => 
                  idx % 2 === 1 ? <span key={idx} className="text-emerald-400 font-black">{part}</span> : part
                )}
              </div>
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
      </div>

      {/* Action Chips */}
      <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar bg-black/40 border-t border-white/5">
        {(activeTrack ? ['Documentation', 'Filing Process', 'Legal Aid', 'Reset'] : ['Property', 'Criminal', 'Family']).map((action) => (
          <button
            key={action}
            onClick={() => action === 'Reset' ? setActiveTrack(null) : onSend(action)}
            className="whitespace-nowrap px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-300"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Section */}
      <div className="p-6 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-3 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Describe your legal concern..."
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <button 
            onClick={() => onSend()}
            className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all"
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