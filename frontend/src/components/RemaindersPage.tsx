import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, Clock, AlertTriangle, Info, Scale, FileText, ChevronLeft, Loader2 } from 'lucide-react';
import Navigation from './Navigation';
import { fetchReminders, isLoggedIn } from '@/utils/api';

type Page = 'home' | 'kiosk' | 'features' | 'tracking' | 'impact' | 'chatbot' | 'reminders';

interface RemindersPageProps {
  onNavigate: (page: Page) => void;
}

// Fallback reminders shown when not logged in or API unavailable
const FALLBACK_REMINDERS = [
  {
    type: 'urgent',
    icon: 'AlertTriangle',
    title: 'Upcoming Court Hearing',
    date: '15 February 2026 • 10:30 AM',
    desc: 'Court Room 4, District Court Coimbatore — Arguments Hearing scheduled. Ensure all documents are submitted before the hearing.',
    urgent: true,
  },
  {
    type: 'deadline',
    icon: 'FileText',
    title: 'Document Submission Deadline',
    date: '10 February 2026',
    desc: 'Additional evidence documents must be submitted to the court registry before this date.',
    urgent: false,
  },
  {
    type: 'info',
    icon: 'Scale',
    title: 'Court Holiday — Republic Day',
    date: '26 January 2026',
    desc: 'All district courts will remain closed on Republic Day. No hearings or filings will be processed.',
    urgent: false,
  },
  {
    type: 'info',
    icon: 'Calendar',
    title: 'Lawyer Consultation',
    date: '12 February 2026, 3:00 PM',
    desc: 'Pre-hearing preparation meeting with your advocate. Location: Advocate Chamber, District Court Complex.',
    urgent: false,
  },
  {
    type: 'info',
    icon: 'Clock',
    title: 'Court Filing Hours',
    date: 'Daily',
    desc: 'The court registry accepts filings between 10:30 AM – 1:00 PM and 2:30 PM – 4:30 PM on all working days.',
    urgent: false,
  },
  {
    type: 'info',
    icon: 'Info',
    title: 'Carry Original Documents',
    date: 'All Hearings',
    desc: 'Always carry original copies of all submitted documents to every hearing.',
    urgent: false,
  },
];


export default function RemindersPage({ onNavigate }: RemindersPageProps) {
  const { t } = useTranslation();

  // Map type strings to icon components and colors
  function getTypeConfig(type: string, urgent?: boolean) {
    if (urgent || type === 'urgent') {
      return {
        Icon: AlertTriangle,
        color: 'text-red-500',
        bg: 'bg-red-50 border-red-200',
        badge: 'bg-red-100 text-red-600',
        label: t('reminders.urgent'),
      };
    }
    switch (type) {
      case 'document':
      case 'deadline':
        return {
          Icon: FileText,
          color: 'text-amber-500',
          bg: 'bg-amber-50 border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          label: t('reminders.deadline'),
        };
      case 'hearing':
        return {
          Icon: Calendar,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-700',
          label: t('reminders.hearing'),
        };
      case 'meeting':
        return {
          Icon: Scale,
          color: 'text-blue-500',
          bg: 'bg-blue-50 border-blue-200',
          badge: 'bg-blue-100 text-blue-700',
          label: t('reminders.meeting'),
        };
      default:
        return {
          Icon: Info,
          color: 'text-slate-500',
          bg: 'bg-slate-50 border-slate-200',
          badge: 'bg-slate-100 text-slate-600',
          label: t('reminders.reminder'),
        };
    }
  }
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      if (!isLoggedIn()) {
        // Show fallback reminders for unauthenticated users
        setReminders(FALLBACK_REMINDERS.map((r, i) => ({ ...r, id: i })));
        setLoading(false);
        return;
      }

      try {
        const result = await fetchReminders();
        if (result.error) {
          setError(result.error);
          // Fall back to default reminders
          setReminders(FALLBACK_REMINDERS.map((r, i) => ({ ...r, id: i })));
        } else if (result.reminders.length === 0) {
          // No reminders from API — show fallback
          setReminders(FALLBACK_REMINDERS.map((r, i) => ({ ...r, id: i })));
        } else {
          setReminders(result.reminders);
        }
      } catch {
        setReminders(FALLBACK_REMINDERS.map((r, i) => ({ ...r, id: i })));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation currentPage="home" onNavigate={onNavigate as any} />

      <main className="flex-1 pt-24 pb-16 px-6 max-w-4xl mx-auto w-full">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => onNavigate('kiosk')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> {t('reminders.back_to_kiosk')}
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight italic">
                {t('reminders.title')}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t('reminders.sub')}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('reminders.loading')}</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            ⚠️ {error} — Showing default reminders.
          </div>
        )}

        {/* Reminder Cards */}
        {!loading && (
          <div className="space-y-4">
            {reminders.map((r, i) => {
              const config = getTypeConfig(r.type, r.urgent);
              const { Icon } = config;
              return (
                <div
                  key={r.id ?? i}
                  className={`flex gap-4 p-5 rounded-2xl border ${config.bg} transition-all hover:shadow-md`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 p-2.5 rounded-xl bg-white shadow-sm border flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}
                      </span>
                      <h3 className="font-semibold text-slate-800 text-sm">{r.title}</h3>
                    </div>
                    <p className={`text-xs font-bold mb-1.5 ${config.color}`}>{r.date}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{r.description || r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && reminders.length === 0 && (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t('reminders.no_reminders')}</p>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-muted-foreground uppercase tracking-widest">
          {t('reminders.synced')}
        </p>
      </main>
    </div>
  );
}
