import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, MousePointer2 } from 'lucide-react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import KioskDemo from './components/KioskDemo';
import FeaturesPage from './components/FeaturesPage';
import ImpactPage from './components/ImpactPage';
import CaseTrackingPage from './components/case-tracking/CaseTracking';
import LegalChatbot from './components/LegalChatbot';
import LocateKiosk from './components/LocateKiosk';
import { changeLanguage } from './translate';
import i18n from './i18n';
import RemindersPage from './components/RemaindersPage';

/* ---------------- TYPES ---------------- */

type Page =
  | 'landing'
  | 'login'
  | 'home'
  | 'kiosk'
  | 'locate'
  | 'features'
  | 'tracking'
  | 'impact'
  | 'case'
  | 'chatbot'
  | 'reminders';

/* ---------------- TOUR ---------------- */

const TOUR_STEPS: { page: Page; title: string; desc: string }[] = [
  { page: 'home', title: 'tour_step1_title', desc: 'tour_step1_desc' },
  { page: 'features', title: 'tour_step2_title', desc: 'tour_step2_desc' },
  { page: 'tracking', title: 'tour_step3_title', desc: 'tour_step3_desc' },
  { page: 'impact', title: 'tour_step4_title', desc: 'tour_step4_desc' },
  { page: 'kiosk', title: 'tour_step5_title', desc: 'tour_step5_desc' },
];

/* ---------------- APP ---------------- */

export default function App() {
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  /* ---------------- LANGUAGE RESTORE ---------------- */
  useEffect(() => {
    const savedLang = localStorage.getItem('auto_lang') || 'en';
    i18n.changeLanguage(savedLang);
    changeLanguage(savedLang);
  }, []);

  /* ---------------- URL → STATE (ON LOAD) ---------------- */
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Page;
    if (hash) {
      setCurrentPage(hash);
    }
  }, []);

  /* ---------------- BROWSER BACK / FORWARD ---------------- */
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const page = e.state?.page as Page | undefined;
      if (page) {
        setCurrentPage(page);
        if (e.state?.caseId) {
          setCurrentCaseId(e.state.caseId);
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /* ---------------- NAVIGATE ---------------- */
  const navigate = (page: Page, state: Record<string, any> = {}) => {
    if (isTourActive) return;

    window.history.pushState({ page, ...state }, '', `#${page}`);
    setCurrentPage(page);

    if (state.caseId) {
      setCurrentCaseId(state.caseId);
    }
  };

  /* ---------------- LANGUAGE SELECT ---------------- */
  const handleLangSelect = (lng: string) => {
    localStorage.setItem('auto_lang', lng);
    i18n.changeLanguage(lng);
    changeLanguage(lng);
    navigate('login');
  };

  /* ---------------- TOUR ---------------- */
  const nextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      const next = tourStep + 1;
      setTourStep(next);
      navigate(TOUR_STEPS[next].page);
    } else {
      setIsTourActive(false);
      navigate('home');
    }
  };

  /* ---------------- PAGE RENDERER ---------------- */
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onLanguageSelect={handleLangSelect} />;

      case 'login':
        return (
          <LoginPage
            onNavigate={navigate}
            onSuccess={() => navigate('home')}
            onBack={() => navigate('landing')}
          />
        );

      case 'home':
        return <HomePage onNavigate={navigate} />;

      case 'features':
        return <FeaturesPage onNavigate={navigate} />;

      case 'tracking':
        return <CaseTrackingPage onNavigate={navigate} />;

      case 'impact':
        return <ImpactPage onNavigate={navigate} />;

      case 'kiosk':
        return <KioskDemo onNavigate={navigate} />;

      case 'case':
        return currentCaseId
          ? require('./components/CaseDetails').default({
              caseId: currentCaseId,
              onBack: () => navigate('tracking'),
            })
          : <CaseTrackingPage onNavigate={navigate} />;

      case 'locate':
        return <LocateKiosk onNavigate={navigate} />;

      case 'chatbot':
        return (
          <div className="min-h-screen bg-background text-foreground pt-28 px-6">
            <LegalChatbot />
          </div>
        );
      
      case 'reminders':
        return <RemindersPage onNavigate={navigate} />;

      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen bg-background text-foreground relative font-inter">
      {/* Footer */}
      <div className="fixed bottom-6 left-0 w-full text-center pointer-events-none z-0">
        <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-[0.35em] italic opacity-40">
          Legal Edge • Digital Justice Redefined
        </p>
      </div>

      <div
        className={`transition-all duration-700 ${
          isTourActive ? 'blur-md pointer-events-none scale-[0.98]' : ''
        }`}
      >
        {renderPage()}
      </div>

      {/* TOUR */}
      {isTourActive && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[220px] animate-bounce">
            <MousePointer2 className="w-14 h-14 text-primary fill-primary rotate-[160deg]" />
          </div>

          <div className="w-full max-w-sm bg-card rounded-[2.5rem] p-10 shadow-2xl text-center">
            <h3 className="text-2xl font-black uppercase italic text-gradient">
              {t(TOUR_STEPS[tourStep].title)}
            </h3>

            <p className="text-muted-foreground text-sm mt-4">
              {t(TOUR_STEPS[tourStep].desc)}
            </p>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setIsTourActive(false)}
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
              >
                {t('skip')}
              </button>

              <button
                onClick={nextTourStep}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] uppercase flex items-center gap-2 font-semibold"
              >
                {tourStep === TOUR_STEPS.length - 1
                  ? t('finish')
                  : t('next_step')}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
