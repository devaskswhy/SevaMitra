import { redirect } from 'next/navigation';

// Folded into the single-scroll /hub as the Zone Map section.
export default function MapPage() {
  redirect('/hub#zone-map');
}
