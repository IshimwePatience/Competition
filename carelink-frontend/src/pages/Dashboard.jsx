import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Logo from '../components/Logo';
import AuthModal from '../components/AuthModal';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import ToastStack from '../components/ToastStack';
import UserWidgets from '../components/dashboard/UserWidgets';
import WorkerWidgets from '../components/dashboard/WorkerWidgets';
import AdminWidgets from '../components/dashboard/AdminWidgets';
import RoleGuard from '../components/RoleGuard';
import FacilityCard from '../components/dashboard/FacilityCard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('facilities');
  const [activeView, setActiveView] = useState('nearby');
  const [symptoms, setSymptoms] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [reportFacility, setReportFacility] = useState(null);
  const [reportForm, setReportForm] = useState({ isOpen: true, waitTimeMinutes: 15, crowdLevel: 'moderate', notes: '' });
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    api.creditBalance().then((r) => setCredits(r.data.balance)).catch(() => {});
  }, []);

  const runTriage = async () => {
    if (!symptoms.trim()) return;
    setTriageLoading(true);
    try {
      const res = await api.triageAnalyze(symptoms);
      setTriageResult(res.data);
      setActiveTab('triage');
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
    <div className="flex min-h-screen bg-brand-page">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 flex-col">
        <Topbar activeView={activeView} onViewChange={setActiveView} />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Slides Agent / AI Triage bar — cloned from design */}
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-center text-lg font-bold">Health Agent</h2>
            <div className="flex items-end gap-3">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms... e.g. headache and fever for 2 days"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm"
              />
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-brand-peach/40 px-3 py-1 text-xs font-medium text-brand-orange">
                  {credits} Credits
                </span>
                <button
                  type="button"
                  onClick={runTriage}
                  disabled={triageLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-white hover:opacity-90 disabled:opacity-50"
                >
                  {triageLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {triageResult && (
              <div className="mt-3 rounded-xl bg-orange-50 px-4 py-3 text-sm">
                <span className="font-semibold capitalize">{triageResult.urgency} urgency</span>
                {' — '}
                Visit a <span className="font-semibold capitalize">{triageResult.recommendedFacility}</span>.
                {' '}{triageResult.reason}
              </div>
            )}
          </div>

          {/* Filters row */}
          <div className="mb-4 flex gap-3">
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
              <option>Featured</option>
              <option>Open Now</option>
            </select>
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
              <option>All Types</option>
              <option>Pharmacy</option>
              <option>Clinic</option>
              <option>Hospital</option>
              <option>Emergency</option>
            </select>
          </div>

          <RoleGuard roles={['admin']}>
            <AdminWidgets />
          </RoleGuard>

          <RoleGuard roles={['health_worker']}>
            <div className="mb-6"><WorkerWidgets /></div>
          </RoleGuard>

          <UserWidgets
            onTriage={() => setActiveTab('triage')}
            onReport={(f) => setReportFacility(f)}
          />
        </main>

        <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
          <div className="flex flex-wrap justify-center gap-4">
            <span>Guides</span>
            <span>Terms &amp; Conditions</span>
            <span>Privacy Policy</span>
            <span>Help Center</span>
          </div>
          <p className="mt-2">© 2026 CareLink</p>
        </footer>
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
