export type CaseStatus = 'active' | 'hearing' | 'closed';

export type TimelineEventType = 'filed' | 'hearing' | 'evidence' | 'scheduled' | 'order';

export type TimelineEventStatus = 'completed' | 'active' | 'pending';

export type ReminderType = 'hearing' | 'document' | 'meeting';

export interface CaseData {
  cnr: string;
  title: string;
  petitioner: string;
  respondent: string;
  status: CaseStatus;
  courtName: string;
  state: string;
  district: string;
  nextHearingDate: string;
  presidingBench: string;
}

export interface TimelineEvent {
  type: TimelineEventType;
  title: string;
  date: string;
  status: TimelineEventStatus;
  description?: string;
}

export interface Reminder {
  type: ReminderType;
  title: string;
  date: string;
  description?: string;
  urgent?: boolean;
}
