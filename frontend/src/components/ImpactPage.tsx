import {
  Heart,
  Users,
  Scale,
  Globe,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Navigation from './Navigation';

type Page = 'home' | 'kiosk' | 'features' | 'tracking' | 'impact';

interface ImpactPageProps {
  onNavigate: (page: Page) => void;
}

/* ---------- SCROLL ANIMATION HOOK ---------- */
function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export default function ImpactPage({ onNavigate }: ImpactPageProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navigation currentPage="impact" onNavigate={onNavigate} />

      <main className="max-w-7xl mx-auto px-6 py-20 space-y-32">
        <Header />
        <Metrics />
        <WhoBenefits />
        <WhyItMatters />
        <Mission />
      </main>
    </div>
  );
}

/* ---------- SECTIONS ---------- */

function Header() {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 mb-6">
        <Heart className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-5xl font-black tracking-tight mb-4
        bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400
        text-transparent bg-clip-text">
        Societal Impact
      </h1>
      <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
        LegalEdge delivers accessible, transparent justice infrastructure
        for communities traditionally excluded from the system.
      </p>
    </div>
  );
}

function Metrics() {
  const { ref, visible } = useReveal();

  const metrics = [
    { value: '700M+', label: 'Rural citizens', color: 'emerald' },
    { value: '4.5 Cr+', label: 'Pending cases', color: 'blue' },
    { value: '22+', label: 'Languages supported', color: 'amber' },
    { value: '24/7', label: 'Kiosk access', color: 'rose' },
  ];

  return (
    <div
      ref={ref}
      className={`grid md:grid-cols-4 gap-6 transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {metrics.map((m, i) => (
        <div
          key={i}
          style={{ transitionDelay: `${i * 120}ms` }}
          className={`rounded-2xl p-6 text-center
            bg-white/5 border border-white/10
            hover:-translate-y-1 hover:shadow-lg transition-all duration-500`}
        >
          <div className={`text-4xl font-black text-${m.color}-400 mb-2`}>
            {m.value}
          </div>
          <p className="text-sm text-slate-400">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

function WhoBenefits() {
  const { ref, visible } = useReveal();

  const benefits = [
    {
      icon: <Users />,
      color: 'emerald',
      title: 'Rural & Digitally Excluded',
      desc: 'Access justice without smartphones or internet.',
    },
    {
      icon: <Scale />,
      color: 'blue',
      title: 'Women & Vulnerable Groups',
      desc: 'Trusted updates and legal guidance.',
    },
    {
      icon: <Users />,
      color: 'amber',
      title: 'Elderly & Differently-Abled',
      desc: 'Simple, accessible interfaces.',
    },
    {
      icon: <Globe />,
      color: 'rose',
      title: 'Judicial Institutions',
      desc: 'Reduced delays and higher trust.',
    },
  ];

  return (
    <div
      ref={ref}
      className={`transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <h2 className="text-3xl font-bold text-white mb-12 text-center">
        Who Benefits
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {benefits.map((b, i) => (
          <div
            key={i}
            style={{ transitionDelay: `${i * 120}ms` }}
            className="flex gap-4 p-6 rounded-2xl
              bg-white/5 border border-white/10
              hover:border-white/30 hover:-translate-y-1 transition-all duration-500"
          >
            <div className={`w-12 h-12 rounded-xl bg-${b.color}-500/15
              flex items-center justify-center text-${b.color}-400`}>
              {b.icon}
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">{b.title}</h3>
              <p className="text-sm text-slate-400">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhyItMatters() {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`rounded-[3rem] p-[2px]
        bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-indigo-500/20
        transition-all duration-700
        ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      <div className="rounded-[2.9rem] bg-[#060c18] p-16 text-center">
        <Award className="w-14 h-14 mx-auto mb-6 text-cyan-400" />
        <h2 className="text-3xl font-black text-white mb-4">
          Why LegalEdge Matters
        </h2>
        <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
          LegalEdge is justice infrastructure — combining offline access,
          AI assistance, and tamper-proof records to empower citizens
          and strengthen the judicial ecosystem.
        </p>
      </div>
    </div>
  );
}

function Mission() {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800
        p-16 text-center shadow-2xl transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <TrendingUp className="w-16 h-16 mx-auto mb-6 text-emerald-400" />
      <h2 className="text-3xl font-black text-white mb-4">
        Our Mission
      </h2>
      <p className="text-lg text-slate-300 max-w-4xl mx-auto leading-relaxed mb-6">
        To ensure access to justice never depends on wealth, location,
        education, or digital literacy.
      </p>
      <div className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
        <Scale className="w-5 h-5" />
        Justice for All. Dignity for Everyone.
      </div>
    </div>
  );
}
