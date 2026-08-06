import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Incidents section.
export default function IncidentsPage() {
  redirect('/hub#incidents');
}
