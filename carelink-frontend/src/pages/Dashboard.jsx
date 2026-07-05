import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import ToastStack from '../components/ToastStack';
import AITriagePage from '../components/dashboard/AITriagePage';
import FacilitiesPage from '../components/dashboard/FacilitiesPage';
import ReportsPage from '../components/dashboard/ReportsPage';
import UsersPage from '../components/dashboard/UsersPage';
import RoleGuard from '../components/RoleGuard';

const PAGE_META = {
  triage: { title: 'AI Triage', subtitle: 'Health Agent' },
  facilities: { title: 'My Facilities', subtitle: 'Facilities' },
  reports: { title: 'My Reports', subtitle: 'Reports' },
  users: { title: 'Platform Users', subtitle: 'Users' },
};

export default function Dashboard() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('triage');
  const [symptoms, setSymptoms] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [reportFacility, setReportFacility] = useState(null);
  const [reportForm, setReportForm] = useState({ isOpen: true, waitTimeMinutes: 15, crowdLevel: 'moderate', notes: '' });
  const [credits, setCredits] = useState(0);

  const meta = PAGE_META[activeTab];

  useEffect(() => {
    api.creditBalance().then((r) => setCredits(r.data.balance)).catch(() => {});
  }, []);

  const runTriage = async () => {
    if (!symptoms.trim()) return;
    setTriageLoading(true);
    try {
      const res = await api.triageAnalyze(symptoms);
      setTriageResult(res.data);
    } finally {
      setTriageLoading(false);
    }
  };

  const submitReport = async () => {
    if (!reportFacility) return;
    await api.submitReport(reportFacility.id, reportForm);
    setReportFacility(null);
    const r = await api.creditBalance();
    setCredits(r.data.balance);
  };

  return (
    <div className="h-screen overflow-hidden bg-brand-page">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex h-screen flex-col pl-56">
        {activeTab !== 'users' && (
          <Topbar
            pageTitle={meta.title}
            pageSubtitle={meta.subtitle}
            showSearch={activeTab === 'facilities'}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${activeTab === 'users' ? 'bg-white' : 'bg-gray-50/50 px-6 py-6'}`}>
          {activeTab === 'triage' && (
            <AITriagePage
              symptoms={symptoms}
              setSymptoms={setSymptoms}
              triageResult={triageResult}
              triageLoading={triageLoading}
              credits={credits}
              onRunTriage={runTriage}
            />
          )}

          {activeTab === 'facilities' && (
            <FacilitiesPage onReport={setReportFacility} />
          )}

          {activeTab === 'reports' && (
            <ReportsPage />
          )}

          {activeTab === 'users' && (
            <RoleGuard roles={['admin']}>
              <UsersPage />
            </RoleGuard>
          )}
        </main>
      </div>

      {reportFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Report: {reportFacility.name}</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs">Open?
                <select value={reportForm.isOpen} onChange={(e) => setReportForm({ ...reportForm, isOpen: e.target.value === 'true' })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="block text-xs">Wait time (min)
                <input type="number" value={reportForm.waitTimeMinutes} onChange={(e) => setReportForm({ ...reportForm, waitTimeMinutes: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block text-xs">Crowd level
                <select value={reportForm.crowdLevel} onChange={(e) => setReportForm({ ...reportForm, crowdLevel: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>
              <textarea placeholder="Notes (optional)" value={reportForm.notes} onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setReportFacility(null)} className="flex-1 rounded-xl border py-2 text-sm">Cancel</button>
              <button type="button" onClick={submitReport} className="flex-1 rounded-xl bg-brand-peach py-2 text-sm font-semibold text-white">Submit Report</button>
            </div>
          </div>
        </div>
      )}

      <ToastStack />
    </div>
  );
}
