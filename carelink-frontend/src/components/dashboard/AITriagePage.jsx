import RoleGuard from '../RoleGuard';
import AdminWidgets from './AdminWidgets';

export default function AITriagePage({
  symptoms,
  setSymptoms,
  triageResult,
  triageLoading,
  credits,
  onRunTriage,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Health Agent</h2>
        <p className="mt-1 text-sm text-gray-500">
          Describe your symptoms and AI will tell you how urgent they are and whether to visit a pharmacy, clinic, hospital, or emergency room.
        </p>

        <div className="mt-5 flex items-end gap-3">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms... e.g. headache and fever for 2 days"
            rows={3}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-brand-peach/40 px-3 py-1 text-xs font-medium text-brand-orange">
              {credits} Credits
            </span>
            <button
              type="button"
              onClick={onRunTriage}
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
          <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm">
            <span className="font-semibold capitalize">{triageResult.urgency} urgency</span>
            {' — '}
            Visit a <span className="font-semibold capitalize">{triageResult.recommendedFacility}</span>.
            {' '}{triageResult.reason}
          </div>
        )}
      </div>

      <RoleGuard roles={['admin']}>
        <AdminWidgets page="triage" />
      </RoleGuard>
    </div>
  );
}
