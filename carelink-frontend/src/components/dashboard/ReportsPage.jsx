import RoleGuard from '../RoleGuard';
import AdminWidgets from './AdminWidgets';
import UserReports from './UserReports';
import WorkerReports from './WorkerReports';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <RoleGuard roles={['admin']}>
        <AdminWidgets page="reports" />
      </RoleGuard>

      <RoleGuard roles={['health_worker']}>
        <WorkerReports />
      </RoleGuard>

      <RoleGuard roles={['user']}>
        <UserReports />
      </RoleGuard>
    </div>
  );
}
