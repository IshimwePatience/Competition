import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function ProfileField({
  label,
  value,
  placeholder,
  editing,
  onEdit,
  onCancel,
  onSave,
  busy,
  children,
}) {
  return (
    <section className="mb-8">
      <h3 className="text-sm font-bold text-gray-800">{label}</h3>
      {!editing ? (
        <div className="mt-2 flex items-stretch gap-3">
          <div className="flex min-h-[44px] flex-1 items-center rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-500">
            {value || placeholder}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-md border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="mt-2">
          {children}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="rounded-md bg-brand-peach px-5 py-2 text-sm font-semibold text-white hover:bg-brand-peachHover disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-md bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

const inputClass = 'w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200';

export default function FacilityProfilePage() {
  const [profile, setProfile] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);

  const load = () =>
    api.myFacility().then((res) => {
      const data = {
        name: res.data.name,
        type: res.data.type,
        address: res.data.address,
        phone: res.data.phone || '',
        openingHours: res.data.openingHours || '',
        latitude: res.data.latitude,
        longitude: res.data.longitude,
      };
      setProfile(data);
      setDraft(data);
      return data;
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const startEdit = (field) => {
    setDraft({ ...profile });
    setEditing(field);
    setMsg('');
  };

  const cancelEdit = () => {
    setDraft({ ...profile });
    setEditing(null);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.updateMyFacility(draft);
      const data = {
        name: res.data.name,
        type: res.data.type,
        address: res.data.address,
        phone: res.data.phone || '',
        openingHours: res.data.openingHours || '',
        latitude: res.data.latitude,
        longitude: res.data.longitude,
      };
      setProfile(data);
      setDraft(data);
      setEditing(null);
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err.message || 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setDraft((d) => ({
        ...d,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })),
      () => setMsg('Could not get your location')
    );
  };

  const locationLabel = () => {
    if (profile.latitude != null && profile.longitude != null) {
      return `${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'Facility Profile'}</h1>
      {msg && <p className="mt-2 text-xs text-gray-500">{msg}</p>}

      <div className="mt-8">
        <ProfileField
          label="Facility Name"
          value={profile.name}
          placeholder="No facility name set"
          editing={editing === 'name'}
          onEdit={() => startEdit('name')}
          onCancel={cancelEdit}
          onSave={save}
          busy={busy}
        >
          <input
            className={inputClass}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Facility name"
          />
        </ProfileField>

        <ProfileField
          label="Facility Type"
          value={profile.type ? profile.type.charAt(0).toUpperCase() + profile.type.slice(1) : ''}
          placeholder="Not specified"
          editing={editing === 'type'}
          onEdit={() => startEdit('type')}
          onCancel={cancelEdit}
          onSave={save}
          busy={busy}
        >
          <select
            className={inputClass}
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          >
            <option value="clinic">Clinic</option>
            <option value="pharmacy">Pharmacy</option>
          </select>
        </ProfileField>

        <ProfileField
          label="Address"
          value={profile.address}
          placeholder="Not specified"
          editing={editing === 'address'}
          onEdit={() => startEdit('address')}
          onCancel={cancelEdit}
          onSave={save}
          busy={busy}
        >
          <input
            className={inputClass}
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            placeholder="Address"
          />
        </ProfileField>

        <ProfileField
          label="Phone"
          value={profile.phone}
          placeholder="Not specified"
          editing={editing === 'phone'}
          onEdit={() => startEdit('phone')}
          onCancel={cancelEdit}
          onSave={save}
          busy={busy}
        >
          <input
            className={inputClass}
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            placeholder="Phone number"
          />
        </ProfileField>

        <ProfileField
          label="Opening Hours"
          value={profile.openingHours}
          placeholder="Not specified"
          editing={editing === 'hours'}
          onEdit={() => startEdit('hours')}
          onCancel={cancelEdit}
          onSave={save}
          busy={busy}
        >
          <input
            className={inputClass}
            value={draft.openingHours}
            onChange={(e) => setDraft({ ...draft, openingHours: e.target.value })}
            placeholder="e.g. Mon-Fri 8:00-17:00"
          />
        </ProfileField>

        <ProfileField
          label="Location"
          value={locationLabel()}
          placeholder="Not specified"
          editing={editing === 'location'}
          onEdit={() => startEdit('location')}
          onCancel={cancelEdit}
          onSave={save}
          busy={busy}
        >
          <div className="space-y-3">
            <button
              type="button"
              onClick={useMyLocation}
              className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50"
            >
              Update location from GPS
            </button>
            {draft.latitude != null && draft.longitude != null && (
              <p className="text-xs text-gray-400">
                {Number(draft.latitude).toFixed(4)}, {Number(draft.longitude).toFixed(4)}
              </p>
            )}
          </div>
        </ProfileField>
      </div>
    </div>
  );
}
