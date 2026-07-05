import RoleGuard from '../RoleGuard';
import AdminWidgets from './AdminWidgets';
import UserFacilities from './UserFacilities';
import WorkerFacilities from './WorkerFacilities';

export default function FacilitiesPage({ onReport }) {
  return (
    <div className="space-y-6">
      <RoleGuard roles={['admin']}>
        <AdminWidgets page="facilities" />
      </RoleGuard>

      <RoleGuard roles={['health_worker']}>
        <WorkerFacilities />
      </RoleGuard>

      <RoleGuard roles={['user']}>
        <UserFacilities onReport={onReport} />
      </RoleGuard>
    </div>
  );
}
