'use client';

import dynamic from 'next/dynamic';

// SevaSahayak's floating-widget mode used to be mounted per-page (only on
// the old homepage). Promoted here so it's visible on every route —
// layout.tsx is a Server Component, so the ssr:false dynamic import needs
// to live in its own client boundary, same reason AuthProvider exists.
const SevaSahayakFloat = dynamic(() => import('@/components/SevaSahayak'), { ssr: false });

export default function GlobalChatWidget() {
  return <SevaSahayakFloat isInline={false} />;
}
