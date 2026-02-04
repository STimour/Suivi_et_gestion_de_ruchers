'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  latitude: number;
  longitude: number;
}

export function LocationDisplay({ latitude, longitude }: LocationDisplayProps) {
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'fr',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération de l\'adresse');
        }

        const data = await response.json();

        // Extraire ville ou village
        const address = data.address;
        const city = address.city || address.town || address.village || address.hamlet;
        const road = address.road;

        // Construire l'affichage
        if (road && city) {
          setLocation(`${road}, ${city}`);
        } else if (city) {
          setLocation(city);
        } else if (road) {
          setLocation(road);
        } else {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (error) {
        console.error('Erreur geocoding:', error);
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [latitude, longitude]);

  return (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
      {loading ? (
        <span className="animate-pulse">Chargement...</span>
      ) : (
        <span className="truncate" title={location}>{location}</span>
      )}
    </div>
  );
}
