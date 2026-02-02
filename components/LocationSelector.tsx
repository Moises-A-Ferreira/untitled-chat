"use client";

import React, { useState, useEffect } from "react";

// Declare Google Maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

declare const google: any;
import { useGeolocation } from "@/hooks/use-geolocation";
import { validateLocation, formatCoordinates } from "@/lib/location-utils";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Navigation,
  Search,
  X,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationSelectorProps {
  onLocationSelect: (location: { 
    latitude: number; 
    longitude: number; 
    address?: string;
    neighborhood?: string;
  }) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
}

interface GooglePlace {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export default function LocationSelector({ 
  onLocationSelect, 
  initialLocation 
}: LocationSelectorProps) {
  const [manualMode, setManualMode] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  
  // Geolocation hook
  const {
    position,
    error: locationError,
    loading: locationLoading,
    isSupported: locationSupported,
    refreshLocation
  } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 60000,
    watch: false
  });

  // Load Google Maps services
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setAutocompleteService(new google.maps.places.AutocompleteService());
      setPlacesService(new google.maps.places.PlacesService(document.createElement('div')));
    } else {
      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBkSGDtW1 EzF9wFq7q7q7q7q7q7q7q7q7q&libraries=places`;
      script.async = true;
      script.onload = () => {
        setAutocompleteService(new google.maps.places.AutocompleteService());
        setPlacesService(new google.maps.places.PlacesService(document.createElement('div')));
      };
      document.head.appendChild(script);
    }
  }, []);

  // Handle geolocation result
  useEffect(() => {
    if (position && !manualMode) {
      const validation = validateLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy || 0
      });
      
      if (validation.isValid) {
        onLocationSelect({
          latitude: position.latitude,
          longitude: position.longitude,
          address: `Coordenadas: ${formatCoordinates(position.latitude, position.longitude, position.accuracy || 0).lat}, ${formatCoordinates(position.latitude, position.longitude, position.accuracy || 0).lng}`
        });
      }
    }
  }, [position, manualMode, onLocationSelect]);

  const handleAddressSearch = () => {
    if (!addressInput.trim() || !autocompleteService) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    autocompleteService.getPlacePredictions(
      {
        input: `São Manuel, SP, Brazil ${addressInput}`,
        types: ['address'],
        componentRestrictions: { country: 'br' }
      },
      (predictions: any, status: any) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSearchResults(predictions as unknown as GooglePlace[]);
        }
      }
    );
  };

  const handlePlaceSelect = (placeId: string) => {
    if (!placesService) return;
    
    placesService.getDetails(
      { placeId },
      (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const location = place.geometry?.location;
          if (location) {
            const lat = location.lat();
            const lng = location.lng();
            
            // Extract neighborhood from address components
            let neighborhoodName = "";
            if (place.address_components) {
              const neighborhoodComponent = place.address_components.find((comp: any) => 
                comp.types.includes('sublocality') || 
                comp.types.includes('neighborhood')
              );
              if (neighborhoodComponent) {
                neighborhoodName = neighborhoodComponent.long_name;
              }
            }
            
            setSelectedAddress(place.formatted_address);
            setNeighborhood(neighborhoodName);
            setSearchResults([]);
            setAddressInput("");
            
            onLocationSelect({
              latitude: lat,
              longitude: lng,
              address: place.formatted_address,
              neighborhood: neighborhoodName
            });
          }
        }
      }
    );
  };

  const handleShareLocation = () => {
    setManualMode(false);
    setSelectedAddress(null);
    setNeighborhood(null);
    refreshLocation();
  };

  const handleManualEntry = () => {
    setManualMode(true);
    setSelectedAddress(null);
    setNeighborhood(null);
  };

  const clearSelection = () => {
    setSelectedAddress(null);
    setNeighborhood(null);
    setSearchResults([]);
    setAddressInput("");
    onLocationSelect({ latitude: 0, longitude: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant={manualMode ? "outline" : "default"}
          className="flex-1"
          onClick={handleShareLocation}
          disabled={!locationSupported || locationLoading}
        >
          {locationLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Compartilhar Localização
        </Button>
        
        <Button
          type="button"
          variant={!manualMode ? "outline" : "default"}
          className="flex-1"
          onClick={handleManualEntry}
        >
          <Search className="h-4 w-4 mr-2" />
          Buscar Endereço
        </Button>
      </div>

      {/* Geolocation Mode */}
      {!manualMode && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localização por GPS
          </h3>
          
          {locationLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Obtendo sua localização...
              </span>
            </div>
          ) : locationError ? (
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{locationError.message}</span>
            </div>
          ) : !locationSupported ? (
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Geolocalização não suportada</span>
            </div>
          ) : position ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Localização obtida com sucesso!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordenadas: {formatCoordinates(position.latitude, position.longitude, position.accuracy || 0).lat}, 
                {formatCoordinates(position.latitude, position.longitude, position.accuracy || 0).lng}
                {position.accuracy && ` (±${Math.round(position.accuracy)}m)`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em "Compartilhar Localização" para obter sua posição atual
            </p>
          )}
        </div>
      )}

      {/* Manual Address Mode */}
      {manualMode && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Endereço em São Manuel
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="address-search" className="text-sm">
                  Digite o endereço
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="address-search"
                    type="text"
                    placeholder="Rua, número, bairro..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isSearching || !addressInput.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0 text-sm"
                    onClick={() => handlePlaceSelect(result.place_id)}
                  >
                    {result.formatted_address}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Address */}
            {selectedAddress && (
              <div className="p-3 bg-background border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedAddress}</p>
                    {neighborhood && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Bairro: {neighborhood}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {locationError && !manualMode && (
        <div className="text-destructive text-sm">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          {locationError.message}
        </div>
      )}
    </div>
  );
}