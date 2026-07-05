import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ roles, children, fallback = null }) {
  const { role } = useAuth();
  if (!roles.includes(role)) return fallback;
  return children;
}
