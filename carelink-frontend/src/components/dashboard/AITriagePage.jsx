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
      <div>
        <h2 className="text-lg font-bold text-gray-900">Health Agent</h2>
        <p className="mt-1 text-sm text-gray-500">
          Describe your symptoms and AI will tell you how urgent they are and whether to visit a pharmacy, clinic, hospital, or emergency room.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-peach bg-white shadow-card">
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe your symptoms... e.g. headache and fever for 2 days"
          rows={4}
          className="w-full resize-none border-0 bg-transparent px-5 py-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        />
        <div className="flex items-center justify-end gap-4 border-t border-brand-peach/50 px-4 py-3">
          <span className="text-[14px] text-gray-400">{credits} Credits</span>
          <button
            type="button"
            onClick={onRunTriage}
            disabled={triageLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white hover:opacity-90 disabled:opacity-50"
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
        <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
          <span className="font-semibold capitalize">{triageResult.urgency} urgency</span>
          {' — '}
          Visit a <span className="font-semibold capitalize">{triageResult.recommendedFacility}</span>.
          {' '}{triageResult.reason}
        </div>
      )}
    </div>
  );
}
