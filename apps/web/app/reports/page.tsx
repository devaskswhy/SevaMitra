import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Reports section.
export default function ReportsPage() {
  redirect('/hub#reports');
}
