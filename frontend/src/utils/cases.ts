import { createClient } from '@supabase/supabase-js';
import type { CaseData, TimelineEvent, Reminder } from '@/types/case';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── SEARCH CASE BY CNR ────────────────────────────────────────────────────────
// Queries the cases table and its related hearings.
// Returns null if no case matches the CNR — the UI shows "not found" in that case.
export async function searchCaseByCnr(cnr: string): Promise<{
  found: boolean;
  caseData?: CaseData;
  timelineEvents?: TimelineEvent[];
  reminders?: Reminder[];
  error?: string;
}> {
  // Fetch the case row
  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .select('*')
    .eq('cnr', cnr.toUpperCase())
    .maybeSingle();

  if (caseError) {
    console.error('Case lookup error:', caseError);
    return { found: false, error: 'Could not search records. Please try again.' };
  }

  if (!caseRow) {
    return { found: false, error: 'No case found for this CNR number.' };
  }

  // Fetch hearings for this case ordered chronologically
  const { data: hearingRows, error: hearingError } = await supabase
    .from('hearings')
    .select('*')
    .eq('case_id', caseRow.id)
    .order('created_at', { ascending: true });

  if (hearingError) {
    console.error('Hearings lookup error:', hearingError);
    return { found: false, error: 'Could not load case timeline. Please try again.' };
  }

  // Map the DB row to the CaseData shape the components expect
  const caseData: CaseData = {
    cnr: caseRow.cnr,
    title: caseRow.title,
    petitioner: caseRow.petitioner,
    respondent: caseRow.respondent,
    status: caseRow.status,
    courtName: caseRow.court_name,
    state: caseRow.state ?? 'Tamil Nadu',
    district: caseRow.district ?? 'Coimbatore',
    nextHearingDate: caseRow.next_hearing_date ?? 'To be scheduled',
    presidingBench: caseRow.presiding_bench ?? 'To be assigned',
  };

  // Map hearing rows to TimelineEvent shape
  const timelineEvents: TimelineEvent[] = (hearingRows ?? []).map((h) => ({
    type: h.event_type as TimelineEvent['type'],
    title: h.title,
    date: h.hearing_date,
    status: h.status as TimelineEvent['status'],
    description: h.description ?? undefined,
  }));

  // Build reminders from upcoming / active hearings
  // Only hearings with status 'active' or 'pending' and a real date become reminders
  const reminders: Reminder[] = (hearingRows ?? [])
    .filter((h) => h.status !== 'completed' && h.hearing_date !== 'Pending')
    .map((h) => ({
      type: h.event_type === 'hearing' || h.event_type === 'scheduled'
        ? 'hearing'
        : h.event_type === 'evidence'
        ? 'document'
        : 'meeting',
      title: h.title,
      date: h.hearing_date,
      description: h.description ?? undefined,
      urgent: h.status === 'active',
    }));

  return { found: true, caseData, timelineEvents, reminders };
}
