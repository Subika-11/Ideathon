import Navigation from './Navigation';
import { useTranslation } from 'react-i18next';

export default function CaseDetails({ caseId, onBack }: { caseId: string; onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Navigation currentPage={'tracking'} onNavigate={(p) => p && null} />

      <section className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="text-sm text-slate-600 hover:underline mb-4">← Back to Tracking</button>

        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Case Details</h1>
          <p className="text-sm text-slate-500 mb-6">Case ID: <span className="font-montserrat">{caseId}</span></p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold">Parties</h3>
              <p className="text-sm text-slate-700 mt-2">Ram Prasad Sharma vs Shyam Lal Verma</p>
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-semibold">Next Hearing</h3>
              <p className="text-sm text-slate-700 mt-2">15 Jan 2026 — 10:00 AM</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Progress</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
              <li>Case filed: 15 Mar 2024</li>
              <li>First hearing: 20 May 2024</li>
              <li>Evidence submitted: 22 Dec 2025</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
