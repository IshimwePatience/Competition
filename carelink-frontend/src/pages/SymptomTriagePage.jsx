import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AuthModal from '../components/AuthModal';
import PublicNavbar from '../components/layout/PublicNavbar';
import { COMMON_SYMPTOMS } from '../constants/health';

const TAB_SYMPTOMS = 'symptoms';
const TAB_MEDICINES = 'medicines';

function FacilityCard({ facility, stockLabel }) {
  return (
    <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900">{facility.name}</p>
      <p className="text-gray-600">{facility.address}</p>
      {facility.phone && <p className="text-gray-500">{facility.phone}</p>}
      {stockLabel && <p className="mt-1 text-gray-500">{stockLabel}</p>}
      {facility.matchedMedicines?.length > 0 && (
        <p className="mt-1 text-gray-600">
          In stock: {facility.matchedMedicines.map((m) => m.name || m).join(', ')}
        </p>
      )}
      {facility.latitude != null && facility.longitude != null && (
        <a
          className="mt-2 inline-block text-brand-orange hover:underline"
          href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
          target="_blank"
          rel="noreferrer"
        >
          Open in Maps
        </a>
      )}
    </div>
  );
}

export default function SymptomTriagePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null);
  const [authAccountType, setAuthAccountType] = useState('facility');
  const [tab, setTab] = useState(TAB_SYMPTOMS);

  const [symptoms, setSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [medicineText, setMedicineText] = useState('');
  const [loading, setLoading] = useState(false);
  const [symptomResult, setSymptomResult] = useState(null);
  const [medicineResult, setMedicineResult] = useState(null);
  const [medicinePrompts, setMedicinePrompts] = useState([]);
  const [resolvedMedicines, setResolvedMedicines] = useState([]);
  const [medicineChoices, setMedicineChoices] = useState({});
  const [error, setError] = useState('');

  const toggle = (symptom) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    const value = customSymptom.trim();
    if (!value) return;
    setSymptoms((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomSymptom('');
  };

  const submitSymptoms = async () => {
    if (symptoms.length === 0) {
      setError('Select or add at least one symptom');
      return;
    }
    setError('');
    setLoading(true);
    setSymptomResult(null);
    try {
      const res = await api.triagePublic({ symptoms });
      setSymptomResult(res.data);
    } catch (err) {
      setError(err.message || 'Could not analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  const runMedicineSearch = async (medicines) => {
    setLoading(true);
    setMedicineResult(null);
    try {
      const res = await api.triageFindMedicines({ medicines });
      const data = res.data;
      if (data.status === 'results') {
        setMedicineResult(data);
        setMedicinePrompts([]);
        setResolvedMedicines([]);
        setMedicineChoices({});
      } else {
        setError(data.message || 'Could not search medicines');
      }
    } catch (err) {
      setError(err.message || 'Could not search medicines');
    } finally {
      setLoading(false);
    }
  };

  const submitMedicines = async () => {
    if (!medicineText.trim()) {
      setError('Enter the medicine names your doctor or hospital gave you');
      return;
    }
    setError('');
    setLoading(true);
    setMedicineResult(null);
    setMedicinePrompts([]);
    setResolvedMedicines([]);
    setMedicineChoices({});
    try {
      const res = await api.triageFindMedicines({ medicineText: medicineText.trim() });
      const data = res.data;

      if (data.status === 'confirm') {
        setMedicinePrompts(data.prompts || []);
        setResolvedMedicines(data.resolved || []);
        setMedicineChoices({});
      } else if (data.status === 'unrecognized') {
        setError(data.message || 'Please check the medicine spelling and try again');
      } else if (data.status === 'results') {
        setMedicineResult(data);
      } else {
        setMedicineResult(data);
      }
    } catch (err) {
      setError(err.message || 'Could not search medicines');
    } finally {
      setLoading(false);
    }
  };

  const chooseMedicineSuggestion = async (typed, choice) => {
    const nextChoices = { ...medicineChoices, [typed]: choice };
    const remaining = medicinePrompts.filter((p) => p.typed !== typed);
    setMedicineChoices(nextChoices);
    setMedicinePrompts(remaining);
    setError('');

    if (remaining.length > 0) return;

    const allMedicines = [
      ...resolvedMedicines,
      ...Object.values(nextChoices),
    ];
    await runMedicineSearch(allMedicines);
  };

  const rejectMedicineSuggestion = (typed) => {
    setMedicinePrompts([]);
    setResolvedMedicines([]);
    setMedicineChoices({});
    setMedicineResult(null);
    setError(`We couldn't find a match for "${typed}". Please check the spelling and enter the correct medicine name.`);
  };

  const switchTab = (next) => {
    setTab(next);
    setError('');
    setSymptomResult(null);
    setMedicineResult(null);
    setMedicinePrompts([]);
    setResolvedMedicines([]);
    setMedicineChoices({});
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const facilities =
    tab === TAB_SYMPTOMS
      ? symptomResult?.facilityMatches?.length
        ? symptomResult.facilityMatches
        : symptomResult?.matchedFacility
          ? [symptomResult.matchedFacility, ...(symptomResult.alternativeFacilities || [])]
          : []
      : medicineResult?.facilities || [];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <PublicNavbar
        onLogin={() => setAuthMode('login')}
        onSignUp={() => {
          setAuthAccountType('facility');
          setAuthMode('register');
        }}
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Check your symptoms</h1>
        <p className="mt-1 text-sm text-gray-500">
          No account needed — we&apos;ll find care with medicine in stock.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => switchTab(TAB_SYMPTOMS)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === TAB_SYMPTOMS ? 'bg-brand-orange text-white' : 'border border-gray-200 text-gray-600 hover:border-brand-orange'}`}
          >
            Symptoms
          </button>
          <button
            type="button"
            onClick={() => switchTab(TAB_MEDICINES)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === TAB_MEDICINES ? 'bg-brand-orange text-white' : 'border border-gray-200 text-gray-600 hover:border-brand-orange'}`}
          >
            Find medicine
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-brand-peach bg-white shadow-card">
          {tab === TAB_SYMPTOMS ? (
            <>
              <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-3">
                {COMMON_SYMPTOMS.map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${symptoms.includes(s) ? 'border-brand-orange bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-600'}`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                      checked={symptoms.includes(s)}
                      onChange={() => toggle(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
              <div className="border-t border-brand-peach/50 px-5 py-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Add another symptom</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
                    placeholder="e.g. itchy skin, back pain"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={addCustomSymptom}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-brand-orange"
                  >
                    Add
                  </button>
                </div>
                {symptoms.filter((s) => !COMMON_SYMPTOMS.includes(s)).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {symptoms
                      .filter((s) => !COMMON_SYMPTOMS.includes(s))
                      .map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs text-gray-700"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => toggle(s)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label={`Remove ${s}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-5">
              <p className="mb-2 text-sm text-gray-600">
                Type the medicines a doctor or hospital told you to find. Separate with commas.
              </p>
              <textarea
                value={medicineText}
                onChange={(e) => {
                  setMedicineText(e.target.value);
                  setMedicinePrompts([]);
                  setResolvedMedicines([]);
                  setMedicineChoices({});
                  setMedicineResult(null);
                }}
                rows={4}
                placeholder="e.g. Paracetamol, Amoxicillin, Ibuprofen"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-4 border-t border-brand-peach/50 px-4 py-3">
            {error && <span className="mr-auto text-xs text-red-500">{error}</span>}
            <button
              type="button"
              onClick={tab === TAB_SYMPTOMS ? submitSymptoms : submitMedicines}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {tab === TAB_MEDICINES && medicinePrompts.length > 0 && (
          <div className="mt-4 space-y-3">
            {medicinePrompts.map((prompt) => (
              <div
                key={prompt.typed}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
              >
                <p className="text-sm text-gray-700">
                  You typed <span className="font-semibold text-gray-900">&quot;{prompt.typed}&quot;</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">Did you mean one of these?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {prompt.suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      disabled={loading}
                      onClick={() => chooseMedicineSuggestion(prompt.typed, name)}
                      className="rounded-full border border-brand-orange bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-orange-50 disabled:opacity-50"
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => rejectMedicineSuggestion(prompt.typed)}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    None of these
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === TAB_SYMPTOMS && symptomResult && (
          <div className="mt-6 space-y-4 rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-700">
              <span className="font-semibold capitalize">{symptomResult.urgency} urgency</span>
              {' — '}{symptomResult.reason}
            </p>
            <p className="text-sm text-gray-600">
              Recommended: <span className="font-semibold capitalize">{symptomResult.recommendedFacility}</span>
              {symptomResult.likelyMedicineCategory && (
                <> · May need: <span className="font-semibold capitalize">{symptomResult.likelyMedicineCategory}</span></>
              )}
            </p>

            {facilities.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Facilities with matching stock</p>
                {facilities.map((f) => (
                  <FacilityCard
                    key={f.id}
                    facility={f}
                    stockLabel={
                      f.stockConfirmed || symptomResult.stockConfirmed
                        ? f.matchedMedicine
                          ? `Has ${f.matchedMedicine} in stock`
                          : 'Medicine likely in stock'
                        : 'Stock not confirmed — call ahead'
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No facilities found with matching stock yet.</p>
            )}
          </div>
        )}

        {tab === TAB_MEDICINES && medicineResult?.status === 'results' && (
          <div className="mt-6 space-y-4 rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-700">{medicineResult.message}</p>
            {medicineResult.medicines?.length > 0 && (
              <p className="text-sm text-gray-600">
                Searched for: <span className="font-semibold">{medicineResult.medicines.join(', ')}</span>
              </p>
            )}

            {facilities.length > 0 ? (
              <div className="space-y-3">
                {facilities.map((f) => (
                  <FacilityCard
                    key={f.id}
                    facility={f}
                    stockLabel={`${f.matchCount} of ${medicineResult.medicines.length} medicine${medicineResult.medicines.length > 1 ? 's' : ''} in stock`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No facilities currently list these medicines. Please check the medicine name and try again.
              </p>
            )}
          </div>
        )}
      </main>

      {authMode && (
        <AuthModal
          key={`${authMode}-${authAccountType}`}
          mode={authMode}
          accountType={authAccountType}
          onClose={() => {
            setAuthMode(null);
            setAuthAccountType('facility');
          }}
          onSuccess={() => {
            setAuthMode(null);
            setAuthAccountType('facility');
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
}
