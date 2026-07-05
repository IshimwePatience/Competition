import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Logo from '../components/Logo';
import { COMMON_SYMPTOMS } from '../constants/health';

export default function SymptomTriagePage() {
  const [symptoms, setSymptoms] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const toggle = (symptom) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const submit = async () => {
    if (symptoms.length === 0) {
      setError('Select at least one symptom');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.triagePublic({
        symptoms,
        ...(coords || {}),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Could not analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  const facility = result?.matchedFacility;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo />
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-800">Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Check your symptoms</h1>
        <p className="mt-1 text-sm text-gray-500">No account needed — we&apos;ll find nearby care with medicine in stock.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-brand-peach bg-white shadow-card">
          <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-3">
            {COMMON_SYMPTOMS.map((s) => (
              <label key={s} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${symptoms.includes(s) ? 'border-brand-orange bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-600'}`}>
                <input type="checkbox" className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange" checked={symptoms.includes(s)} onChange={() => toggle(s)} />
                {s}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-4 border-t border-brand-peach/50 px-4 py-3">
            {error && <span className="mr-auto text-xs text-red-500">{error}</span>}
            <button
              type="button"
              onClick={submit}
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

        {result && (
          <div className="mt-6 space-y-4 rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-700">
              <span className="font-semibold capitalize">{result.urgency} urgency</span>
              {' — '}{result.reason}
            </p>
            <p className="text-sm text-gray-600">
              Recommended: <span className="font-semibold capitalize">{result.recommendedFacility}</span>
              {result.likelyMedicineCategory && (
                <> · May need: <span className="font-semibold capitalize">{result.likelyMedicineCategory}</span></>
              )}
            </p>

            {facility ? (
              <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
                <p className="font-semibold text-gray-900">{facility.name}</p>
                <p className="text-gray-600">{facility.address}</p>
                <p className="mt-1 text-gray-500">
                  {facility.distanceKm != null ? `${facility.distanceKm} km away` : 'Nearby'}
                  {result.stockConfirmed ? ' · Medicine likely in stock' : ' · Stock not confirmed — call ahead'}
                </p>
                <a
                  className="mt-2 inline-block text-brand-orange hover:underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No nearby facility found. Try again with location enabled.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
