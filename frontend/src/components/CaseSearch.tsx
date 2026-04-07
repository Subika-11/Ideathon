import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation';

type SearchMethod = 'cnr' | 'party' | 'case_no' | 'filing' | 'fir' | 'advocate';

export default function CaseSearch({ onNavigate }: { onNavigate: (p: any) => void }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<SearchMethod>('cnr');
  const [query, setQuery] = useState('');

  const searchMethods = [
    { id: 'cnr', label: 'CNR Number', icon: '🆔' },
    { id: 'party', label: 'Party Name', icon: '👤' },
    { id: 'case_no', label: 'Case Number', icon: '📄' },
    { id: 'filing', label: 'Filing Number', icon: '📂' },
    { id: 'fir', label: 'FIR Number', icon: '🚨' },
    { id: 'advocate', label: 'Advocate', icon: '⚖️' },
  ];

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <Navigation currentPage="tracking" onNavigate={onNavigate} isLoggedIn={true} />

      <main className="flex-1 pt-24 pb-10 px-6 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Case Search</h2>
            <p className="text-xs text-emerald-500/60 font-black uppercase tracking-[0.3em]">Direct Access to Judicial Records</p>
          </div>

          {/* Tabbed Search Methods */}
          <div className="flex flex-wrap justify-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl">
            {searchMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as SearchMethod)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  method === m.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{m.icon}</span> {m.label}
              </button>
            ))}
          </div>

          {/* Dynamic Search Box (No Captcha) */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all" />
            
            <form className="space-y-8 relative z-10" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Search Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 ml-5">
                    Enter {method.replace('_', ' ').toUpperCase()}
                  </label>
                  <input 
                    type="text"
                    placeholder={`e.g. ${method === 'cnr' ? 'MHTH010000012023' : 'Enter details...'}`}
                    className="w-full bg-slate-900/50 border border-white/10 text-white rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  />
                </div>

                {/* Registration Year */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 ml-5">Year</label>
                  <select className="w-full bg-slate-900/50 border border-white/10 text-white rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none cursor-pointer">
                    {[2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Advanced Filters (Replaces messy eCourts sidebar) */}
              <div className="flex gap-4">
                {['Pending', 'Disposed', 'Both'].map(status => (
                  <label key={status} className="flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition">
                    <input type="radio" name="status" className="accent-emerald-500 w-4 h-4" defaultChecked={status === 'Both'} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{status}</span>
                  </label>
                ))}
              </div>

              {/* Action Button */}
              <button className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 group">
                Fetch Case Details
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7M3 12h18" />
                </svg>
              </button>
            </form>
          </div>

          {/* Info Footer */}
          <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            Synchronized with National Judicial Data Grid (NJDG)
          </p>
        </div>
      </main>
    </div>
  );
}