import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Search, 
  Loader2, 
  Cloud, 
  CloudRain, 
  Thermometer,
  Wind,
  Eye,
  Layers,
  Satellite,
  Map as MapIcon,
  Sun,
  CloudSnow,
  Zap
} from 'lucide-react';
import { fetchWeatherApi } from 'openmeteo';

interface WeatherMapModalProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  currentLocation?: { lat: number; lng: number; address: string };
}

const GOOGLE_API_KEY = 'AIzaSyBmlIUNvfTAacQ3K_wb7RDMwKF8Fo2XiaE';

// Weather overlay types
interface WeatherOverlay {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  opacity: number;
}

export const WeatherMapModal: React.FC<WeatherMapModalProps> = ({ 
  onLocationSelect, 
  currentLocation 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [weatherLayers, setWeatherLayers] = useState<WeatherOverlay[]>([
    { id: 'clouds', name: 'Cloud Cover', icon: Cloud, enabled: true, opacity: 0.6 },
    { id: 'precipitation', name: 'Precipitation', icon: CloudRain, enabled: true, opacity: 0.7 },
    { id: 'temperature', name: 'Temperature', icon: Thermometer, enabled: false, opacity: 0.5 },
    { id: 'wind', name: 'Wind Speed', icon: Wind, enabled: false, opacity: 0.5 },
  ]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('satellite');
  const [currentWeatherData, setCurrentWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Initialize Google Maps with weather layers
  useEffect(() => {
    const initMap = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: GOOGLE_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry', 'visualization']
        });

        await loader.load();

        if (!mapRef.current) return;

        const googleMap = new google.maps.Map(mapRef.current, {
          center: currentLocation 
            ? { lat: currentLocation.lat, lng: currentLocation.lng }
            : { lat: 28.7041, lng: 77.1025 },
          zoom: 8,
          mapTypeId: google.maps.MapTypeId[mapType.toUpperCase() as keyof typeof google.maps.MapTypeId],
          styles: mapType === 'roadmap' ? [
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
          ] : [],
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          scaleControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Create weather marker with enhanced info
        const mapMarker = new google.maps.Marker({
          position: currentLocation 
            ? { lat: currentLocation.lat, lng: currentLocation.lng }
            : { lat: 28.7041, lng: 77.1025 },
          map: googleMap,
          draggable: true,
          title: 'Weather Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }
        });

        // Add weather info window
        const infoWindow = new google.maps.InfoWindow();

        // Handle map clicks
        googleMap.addListener('click', async (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            mapMarker.setPosition({ lat, lng });
            await updateLocationWeather(lat, lng, mapMarker, infoWindow);
          }
        });

        // Handle marker drag
        mapMarker.addListener('dragend', async () => {
          const position = mapMarker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            await updateLocationWeather(lat, lng, mapMarker, infoWindow);
          }
        });

        // Load initial weather data
        if (currentLocation) {
          await updateLocationWeather(currentLocation.lat, currentLocation.lng, mapMarker, infoWindow);
        }

        setMap(googleMap);
        setMarker(mapMarker);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [currentLocation, mapType]);

  // Update weather data for location
  const updateLocationWeather = async (
    lat: number, 
    lng: number, 
    mapMarker: google.maps.Marker,
    infoWindow: google.maps.InfoWindow
  ) => {
    setLoadingWeather(true);
    try {
      // Get address from coordinates
      const geocoder = new google.maps.Geocoder();
      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        address = response.results[0]?.formatted_address || address;
      } catch (error) {
        console.error('Geocoding error:', error);
      }

      // Get weather data from OpenMeteo
      const weatherResponse = await fetchWeatherApi('https://api.open-meteo.com/v1/forecast', {
        latitude: lat,
        longitude: lng,
        current: ['temperature_2m', 'weather_code', 'wind_speed_10m', 'relative_humidity_2m', 'cloud_cover'],
        hourly: ['temperature_2m', 'precipitation_probability', 'weather_code'],
        forecast_days: 3
      });

      const response = weatherResponse[0];
      const current = response.current()!;
      
      const weatherData = {
        temperature: Math.round(current.variables(0)!.value()),
        weatherCode: current.variables(1)!.value(),
        windSpeed: Math.round(current.variables(2)!.value()),
        humidity: Math.round(current.variables(3)!.value()),
        cloudCover: Math.round(current.variables(4)!.value()),
        address
      };

      setCurrentWeatherData(weatherData);

      // Update info window
      const weatherIcon = getWeatherIcon(weatherData.weatherCode);
      const weatherCondition = getWeatherCondition(weatherData.weatherCode);
      
      const infoContent = `
        <div class="p-4 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <div class="text-2xl">${weatherIcon}</div>
            <div>
              <div class="font-bold text-lg">${weatherData.temperature}°C</div>
              <div class="text-sm text-gray-600">${weatherCondition}</div>
            </div>
          </div>
          <div class="space-y-1 text-sm">
            <div>Wind: ${weatherData.windSpeed} km/h</div>
            <div>Humidity: ${weatherData.humidity}%</div>
            <div>Cloud Cover: ${weatherData.cloudCover}%</div>
          </div>
          <div class="mt-2 pt-2 border-t text-xs text-gray-500">
            ${address}
          </div>
        </div>
      `;

      infoWindow.setContent(infoContent);
      infoWindow.open(map, mapMarker);

      // Call the selection callback
      onLocationSelect(lat, lng, address);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Handle search functionality
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
        map.setZoom(10);
        if (marker) {
          marker.setPosition({ lat, lng });
          await updateLocationWeather(lat, lng, marker, new google.maps.InfoWindow());
        }
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
            map.setZoom(10);
            marker.setPosition({ lat, lng });
            await updateLocationWeather(lat, lng, marker, new google.maps.InfoWindow());
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  // Toggle weather layer
  const toggleWeatherLayer = (layerId: string) => {
    setWeatherLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, enabled: !layer.enabled }
          : layer
      )
    );
  };

  // Update layer opacity
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setWeatherLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity }
          : layer
      )
    );
  };

  // Change map type
  const changeMapType = (newType: 'roadmap' | 'satellite' | 'hybrid') => {
    setMapType(newType);
    if (map) {
      map.setMapTypeId(google.maps.MapTypeId[newType.toUpperCase() as keyof typeof google.maps.MapTypeId]);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Map Container */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading weather map...</p>
                    </div>
                  </div>
                )}
                <div ref={mapRef} className="w-full h-full" />
                
                {/* Map Type Controls */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={mapType === 'roadmap' ? 'default' : 'outline'}
                      onClick={() => changeMapType('roadmap')}
                    >
                      <MapIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={mapType === 'satellite' ? 'default' : 'outline'}
                      onClick={() => changeMapType('satellite')}
                    >
                      <Satellite className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={mapType === 'hybrid' ? 'default' : 'outline'}
                      onClick={() => changeMapType('hybrid')}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Loading Weather Overlay */}
                {loadingWeather && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm">Loading weather...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Controls Panel */}
        <div className="space-y-4">
          {/* Current Weather Info */}
          {currentWeatherData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Weather</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getWeatherIcon(currentWeatherData.weatherCode)}</div>
                  <div>
                    <div className="text-2xl font-bold">{currentWeatherData.temperature}°C</div>
                    <div className="text-sm text-muted-foreground">
                      {getWeatherCondition(currentWeatherData.weatherCode)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Wind</div>
                    <div className="font-medium">{currentWeatherData.windSpeed} km/h</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Humidity</div>
                    <div className="font-medium">{currentWeatherData.humidity}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Layer Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Weather Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weatherLayers.map((layer) => {
                const IconComponent = layer.icon;
                return (
                  <div key={layer.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium">{layer.name}</Label>
                      </div>
                      <Switch
                        checked={layer.enabled}
                        onCheckedChange={() => toggleWeatherLayer(layer.id)}
                      />
                    </div>
                    {layer.enabled && (
                      <div className="ml-6">
                        <Label className="text-xs text-muted-foreground">
                          Opacity: {Math.round(layer.opacity * 100)}%
                        </Label>
                        <div className="mt-1">
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={layer.opacity}
                            onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>• Click anywhere to get weather data</p>
              <p>• Drag the marker to fine-tune position</p>
              <p>• Toggle weather layers for insights</p>
              <p>• Use search or GPS for quick navigation</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Weather utilities
const getWeatherIcon = (weatherCode: number): string => {
  const iconMap: Record<number, string> = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️', 56: '🌦️', 57: '🌦️',
    61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
    80: '🌦️', 81: '🌦️', 82: '🌦️',
    85: '🌨️', 86: '🌨️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
  };
  return iconMap[weatherCode] || '🌥️';
};

const getWeatherCondition = (weatherCode: number): string => {
  const conditionMap: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
  };
  return conditionMap[weatherCode] || 'Unknown';
};