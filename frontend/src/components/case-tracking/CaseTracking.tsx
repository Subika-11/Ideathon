import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { CNRSearchBar } from './CNRSearchBar';
import { SearchingState } from './SearchingState';
import { CaseSummaryCard } from './CaseSummaryCard';
import { KeyDetailsGrid } from './KeyDetailsGrid';
import { CaseTimeline } from './CaseTimeline';
import { RemindersCard } from './RemindersCard';
import Navigation from  '../Navigation';
import { searchCaseByCnr } from '@/utils/cases';
import type { CaseData, TimelineEvent, Reminder } from '@/types/case';

type Page = 'home' | 'kiosk' | 'features' | 'tracking' | 'impact' | 'chatbot';

export default function CaseTrackingPage({
  onNavigate,
}: {
  onNavigate: (p: Page) => void;
}) {
  const { t } = useTranslation();
  const [viewState, setViewState] = useState<'search' | 'searching' | 'results' | 'not_found'>('search');
  const [searchError, setSearchError] = useState('');

  // These hold whatever came back from Supabase for the searched CNR
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const handleSearch = async (cnr: string) => {
    setSearchError('');
    setViewState('searching');

    const result = await searchCaseByCnr(cnr);

    if (!result.found || !result.caseData) {
      setSearchError(result.error ?? t('tracking.case_not_found'));
      setViewState('not_found');
      return;
    }

    setCaseData(result.caseData);
    setTimelineEvents(result.timelineEvents ?? []);
    setReminders(result.reminders ?? []);
    setViewState('results');
  };

  return (
    <div className="min-h-screen bg-background bg-pattern text-foreground flex flex-col">
      <Navigation currentPage="tracking" onNavigate={onNavigate} />

      <main className="flex-1 pt-20">
        <AnimatePresence mode="wait">

          {/* ── Search ── */}
          {viewState === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-6"
            >
              <div className="text-center mb-10">
                <h1 className="text-6xl font-extrabold mb-4 tracking-tight italic">
                  {t('tracking.track_case')}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t('tracking.real_time_records')}
                </p>
              </div>
              <div className="w-full max-w-2xl">
                <CNRSearchBar onSearch={handleSearch} isSearching={false} />
              </div>
            </motion.div>
          )}

          {/* ── Searching ── */}
          {viewState === 'searching' && <SearchingState key="searching" />}

          {/* ── Not found ── */}
          {viewState === 'not_found' && (
            <motion.div
              key="not_found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-8"
            >
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                  {t('tracking.case_not_found')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {searchError}
                </p>
                <p className="text-muted-foreground/60 text-xs">
                  {t('tracking.check_cnr')}
                </p>
              </div>

              {/* Search again */}
              <div className="w-full max-w-2xl">
                <CNRSearchBar
                  onSearch={handleSearch}
                  isSearching={false}
                />
              </div>
            </motion.div>
          )}

          {/* ── Results ── */}
          {viewState === 'results' && caseData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto px-6 py-12"
            >
              <CaseSummaryCard caseData={caseData} />

              <section className="mt-12">
                <KeyDetailsGrid caseData={caseData} />
              </section>

              <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CaseTimeline events={timelineEvents} />
                <RemindersCard reminders={reminders} />
              </section>

              {/* Search again link */}
              <div className="mt-10 text-center">
                <button
                  onClick={() => setViewState('search')}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition"
                >
                  ← {t('tracking.search_another')}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
