'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Import dynamique du LocationPicker pour éviter les erreurs SSR avec Leaflet
const LocationPicker = dynamic(
  () => import('./LocationPicker').then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-amber-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement de la carte...</span>
        </div>
      </div>
    ),
  }
);

interface LocationPickerWrapperProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function LocationPickerWrapper(props: LocationPickerWrapperProps) {
  return <LocationPicker {...props} />;
}
