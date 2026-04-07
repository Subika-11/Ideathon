import { Bell, Calendar, Clock, AlertTriangle, Info, Scale, FileText, ChevronLeft } from 'lucide-react';
import Navigation from './Navigation';

type Page = 'home' | 'kiosk' | 'features' | 'tracking' | 'impact' | 'chatbot' | 'reminders';

interface RemindersPageProps {
  onNavigate: (page: Page) => void;
}

const REMINDERS = [
  {
    type: 'urgent',
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-600',
    label: 'URGENT',
    title: 'Upcoming Court Hearing',
    date: '15 February 2026 • 10:30 AM',
    desc: 'Court Room 4, District Court Coimbatore — Arguments Hearing scheduled. Ensure all documents are submitted before the hearing.',
  },
  {
    type: 'deadline',
    icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'DEADLINE',
    title: 'Document Submission Deadline',
    date: '10 February 2026',
    desc: 'Additional evidence documents must be submitted to the court registry before this date. Late submissions will not be accepted.',
  },
  {
    type: 'info',
    icon: Scale,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'NOTICE',
    title: 'Court Holiday — Republic Day',
    date: '26 January 2026',
    desc: 'All district courts will remain closed on Republic Day. No hearings or filings will be processed. Plan accordingly.',
  },
  {
    type: 'info',
    icon: Calendar,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'SCHEDULED',
    title: 'Lawyer Consultation',
    date: '12 February 2026 • 3:00 PM',
    desc: 'Pre-hearing preparation meeting with your advocate. Location: Advocate Chamber, District Court Complex.',
  },
  {
    type: 'info',
    icon: Clock,
    color: 'text-purple-500',
    bg: 'bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    label: 'GENERAL',
    title: 'Court Filing Hours',
    date: 'Daily',
    desc: 'The court registry accepts filings between 10:30 AM – 1:00 PM and 2:30 PM – 4:30 PM on all working days.',
  },
  {
    type: 'info',
    icon: Info,
    color: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    label: 'REMINDER',
    title: 'Carry Original Documents',
    date: 'All Hearings',
    desc: 'Always carry original copies of all submitted documents to every hearing. Courts may request originals for verification at any time.',
  },
];

export default function RemindersPage({ onNavigate }: RemindersPageProps) {
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
            <ChevronLeft className="w-4 h-4" /> Back to Kiosk
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight italic">
                COURT <span className="text-gradient">REMINDERS</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Upcoming hearings, deadlines & general notices
              </p>
            </div>
          </div>
        </div>

        {/* Reminder Cards */}
        <div className="space-y-4">
          {REMINDERS.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className={`flex gap-4 p-5 rounded-2xl border ${r.bg} transition-all hover:shadow-md`}
              >
                {/* Icon */}
                <div className={`mt-0.5 p-2.5 rounded-xl bg-white shadow-sm border flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${r.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${r.badge}`}>
                      {r.label}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">{r.title}</h3>
                  </div>
                  <p className={`text-xs font-bold mb-1.5 ${r.color}`}>{r.date}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-muted-foreground uppercase tracking-widest">
          Reminders are auto-synced with the National Judicial Data Grid
        </p>
      </main>
    </div>
  );
}
