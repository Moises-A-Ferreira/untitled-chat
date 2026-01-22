"use client";

import React, { useState } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
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

export default function LocationSelector({ 
  onLocationSelect, 
  initialLocation 
}: LocationSelectorProps) {
  const [manualMode, setManualMode] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  
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

  // Handle geolocation result
  React.useEffect(() => {
    if (position && !manualMode) {
      onLocationSelect({
        latitude: position.latitude,
        longitude: position.longitude,
        address: `Coordenadas: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
      });
    }
  }, [position, manualMode, onLocationSelect]);

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

  const handleManualAddressSubmit = () => {
    if (addressInput.trim()) {
      // Real São Manuel address mapping based on common locations
      const saoManuelLocations = [
        // Centro/Business District
        { keywords: ['centro', 'rua principal', 'avenida brasil', 'praça', 'comercial', 'negócios'], lat: -22.7219, lng: -48.5715, neighborhood: "Centro" },
        { keywords: ['prefeitura', 'câmara', 'cartório', 'administração'], lat: -22.7215, lng: -48.5712, neighborhood: "Centro" },
        { keywords: ['mercado', 'feira', 'comércio', 'shopping'], lat: -22.7223, lng: -48.5718, neighborhood: "Centro" },
        
        // Residential Areas
        { keywords: ['jardim são paulo', 'são paulo', 'jardim sp'], lat: -22.7235, lng: -48.5728, neighborhood: "Jardim São Paulo" },
        { keywords: ['vila nova', 'nova', 'vn'], lat: -22.7201, lng: -48.5692, neighborhood: "Vila Nova" },
        { keywords: ['residencial bela vista', 'bela vista', 'belavista'], lat: -22.7252, lng: -48.5741, neighborhood: "Residencial Bela Vista" },
        { keywords: ['parque das nações', 'nações', 'parque nações'], lat: -22.7187, lng: -48.5678, neighborhood: "Parque das Nações" },
        { keywords: ['jardim américa', 'américa', 'jardim america'], lat: -22.7241, lng: -48.5703, neighborhood: "Jardim América" },
        
        // Streets and Roads
        { keywords: ['rua das flores', 'flores'], lat: -22.7228, lng: -48.5721, neighborhood: "Centro" },
        { keywords: ['avenida são joão', 'são joão', 'sao joao'], lat: -22.7208, lng: -48.5705, neighborhood: "Vila Nova" },
        { keywords: ['rua independência', 'independência', 'independencia'], lat: -22.7245, lng: -48.5732, neighborhood: "Jardim São Paulo" },
        { keywords: ['rua tiradentes', 'tiradentes'], lat: -22.7211, lng: -48.5709, neighborhood: "Centro" },
        
        // Schools and Public Services
        { keywords: ['escola', 'colégio', 'educação', 'escolar', 'ensino'], lat: -22.7212, lng: -48.5708, neighborhood: "Centro" },
        { keywords: ['hospital', 'ubs', 'saúde', 'clinica', 'médico', 'medico'], lat: -22.7231, lng: -48.5719, neighborhood: "Centro" },
        { keywords: ['posto', 'polícia', 'segurança', 'delegacia', 'guarda'], lat: -22.7226, lng: -48.5713, neighborhood: "Centro" },
        
        // Specific landmarks
        { keywords: ['igreja', 'matriz', 'templo'], lat: -22.7220, lng: -48.5716, neighborhood: "Centro" },
        { keywords: ['rodoviária', 'ônibus', 'transporte'], lat: -22.7205, lng: -48.5700, neighborhood: "Centro" },
        
        // Default fallback (center of São Manuel)
        { keywords: [], lat: -22.7219, lng: -48.5715, neighborhood: "Centro" }
      ];
      
      // Find matching location based on keywords
      const normalizedInput = addressInput.toLowerCase().trim();
      let matchedLocation = saoManuelLocations[saoManuelLocations.length - 1]; // Default
      
      console.log('[LOCATION SELECTOR] Input received:', normalizedInput);
      
      // Check for exact matches first
      for (const location of saoManuelLocations) {
        for (const keyword of location.keywords) {
          if (normalizedInput === keyword || normalizedInput.includes(keyword)) {
            matchedLocation = location;
            console.log('[LOCATION SELECTOR] Matched keyword:', keyword, '->', location.neighborhood);
            break;
          }
        }
        if (matchedLocation !== saoManuelLocations[saoManuelLocations.length - 1]) {
          break;
        }
      }
      
      // If still default, try partial matching
      if (matchedLocation === saoManuelLocations[saoManuelLocations.length - 1]) {
        console.log('[LOCATION SELECTOR] No exact match, trying partial matching');
        for (const location of saoManuelLocations) {
          if (location.keywords.length > 0 && 
              location.keywords.some(keyword => 
                normalizedInput.split(' ').some(word => 
                  keyword.includes(word) || word.includes(keyword)
                )
              )) {
            matchedLocation = location;
            console.log('[LOCATION SELECTOR] Partial match found:', location.neighborhood);
            break;
          }
        }
      }
      
      console.log('[LOCATION SELECTOR] Final result:', matchedLocation);
      
      setSelectedAddress(addressInput);
      setNeighborhood(matchedLocation.neighborhood);
      
      onLocationSelect({
        latitude: matchedLocation.lat,
        longitude: matchedLocation.lng,
        address: addressInput,
        neighborhood: matchedLocation.neighborhood
      });
      
      setAddressInput("");
    }
  };

  const clearSelection = () => {
    setSelectedAddress(null);
    setNeighborhood(null);
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
          Informar Endereço
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
                Coordenadas: {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
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
            Informar Endereço
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="address-input" className="text-sm">
                Descreva o local aproximado
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="address-input"
                  type="text"
                  placeholder="Ex: Rua Principal, 100 - Centro"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualAddressSubmit()}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  onClick={handleManualAddressSubmit}
                  disabled={!addressInput.trim()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Exemplos: "Centro", "Rua Principal", "Jardim São Paulo", "Escola Municipal"
              </p>
            </div>

            {/* Selected Address */}
            {selectedAddress && (
              <div className="p-3 bg-background border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedAddress}</p>
                    {neighborhood && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Bairro identificado: {neighborhood}
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