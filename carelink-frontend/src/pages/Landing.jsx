import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import AuthModal from '../components/AuthModal';

const img = (id, w, h) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h || w}&q=80`;

const IMG = {
  hero: img('photo-1576091160399-112ba8d25d1d', 900, 600),
  clinic: img('photo-1519494026892-80bbd2d6fd0d', 600, 400),
  pharmacy: img('photo-1584308666744-24d5c474f2ae', 600, 400),
  doctor: img('photo-1612349317150-e413f6a5b16d', 600, 400),
  nurse: img('photo-1573496359142-b8d87734a5a2', 150, 150),
  patient: img('photo-1507003211169-0a1dd7228f2d', 150, 150),
  user3: img('photo-1580489944761-15a19d654956', 150, 150),
  grid1: img('photo-1576091160399-112ba8d25d1d', 300, 300),
  grid2: img('photo-1584308666744-24d5c474f2ae', 300, 300),
  grid3: img('photo-1505751172876-fa1923c5c528', 300, 300),
  grid4: img('photo-1526256262350-7da7584cf5eb', 300, 300),
  grid5: img('photo-1579684385127-1ef15d508118', 300, 300),
  grid6: img('photo-1559839734-2b71ea197ec2', 300, 300),
  grid7: img('photo-1576091160550-2173dba999ef', 300, 300),
  grid8: img('photo-1582719478250-c89cae4dc85b', 300, 300),
  grid9: img('photo-1579154204601-01588f351e67', 300, 300),
};

const CATEGORIES = ['Pharmacy', 'Clinic', 'Hospital', 'Emergency', 'Community'];

const TESTIMONIALS = [
  {
    quote: 'CareLink saved me a wasted trip — the clinic was closed but another one 2km away had my medicine in stock.',
    name: 'John Kamau',
    role: 'Community Member, Nairobi',
    avatar: IMG.patient,
  },
  {
    quote: 'As a health worker, verifying facility data is fast. Our community finally has trustworthy clinic information.',
    name: 'Jane Mwangi',
    role: 'Verified Health Worker',
    avatar: IMG.nurse,
  },
  {
    quote: 'The AI triage told me to visit a pharmacy instead of the ER. Simple, clear, and it actually helped.',
    name: 'Mary Wanjiku',
    role: 'CareLink User',
    avatar: IMG.user3,
  },
];

const GRID_IMGS = [IMG.grid1, IMG.grid2, IMG.grid3, IMG.grid4, IMG.grid5, IMG.grid6, IMG.grid7, IMG.grid8, IMG.grid9];

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* ── HEADER (remove.bg style: Log in + Sign up pill) ── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo size="md" />

          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className="hidden rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white sm:block"
          >
            Free Triage
          </button>

          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => setAuthMode('login')} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Log in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Category nav — Petsmart row */}
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {CATEGORIES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setAuthMode('register')}
              className="shrink-0 rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main>
        {/* ── HERO — Petsmart split banner ── */}
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl bg-brand-orange lg:col-span-2">
              <div className="flex h-full min-h-[280px] flex-col justify-between p-8 sm:min-h-[320px] sm:p-10">
                <div>
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                    Find care that&apos;s actually open
                  </h1>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
                    Discover nearby clinics with live wait times, medicine stock, and AI-powered symptom triage — no more wasted trips.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="mt-6 w-fit rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-orange hover:bg-white/90"
                >
                  Get Started
                </button>
              </div>
              <img
                src={IMG.hero}
                alt="Healthcare professional"
                className="absolute bottom-0 right-0 hidden h-full w-1/2 object-cover object-center sm:block"
                style={{ maskImage: 'linear-gradient(to left, black 60%, transparent)' }}
              />
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: 'Clinics', img: IMG.clinic, sub: 'Live status & wait times' },
                { label: 'Pharmacies', img: IMG.pharmacy, sub: 'Medicine stock updates' },
              ].map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="group relative flex-1 overflow-hidden rounded-3xl bg-brand-cream text-left"
                >
                  <img src={card.img} alt={card.label} className="h-36 w-full object-cover transition group-hover:scale-105 sm:h-auto sm:min-h-[148px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-lg font-bold text-white">{card.label}</p>
                    <p className="text-xs text-white/80">{card.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS — remove.bg "They love us" ── */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              They love us. You will too.
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
                  <p className="text-sm leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-sky-100" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE — remove.bg two-column CLI section ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl shadow-soft">
              <div className="bg-gray-900 px-4 py-3 font-mono text-xs text-green-400">
                <p>$ carelink triage &quot;headache and fever for 2 days&quot;</p>
                <p className="mt-1 text-yellow-300">urgency: medium</p>
                <p className="text-yellow-300">facility: clinic</p>
                <p className="text-gray-400">reason: Same-day evaluation recommended</p>
              </div>
              <img src={IMG.doctor} alt="Doctor" className="h-64 w-full object-cover" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">For patients and communities</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                AI triage in seconds, not hours
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Know how urgent your symptoms are before you travel</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Get routed to pharmacy, clinic, hospital, or emergency</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Powered by Google Gemini — structured, safe routing only</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Works on any device — mobile-first design</li>
              </ul>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="mt-8 flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Try AI Triage
              </button>
            </div>
          </div>
        </section>

        {/* ── CTA — remove.bg "Get in touch" + 3x3 grid ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Serving 100+ communities?</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Partner with CareLink for your region
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Community-verified facility data you can trust</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Health workers earn credits for accurate reports</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Real-time notifications for campaigns & alerts</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />Free screenings redeemable with health credits</li>
              </ul>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="mt-8 flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Join as Health Worker
              </button>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 p-4 shadow-soft">
              <div className="grid grid-cols-3 gap-2">
                {GRID_IMGS.map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-white">
                    <img src={src} alt="" className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
            <span>Guides</span>
            <span>Terms &amp; Conditions</span>
            <span>Privacy Policy</span>
            <span>Help Center</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 CareLink — Health &amp; Community Wellbeing</p>
        </div>
      </footer>

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
