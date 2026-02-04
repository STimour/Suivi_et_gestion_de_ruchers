'use client';

import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const RucherMiniMap = dynamic(
  () => import('./RucherMiniMap').then((mod) => mod.RucherMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-amber-100/50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600">Chargement...</div>
      </div>
    ),
  }
);

interface RucherMiniMapWrapperProps {
  latitude: number;
  longitude: number;
  nom: string;
}

export function RucherMiniMapWrapper(props: RucherMiniMapWrapperProps) {
  return <RucherMiniMap {...props} />;
}
