import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import Navigation from './Navigation';

export default function HomePage({
  onNavigate,
}: {
  onNavigate: (
    p:
      | 'home'
      | 'chatbot'
      | 'features'
      | 'tracking'
      | 'impact'
      | 'kiosk'
      | 'locate'
  ) => void;
}) {
  const { t, i18n } = useTranslation();

  const [showTutorial, setShowTutorial] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_home_tutorial');
    if (!hasSeen) setShowTutorial(true);
  }, []);

  const finishTutorial = () => {
    localStorage.setItem('has_seen_home_tutorial', 'true');
    setShowTutorial(false);
  };

  const tutorialSteps = [
    { title: t('tut_title_1'), desc: t('tut_desc_1'), btn: t('tut_btn_start') },
    { title: t('tut_title_2'), desc: t('tut_desc_2'), btn: t('tut_btn_next') },
    { title: t('tut_title_3'), desc: t('tut_desc_3'), btn: t('tut_btn_finish') },
  ];

  const handleOpenChat = () => {
    window.dispatchEvent(new Event('open-chat'));
  };

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-emerald-600/[0.04] blur-[160px]" />
        <div className="absolute bottom-0 left-0 w-[45%] h-[45%] bg-blue-600/[0.04] blur-[160px]" />
      </div>

      {/* Tutorial */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="relative w-full max-w-md bg-[#0b1328] border border-emerald-500/30 rounded-[2.5rem] p-10 shadow-xl">
            <button
              onClick={finishTutorial}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X />
            </button>

            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="text-emerald-400" />
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                {t('tutorial_mode')} · {t('step')} {step + 1}
              </p>

              <h3 className="text-3xl font-black text-white uppercase italic">
                {tutorialSteps[step].title}
              </h3>

              <p className="text-slate-400 leading-relaxed">
                {tutorialSteps[step].desc}
              </p>

              <div className="flex justify-between pt-4">
                <button
                  onClick={finishTutorial}
                  className="text-xs uppercase text-slate-500 hover:text-white"
                >
                  {t('skip')}
                </button>

                <button
                  onClick={() =>
                    step < tutorialSteps.length - 1
                      ? setStep(step + 1)
                      : finishTutorial()
                  }
                  className="px-8 py-3 bg-emerald-600 rounded-xl text-xs font-black uppercase flex items-center gap-2"
                >
                  {tutorialSteps[step].btn} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navigation currentPage="home" onNavigate={onNavigate} />

      {/* Main */}
      <main
        className={`relative z-10 h-full flex flex-col items-center pt-36 px-6 overflow-y-auto transition ${
          showTutorial ? 'blur-md scale-95' : ''
        }`}
      >
        {/* HERO */}
        <section className="max-w-4xl text-center space-y-10 mb-24">
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight">
            {t('bridge_to_justice')}
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-3xl mx-auto">
            {t('hero_description')}
          </p>

          <button
            onClick={() => onNavigate('kiosk')}
            className="px-20 py-4 bg-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition"
          >
            {t('launch_system')}
          </button>
        </section>

        {/* MODULES */}
        <section className="w-full max-w-6xl pb-28">
          <div className="flex items-center gap-6 mb-20">
            <div className="flex-1 h-px bg-white/20" />
            <span className="uppercase tracking-[0.4em] font-black text-xs">
              {t('core_modules')}
            </span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <div
            key={i18n.language}
            className="grid grid-cols-1 md:grid-cols-3 gap-14"
          >
            {/* Case Tracking */}
            <button
              onClick={() => onNavigate('tracking')}
              className="group rounded-[2.5rem] bg-gradient-to-b from-[#0b1328] to-[#060b16]
                         ring-2 ring-white/20 hover:ring-emerald-400
                         transition-all duration-500 hover:-translate-y-2"
            >
              <div className="px-12 py-16 text-left">
                <h3 className="text-2xl font-black text-white">Case Tracking</h3>
                <p className="text-slate-400 mt-3">
                  Track case status, hearings, and judicial orders transparently.
                </p>
                <div className="pt-8 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Open Module →
                </div>
              </div>
            </button>

            {/* Locate Kiosk */}
            <button
              onClick={() => onNavigate('locate')}
              className="group rounded-[2.5rem] bg-gradient-to-b from-[#0b1328] to-[#060b16]
                         ring-2 ring-white/20 hover:ring-sky-400
                         transition-all duration-500 hover:-translate-y-2"
            >
              <div className="px-12 py-16 text-left">
                <h3 className="text-2xl font-black text-white">Locate Kiosk</h3>
                <p className="text-slate-400 mt-3">
                  Find nearby Legal Edge kiosks using GPS and maps.
                </p>
                <div className="pt-8 text-[10px] font-black uppercase tracking-widest text-sky-400">
                  Find Nearby →
                </div>
              </div>
            </button>

            {/* Legal Assistant */}
            <button
              onClick={handleOpenChat}
              className="group rounded-[2.5rem] bg-gradient-to-b from-[#0b1328] to-[#060b16]
                         ring-2 ring-white/20 hover:ring-purple-400
                         transition-all duration-500 hover:-translate-y-2"
            >
              <div className="px-12 py-16 text-left">
                <h3 className="text-2xl font-black text-white">Legal Assistant</h3>
                <p className="text-slate-400 mt-3">
                  AI-powered legal guidance with voice and language support.
                </p>
                <div className="pt-8 text-[10px] font-black uppercase tracking-widest text-purple-400">
                  Start Chat →
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
