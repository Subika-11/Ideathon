import { CaseData, TimelineEvent, Reminder } from '@/types/case';

export const mockCaseData: CaseData = {
  cnr: 'TNCO123456789012',
  title: 'Property Dispute Resolution',
  petitioner: 'Sanjay R ',
  respondent: 'Municipal Corporation',
  status: 'hearing',
  courtName: 'District Court, Coimbatore',
  state: 'Tamil Nadu',
  district: 'Coimbatore',
  nextHearingDate: '15 February 2026',
  presidingBench: 'Hon. Justice M. Venkatesh'
};

export const mockTimelineEvents: TimelineEvent[] = [
  {
    type: 'filed',
    title: 'Case Filed',
    date: '12 March 2025',
    status: 'completed',
    description: 'Initial petition submitted with required documents'
  },
  {
    type: 'hearing',
    title: 'First Hearing',
    date: '28 April 2025',
    status: 'completed',
    description: 'Both parties presented preliminary arguments'
  },
  {
    type: 'evidence',
    title: 'Evidence Submitted',
    date: '15 July 2025',
    status: 'completed',
    description: 'Property documents and witness statements filed'
  },
  {
    type: 'scheduled',
    title: 'Arguments Hearing',
    date: '15 February 2026',
    status: 'active',
    description: 'Detailed arguments from both sides scheduled'
  },
  {
    type: 'order',
    title: 'Final Order',
    date: 'Pending',
    status: 'pending',
    description: 'Awaiting court decision'
  }
];

export const mockReminders: Reminder[] = [
  {
    type: 'hearing',
    title: 'Upcoming Court Hearing',
    date: '15 February 2026, 10:30 AM',
    description: 'Court Room 4, District Court Coimbatore',
    urgent: true
  },
  {
    type: 'document',
    title: 'Document Submission Deadline',
    date: '10 February 2026',
    description: 'Additional evidence documents required'
  },
  {
    type: 'meeting',
    title: 'Lawyer Consultation',
    date: '12 February 2026, 3:00 PM',
    description: 'Pre-hearing preparation meeting'
  }
];