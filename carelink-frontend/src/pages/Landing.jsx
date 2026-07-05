import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import AuthModal from '../components/AuthModal';
import FacilityCard from '../components/dashboard/FacilityCard';

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen bg-brand-page">
      {/* Sidebar clone */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-100 bg-brand-sidebar px-4 py-5">
        <div className="mb-8 px-2"><Logo /></div>
        <nav className="space-y-1 text-sm text-gray-500">
          <p className="rounded-xl px-3 py-2.5">AI Triage</p>
          <p className="rounded-xl px-3 py-2.5">My Facilities</p>
          <p className="rounded-xl px-3 py-2.5">My Reports</p>
        </nav>
        <div className="mt-auto rounded-xl bg-white p-3 shadow-sm">
          <button type="button" onClick={() => setAuthMode('login')} className="flex w-full items-center gap-2 text-sm text-gray-600">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            Log in
            <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex gap-8">
            <span className="border-b-2 border-brand-orange pb-1 text-sm font-semibold">Nearby Facilities</span>
            <span className="text-sm text-gray-400">My Activity</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg p-2 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Log in
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-center text-lg font-bold">Health Agent</h2>
            <p className="text-center text-sm text-gray-400">Sign in to describe symptoms and get AI triage guidance</p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="rounded-xl bg-brand-peach px-8 py-3 text-sm font-semibold text-white hover:bg-brand-peachHover"
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="mb-4 flex gap-3">
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600"><option>Featured</option></select>
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600"><option>All Types</option></select>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-sm text-gray-400 hover:border-brand-orange hover:text-brand-orange"
            >
              <span className="mb-2 text-3xl">+</span>
              Create account to explore
            </button>
            {['Pharmacy', 'Clinic', 'Hospital', 'Emergency'].map((type) => (
              <div key={type} className="overflow-hidden rounded-2xl border border-gray-100 bg-white opacity-60">
                <div className="flex h-36 items-end bg-gradient-to-br from-gray-300 to-gray-400 p-4">
                  <p className="text-sm font-bold text-white">{type}</p>
                </div>
                <div className="p-4"><p className="text-xs text-gray-400">Sign in to view live status</p></div>
              </div>
            ))}
          </div>
        </main>

        <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
          © 2026 CareLink
        </footer>
      </div>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={() => setAuthMode(null)}
        />
      )}
    </div>
  );
}
