import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  currentLocation?: { lat: number; lng: number; address: string };
}

const GOOGLE_API_KEY = 'AIzaSyBmlIUNvfTAacQ3K_wb7RDMwKF8Fo2XiaE';

export const LocationMap: React.FC<LocationMapProps> = ({ 
  onLocationSelect, 
  currentLocation 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Load Google Maps API
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: GOOGLE_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();

        if (!mapRef.current) return;

        // Create map
        const googleMap = new google.maps.Map(mapRef.current, {
          center: currentLocation 
            ? { lat: currentLocation.lat, lng: currentLocation.lng }
            : { lat: 28.7041, lng: 77.1025 }, // Default to Delhi
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#ffffff' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#000000' }, { lightness: 13 }]
            }
          ]
        });

        // Create marker
        const mapMarker = new google.maps.Marker({
          position: currentLocation 
            ? { lat: currentLocation.lat, lng: currentLocation.lng }
            : { lat: 28.7041, lng: 77.1025 },
          map: googleMap,
          draggable: true,
          title: 'Selected Location'
        });

        // Add click listener to map
        googleMap.addListener('click', async (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            mapMarker.setPosition({ lat, lng });
            
            // Get address from coordinates
            const geocoder = new google.maps.Geocoder();
            try {
              const response = await geocoder.geocode({ location: { lat, lng } });
              const address = response.results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              onLocationSelect(lat, lng, address);
            } catch (error) {
              onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }
        });

        // Add drag listener to marker
        mapMarker.addListener('dragend', async () => {
          const position = mapMarker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            
            // Get address from coordinates
            const geocoder = new google.maps.Geocoder();
            try {
              const response = await geocoder.geocode({ location: { lat, lng } });
              const address = response.results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              onLocationSelect(lat, lng, address);
            } catch (error) {
              onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }
        });

        setMap(googleMap);
        setMarker(mapMarker);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [currentLocation, onLocationSelect]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchValue.trim() || !map) return;

    const geocoder = new google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ address: searchValue });
      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const address = response.results[0].formatted_address;

        map.setCenter({ lat, lng });
        map.setZoom(12);
        marker?.setPosition({ lat, lng });
        
        onLocationSelect(lat, lng, address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (map && marker) {
            map.setCenter({ lat, lng });
            map.setZoom(12);
            marker.setPosition({ lat, lng });

            // Get address
            const geocoder = new google.maps.Geocoder();
            try {
              const response = await geocoder.geocode({ location: { lat, lng } });
              const address = response.results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              onLocationSelect(lat, lng, address);
            } catch (error) {
              onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Select Weather Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Search for a location..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button onClick={handleSearch} variant="outline">
            Search
          </Button>
          <Button onClick={getCurrentLocation} variant="outline">
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative h-96 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Click anywhere on the map to select a location</p>
          <p>• Drag the marker to fine-tune the position</p>
          <p>• Use search to find specific places</p>
          <p>• Click the location icon to use your current position</p>
        </div>
      </CardContent>
    </Card>
  );
};