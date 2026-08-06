import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Shifts section.
export default function ShiftsPage() {
  redirect('/hub#shifts');
}
