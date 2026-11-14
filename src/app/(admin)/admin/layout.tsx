import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { getCurrentUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');
  if (!user.permissions.includes('reports.view') && !user.permissions.includes('catalogue.view') && !user.permissions.includes('pos.use')) {
    redirect('/account?error=admin-access-required');
  }
  return <AdminShell user={{ name: user.name, email: user.email, roles: user.roles }}>{children}</AdminShell>;
}
