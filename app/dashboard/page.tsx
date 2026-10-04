import DashboardClient from './DashboardClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <DashboardClient />;
}
