import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Zones section.
export default function ZonesPage() {
  redirect('/hub#zones');
}
