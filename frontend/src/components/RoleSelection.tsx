import React from 'react';
import { UserPlus, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RoleSelection({ onSelect }: { onSelect: (isNew: boolean) => void }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-[#0a0f1d] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase text-white tracking-tighter italic">Access <span className="text-emerald-500">Portal</span></h2>
          <p className="text-slate-500 text-[9px] font-bold tracking-[0.4em] uppercase mt-1 italic">Select Identity Type</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => onSelect(true)} className="w-full p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group flex items-center gap-5 text-left">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all"><UserPlus size={24} /></div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase text-white">New User</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Create Profile</p>
            </div>
            <ArrowRight size={16} className="text-slate-700 group-hover:text-emerald-400" />
          </button>
          <button onClick={() => onSelect(false)} className="w-full p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group flex items-center gap-5 text-left">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all"><ShieldCheck size={24} /></div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase text-white">Existing User</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Kiosk Handshake</p>
            </div>
            <ArrowRight size={16} className="text-slate-700 group-hover:text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
}