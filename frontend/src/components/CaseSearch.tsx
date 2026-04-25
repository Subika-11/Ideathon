import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation';

type SearchMethod = 'cnr' | 'party' | 'case_no' | 'filing' | 'fir' | 'advocate';

export default function CaseSearch({ onNavigate }: { onNavigate: (p: any) => void }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<SearchMethod>('cnr');
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate network request
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 800);
  };

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
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${method === m.id
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

            <form className="space-y-8 relative z-10" onSubmit={handleSearch}>
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
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Fetch Case Details'}
                {!isSearching && (
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7M3 12h18" />
                  </svg>
                )}
              </button>
            </form>
          </div>

          {/* Search Results / Mock Data */}
          {hasSearched && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Case Details</h3>
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">CNR: MHTH010000012023</p>
                  </div>
                  <span className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                  {/* Column 1 */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Case Type / Number / Year</h4>
                      <p className="text-sm text-slate-200 font-medium">Regular Civil Suit / 123 / 2023</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Filing Number / Date</h4>
                      <p className="text-sm text-slate-200 font-medium">1542 / 12-05-2023</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Registration Number / Date</h4>
                      <p className="text-sm text-slate-200 font-medium">890 / 15-05-2023</p>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">First Hearing Date</h4>
                      <p className="text-sm text-slate-200 font-medium">20-06-2023</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Next Hearing Date</h4>
                      <p className="text-sm text-emerald-400 font-bold">15-11-2023</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Stage of Case</h4>
                      <p className="text-sm text-slate-200 font-medium">Evidence</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Court Number and Judge</h4>
                      <p className="text-sm text-slate-200 font-medium">Court No. 4, Hon'ble District Judge</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Petitioner */}
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-3">Petitioner and Advocate</h4>
                    <p className="text-sm text-white font-bold">Rajesh Kumar</p>
                    <p className="text-xs text-slate-400 mt-1">Advocate: Amit Sharma</p>
                  </div>

                  {/* Respondent */}
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-3">Respondent and Advocate</h4>
                    <p className="text-sm text-white font-bold">Suresh Singh</p>
                    <p className="text-xs text-slate-400 mt-1">Advocate: Priya Patel</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors">
                    View History
                  </button>
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors">
                    Download Orders
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Footer */}
          <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            Synchronized with National Judicial Data Grid (NJDG)
          </p>
        </div>
      </main>
    </div>
  );
}