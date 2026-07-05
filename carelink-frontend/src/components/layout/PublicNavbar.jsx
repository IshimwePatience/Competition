import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const CATEGORIES = [
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'community', label: 'Community' },
];

export default function PublicNavbar({ activeSection, onLogin, onSignUp }) {
  const navigate = useNavigate();

  const goToCategory = (id) => {
    navigate(`/#${id}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <button type="button" onClick={() => navigate('/')} className="shrink-0">
          <Logo size="md" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/symptoms')}
          className="hidden rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white sm:block"
        >
          Free Triage
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={onLogin} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Log in
          </button>
          <button
            type="button"
            onClick={onSignUp}
            className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Sign up
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => goToCategory(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeSection === id
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-gray-600 hover:bg-orange-50 hover:text-brand-orange'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
