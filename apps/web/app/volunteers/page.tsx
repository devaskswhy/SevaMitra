import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Volunteers section.
export default function VolunteersPage() {
  redirect('/hub#volunteers');
}
