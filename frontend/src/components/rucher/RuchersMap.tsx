'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Hexagon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Fix pour les icônes Leaflet dans Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Rucher {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  flore: string;
  altitude: number;
  ruches?: any[];
}

interface RuchersMapProps {
  ruchers: Rucher[];
  loading?: boolean;
}

export function RuchersMap({ ruchers, loading }: RuchersMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <MapPin className="h-5 w-5" />
            Carte des ruchers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!isMounted) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <MapPin className="h-5 w-5" />
            Carte des ruchers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chargement de la carte...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer le centre de la carte
  const center: [number, number] = ruchers.length > 0
    ? [
        ruchers.reduce((sum, r) => sum + r.latitude, 0) / ruchers.length,
        ruchers.reduce((sum, r) => sum + r.longitude, 0) / ruchers.length,
      ]
    : [46.603354, 1.888334]; // Centre de la France par défaut

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <MapPin className="h-5 w-5" />
          Carte des ruchers
          {ruchers.length > 0 && (
            <span className="text-sm font-normal text-amber-700/70">
              ({ruchers.length} {ruchers.length > 1 ? 'emplacements' : 'emplacement'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ruchers.length > 0 ? (
          <div className="h-[400px] w-full rounded-lg overflow-hidden border border-amber-200">
            <MapContainer
              center={center}
              zoom={ruchers.length === 1 ? 13 : 6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />
              {ruchers.map((rucher) => (
                <Marker
                  key={rucher.id}
                  position={[rucher.latitude, rucher.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {rucher.nom}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-amber-700">
                          <span className="font-medium">Flore:</span> {rucher.flore}
                        </p>
                        <p className="text-amber-700">
                          <span className="font-medium">Altitude:</span> {rucher.altitude}m
                        </p>
                        <p className="text-amber-700">
                          <span className="font-medium">Coordonnées:</span>{' '}
                          {rucher.latitude.toFixed(4)}, {rucher.longitude.toFixed(4)}
                        </p>
                        {rucher.ruches && rucher.ruches.length > 0 && (
                          <p className="text-green-700 flex items-center gap-1 mt-2 pt-2 border-t">
                            <Hexagon className="h-3 w-3" />
                            <span className="font-medium">
                              {rucher.ruches.length} {rucher.ruches.length > 1 ? 'ruches' : 'ruche'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <div className="h-[400px] w-full bg-amber-50 rounded-lg flex flex-col items-center justify-center text-amber-700/70 border border-amber-200">
            <MapPin className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun rucher à afficher</p>
            <p className="text-sm mt-1">Créez votre premier rucher pour le voir sur la carte</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
