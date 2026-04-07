import { useEffect, useState } from 'react';
import {
  Mic, Languages, WifiOff, ShieldCheck,
  Bell, Activity, FileCheck, ArrowRight, CheckCircle2,
  Database
} from 'lucide-react';
import Navigation from './Navigation';

type Page = 'home' | 'kiosk' | 'features' | 'tracking' | 'impact' | 'chatbot';

const TechnicalPillar = ({ icon: Icon, title, delay, items, colorClass }: any) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  /** SINGLE SOURCE OF COLOR TRUTH */
  const colorMap: Record<string, string[]> = {
    emerald: ['#10B981', '#059669'],
    blue: ['#3B82F6', '#2563EB'],
    amber: ['#F59E0B', '#D97706'],
    purple: ['#8B5CF6', '#7C3AED'],
  };

  const [c1, c2] = colorMap[colorClass] || colorMap.emerald;

  return (
    <div
      className={`group relative h-full transition-all duration-[1000ms] cubic-bezier(0.23,1,0.32,1) transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
      }`}
    >
      {/* OUTER GRADIENT EDGE */}
      <div
        style={{ background: `linear-gradient(135deg, ${c1}66, ${c2}22)` }}
        className="relative h-full rounded-[2.5rem] p-[1.5px]"
      >
        {/* CARD BODY */}
        <div className="relative bg-[#060c18] rounded-[2.45rem] p-10 h-full flex flex-col overflow-hidden">

          {/* SOFT INTERNAL GLOW */}
          <div
            style={{ background: `radial-gradient(circle at top right, ${c1}18, transparent)` }}
            className="absolute inset-0 pointer-events-none"
          />

          {/* ICON */}
          <div
            style={{ backgroundColor: `${c1}14`, borderColor: `${c1}33` }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border
                       group-hover:scale-110 transition-transform duration-500"
          >
            <Icon className="w-8 h-8" style={{ color: c1 }} />
          </div>

          {/* TITLE + FADED UNDERLINE */}
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white tracking-tight mb-4">
              {title}
            </h3>

            {/* 🔥 FADED-AWAY UNDERLINE */}
            <div
              style={{
                background: `linear-gradient(
                  90deg,
                  ${c1} 0%,
                  ${c2} 35%,
                  ${c2}55 60%,
                  ${c2}22 75%,
                  transparent 100%
                )`,
                boxShadow: `0 0 20px ${c1}55`,
              }}
              className="h-1.5 w-16 rounded-full
                         group-hover:w-32 transition-all duration-700 ease-out"
            />
          </div>

          {/* FEATURE LIST */}
          <ul className="space-y-4 flex-1">
            {items.map((item: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-4 text-slate-400 text-sm font-semibold
                           group-hover:text-white transition-colors"
              >
                <CheckCircle2
                  className="mt-1 w-4 h-4 flex-shrink-0
                             group-hover:scale-125 transition-transform"
                  style={{ color: c1 }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function PlatformFeatures({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden">
      <Navigation currentPage="features" onNavigate={onNavigate} />

      {/* AMBIENT LIGHTING */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-emerald-600/[0.04] blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[45%] h-[45%] bg-blue-600/[0.04] blur-[140px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-40 pb-40">

        {/* HEADER */}
        <div className="text-center mb-32 max-w-3xl mx-auto">
          

          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none">
            Architectural <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Capabilities.
            </span>
          </h1>

          <p className="text-slate-400 text-xl font-light leading-relaxed">
            Eliminating digital exclusion through neural AI processing and blockchain-grade integrity.
          </p>
        </div>

        {/* FEATURE GRID */}
        <div className="grid md:grid-cols-2 gap-10 mb-40">
          <TechnicalPillar
            delay={300}
            colorClass="emerald"
            icon={Mic}
            title="Voice-First Neural AI"
            items={[
              'Simultaneous 22+ Language NLP',
              'Regional dialect mapping',
              'Legal jargon deconstruction',
            ]}
          />

          <TechnicalPillar
            delay={1200}
            colorClass="blue"
            icon={Languages}
            title="Universal Support"
            items={[
              'Bilingual document synthesis',
              'Real-time script transliteration',
              'Native audio feedback',
            ]}
          />

          <TechnicalPillar
            delay={2100}
            colorClass="amber"
            icon={WifiOff}
            title="Edge Resilience"
            items={[
              '100% Offline service availability',
              'Localized record caching',
              'Automatic synchronization',
            ]}
          />

          <TechnicalPillar
            delay={3000}
            colorClass="purple"
            icon={ShieldCheck}
            title="Immutable Ledger"
            items={[
              'Blockchain-verified records',
              'Tamper-proof audit trails',
              'Decentralized accountability',
            ]}
          />
        </div>
{/* SMART LOGISTICS - MNC SERVICE GRID */}
<div className="relative group p-12 bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 mb-40">
  <div className="flex flex-col md:flex-row items-center justify-between gap-12">
    
    <div className="max-w-md">
      <div className="flex items-center gap-4 mb-4">
        <Database className="text-emerald-500 w-8 h-8" />
        <h2 className="text-3xl font-black text-white uppercase tracking-widest leading-none">
          Smart Logistics
        </h2>
      </div>

      {/* 🔥 FADED LIGHT-TRAIL UNDERLINE */}
      <div
        style={{
          background: `linear-gradient(
            90deg,
            #10B981 0%,
            #2DD4BF 35%,
            rgba(45,212,191,0.4) 60%,
            rgba(45,212,191,0.15) 75%,
            transparent 100%
          )`,
          boxShadow: `0 0 20px rgba(16,185,129,0.35)`
        }}
        className="h-1.5 w-40 rounded-full mb-6"
      />

      <p className="text-slate-500 text-sm leading-relaxed">
        Automated judicial tracking synchronized with the National Judicial Data Grid (NJDG) for real-time compliance.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
      {[
        { icon: Bell, t: "Alerts", d: "Multilingual SMS hearing alerts." },
        { icon: Activity, t: "NJDG Sync", d: "Live judicial status tracking." },
        { icon: FileCheck, t: "Verification", d: "AI compliance document checking." }
      ].map((f, i) => (
        <div
          key={i}
          className="rounded-3xl p-[2px] bg-gradient-to-br from-emerald-600/12 via-cyan-400/6 to-emerald-500/10"
        >
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
            <f.icon className="w-6 h-6 text-emerald-500 mb-4" />
            <h4 className="text-sm font-bold text-white uppercase mb-2">{f.t}</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">{f.d}</p>
          </div>
        </div>
      ))}
    </div>

  </div>
</div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('kiosk')}
            className="px-16 py-7 bg-gradient-to-br from-emerald-600 to-teal-700
                       rounded-full text-white font-black uppercase tracking-[0.4em]
                       text-[10px] hover:scale-105 transition-all inline-flex
                       items-center gap-6 shadow-2xl"
          >
            Launch Simulation
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
          </button>
        </div>
      </main>
    </div>
  );
}
