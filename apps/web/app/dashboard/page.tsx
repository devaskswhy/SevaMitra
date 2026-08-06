import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub — no dedicated Dashboard section
// exists there, so this just lands on the top of /hub.
export default function DashboardPage() {
  redirect('/hub');
}
