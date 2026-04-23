// src/utils/cases.ts — Case search utility (now routes through backend API)
//
// This file used to query Supabase directly. It now delegates to the
// centralized API client which calls the FastAPI backend.

import { searchCaseByCnr as apiSearchCase } from './api';
import type { CaseData, TimelineEvent, Reminder } from '@/types/case';

/**
 * Search for a case by CNR number through the backend API.
 * Returns structured data matching the CaseData/TimelineEvent/Reminder types.
 */
export async function searchCaseByCnr(cnr: string): Promise<{
  found: boolean;
  caseData?: CaseData;
  timelineEvents?: TimelineEvent[];
  reminders?: Reminder[];
  error?: string;
}> {
  const result = await apiSearchCase(cnr);

  if (!result.found || !result.caseData) {
    return {
      found: false,
      error: result.error ?? 'No case found for this CNR number.',
    };
  }

  // Map backend response to frontend type shapes
  const caseData: CaseData = {
    cnr: result.caseData.cnr,
    title: result.caseData.title,
    petitioner: result.caseData.petitioner,
    respondent: result.caseData.respondent,
    status: result.caseData.status as CaseData['status'],
    courtName: result.caseData.courtName,
    state: result.caseData.state ?? 'Tamil Nadu',
    district: result.caseData.district ?? 'Coimbatore',
    nextHearingDate: result.caseData.nextHearingDate ?? 'To be scheduled',
    presidingBench: result.caseData.presidingBench ?? 'To be assigned',
  };

  const timelineEvents: TimelineEvent[] = (result.timelineEvents ?? []).map(
    (h: any) => ({
      type: h.type as TimelineEvent['type'],
      title: h.title,
      date: h.date,
      status: h.status as TimelineEvent['status'],
      description: h.description ?? undefined,
    })
  );

  const reminders: Reminder[] = (result.reminders ?? []).map((r: any) => ({
    type: r.type as Reminder['type'],
    title: r.title,
    date: r.date,
    description: r.description ?? undefined,
    urgent: r.urgent ?? false,
  }));

  return { found: true, caseData, timelineEvents, reminders };
}
