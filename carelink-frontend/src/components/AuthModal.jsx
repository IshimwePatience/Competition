import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function EyeIcon({ off }) {
  return off ? (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function AuthModal({ mode: initialMode = 'register', accountType: initialAccountType = 'user', onClose, onSuccess, initialError = '' }) {
  const [mode, setMode] = useState(initialMode);
  const [accountType, setAccountType] = useState(initialAccountType);
  const [step, setStep] = useState(1);
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    facilityName: '',
    facilityType: 'clinic',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    openingHours: 'Mon-Fri 8:00-17:00',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const resetForm = () => {
    setStep(1);
    setError('');
    setFieldErrors({});
    setAccepted(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'login') setAccountType('user');
    resetForm();
  };

  const inputClass = (field) =>
    `w-full rounded-xl border px-4 py-3 text-sm transition-colors ${
      fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`;

  const validateStep1 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name required';
    if (!form.lastName.trim()) errs.lastName = 'Last name required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isFacility = accountType === 'facility';
  const totalSteps = isFacility ? 3 : 2;
  const credentialStep = isFacility ? 3 : 2;

  const validateFacilityStep = () => {
    const errs = {};
    if (!form.facilityName.trim()) errs.facilityName = 'Facility name required';
    if (!form.address.trim()) errs.address = 'Address required';
    if (!form.latitude || !form.longitude) errs.location = 'Use location or enter coordinates';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCredentials = () => {
    const errs = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!accepted) errs.terms = 'You must accept the terms';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLogin = () => {
    const errs = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
      return;
    }
    if (step === 2 && isFacility && validateFacilityStep()) {
      setStep(3);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({
        ...f,
        latitude: String(pos.coords.latitude),
        longitude: String(pos.coords.longitude),
      })),
      () => setError('Could not get your location')
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateCredentials()) return;

    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      };
      if (isFacility) {
        Object.assign(payload, {
          accountType: 'facility',
          facilityName: form.facilityName,
          facilityType: form.facilityType,
          address: form.address,
          phone: form.phone,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          openingHours: form.openingHours,
        });
      }
      await register(payload);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateLogin()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>

        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
          {mode === 'register'
            ? (isFacility ? 'Register your facility' : 'Get started with CareLink')
            : 'Welcome back'}
        </h2>

        {mode === 'register' && (
          <p className="mb-6 text-center text-xs text-gray-400">
            Step {step} of {totalSteps}
          </p>
        )}

        {mode === 'register' && step === 1 && !isFacility && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* ── REGISTER STEP 1: name fields stacked vertically ── */}
        {mode === 'register' && step === 1 && (
          <form onSubmit={handleNext} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={inputClass('firstName')}
              />
              {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={inputClass('lastName')}
              />
              {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-brand-peach py-3.5 text-sm font-semibold text-white transition hover:bg-brand-peachHover"
            >
              Next
            </button>
          </form>
        )}

        {/* ── REGISTER STEP 2: email + password stacked vertically ── */}
        {mode === 'register' && step === 2 && isFacility && (
          <form onSubmit={handleNext} className="space-y-3">
            <input type="text" placeholder="Facility name" value={form.facilityName} onChange={(e) => setForm({ ...form, facilityName: e.target.value })} className={inputClass('facilityName')} />
            {fieldErrors.facilityName && <p className="text-xs text-red-500">{fieldErrors.facilityName}</p>}
            <select value={form.facilityType} onChange={(e) => setForm({ ...form, facilityType: e.target.value })} className={inputClass('facilityType')}>
              <option value="clinic">Clinic</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
            <input type="text" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass('address')} />
            {fieldErrors.address && <p className="text-xs text-red-500">{fieldErrors.address}</p>}
            <input type="text" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass('phone')} />
            <button type="button" onClick={useMyLocation} className="w-full rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50">
              Use my location
            </button>
            {fieldErrors.location && <p className="text-xs text-red-500">{fieldErrors.location}</p>}
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={() => { setStep(1); setFieldErrors({}); }} className="w-1/3 rounded-xl border border-gray-200 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>
              <button type="submit" className="flex-1 rounded-xl bg-brand-peach py-3.5 text-sm font-semibold text-white transition hover:bg-brand-peachHover">Next</button>
            </div>
          </form>
        )}

        {mode === 'register' && step === credentialStep && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass('email')}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClass('password')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <EyeIcon off={showPassword} />
              </button>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
            </div>

            <label className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-sm text-gray-600">
                I accept the{' '}
                <span className="text-brand-orange">Terms and Conditions</span>
              </span>
            </label>
            {fieldErrors.terms && <p className="text-xs text-red-500">{fieldErrors.terms}</p>}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(isFacility ? 2 : 1); setFieldErrors({}); }}
                className="w-1/3 rounded-xl border border-gray-200 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-brand-peach py-3.5 text-sm font-semibold text-white transition hover:bg-brand-peachHover disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Please wait...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── LOGIN: single step ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mb-1 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass('email')}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClass('password')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <EyeIcon off={showPassword} />
              </button>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-brand-peach py-3.5 text-sm font-semibold text-white transition hover:bg-brand-peachHover disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Please wait...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-gray-600">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} className="font-medium text-brand-orange hover:underline">
                Login here
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => switchMode('register')} className="font-medium text-brand-orange hover:underline">
                Create account
              </button>
            </>
          )}
        </p>

        {mode === 'register' && (
          <p className="mt-2 text-center text-xs text-gray-400">
            {isFacility ? (
              <>
                Individual account?{' '}
                <button type="button" onClick={() => { setAccountType('user'); resetForm(); }} className="text-brand-orange hover:underline">
                  Register as user
                </button>
              </>
            ) : (
              <>
                Clinic or pharmacy?{' '}
                <button type="button" onClick={() => { setAccountType('facility'); resetForm(); }} className="text-brand-orange hover:underline">
                  Register your facility
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
