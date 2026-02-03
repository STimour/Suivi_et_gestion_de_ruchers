'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Icône personnalisée pour le marqueur
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Composant pour gérer les clics sur la carte
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Composant pour recentrer la carte
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (center[0] !== 0 || center[1] !== 0) {
      map.setView(center, 13);
    }
  }, [center, map]);

  return null;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Position par défaut (France)
  const defaultCenter: [number, number] = [46.603354, 1.888334];
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;

  // Fermer les résultats quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche d'adresse avec Nominatim (OpenStreetMap)
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=fr`,
        {
          headers: {
            'Accept-Language': 'fr',
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Sélectionner un résultat de recherche
  const selectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLocationChange(lat, lng);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  // Recherche sur Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchAddress();
    }
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div ref={searchRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher une adresse ou une ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={searchAddress}
            disabled={isSearching}
            className="shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Rechercher'
            )}
          </Button>
        </div>

        {/* Résultats de recherche */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[10002] mt-1 w-full bg-white border border-amber-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50 border-b border-amber-100 last:border-b-0 flex items-start gap-2"
                onClick={() => selectResult(result)}
              >
                <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carte */}
      <div className="relative h-[250px] rounded-lg overflow-hidden border border-amber-200">
        <MapContainer
          center={center}
          zoom={latitude && longitude ? 13 : 6}
          className="h-full w-full"
          style={{ zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onLocationChange={onLocationChange} />
          <MapCenterUpdater center={center} />
          {latitude !== 0 && longitude !== 0 && (
            <Marker position={[latitude, longitude]} icon={markerIcon} />
          )}
        </MapContainer>

        {/* Instruction */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-amber-700 text-center">
          Cliquez sur la carte pour placer le rucher
        </div>
      </div>

      {/* Coordonnées affichées */}
      {latitude !== 0 && longitude !== 0 && (
        <div className="flex gap-4 text-sm text-amber-700">
          <span>Lat: <strong>{latitude.toFixed(6)}</strong></span>
          <span>Lng: <strong>{longitude.toFixed(6)}</strong></span>
        </div>
      )}
    </div>
  );
}
