"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Search, 
  X, 
  Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface InteractiveLocationSelectorProps {
  onLocationSelect: (location: { 
    latitude: number; 
    longitude: number; 
    address?: string;
    neighborhood?: string;
  }) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
}

export default function InteractiveLocationSelector({ 
  onLocationSelect, 
  initialLocation 
}: InteractiveLocationSelectorProps) {
  const [manualMode] = useState(true); // Always in manual mode
  const [addressInput, setAddressInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([-22.7311, -48.5706]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-22.7311, -48.5706]);
  const [isDragging, setIsDragging] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  


  // Handle address input and initial positioning
  const handleAddressSubmit = async () => {
    if (addressInput.trim()) {
      // Enhanced coordinate assignment with street-level precision for São Manuel
      // Base coordinates for São Manuel: -22.73111, -48.57056
      
      // Import hybrid geocoding system
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      // Try precise local geocoding first
      console.log('Trying precise local geocoding for:', addressInput);
      const preciseResult = findPreciseLocation(addressInput);
      
      if (preciseResult.success && preciseResult.lat && preciseResult.lng && preciseResult.address) {
        console.log('Precise geocoding successful:', preciseResult);
        
        const newPosition: [number, number] = [preciseResult.lat, preciseResult.lng];
        setMarkerPosition(newPosition);
        setMapCenter(newPosition);
        setNeighborhood(preciseResult.neighborhood || "Indeterminado");
        setSelectedAddress(preciseResult.address);
        
        // Center map with appropriate zoom based on precision
        const zoomLevel = preciseResult.precision === 'high' ? 18 : 16;
        if (mapInstance) {
          mapInstance.setView(newPosition, zoomLevel);
        }
        
        onLocationSelect({
          latitude: preciseResult.lat,
          longitude: preciseResult.lng,
          address: preciseResult.address,
          neighborhood: preciseResult.neighborhood || "Indeterminado"
        });
        
        setAddressInput("");
        return;
      } else {
        console.log('Precise geocoding failed:', preciseResult.error);
      }
      
      // Extract house number from input
      const extractHouseNumber = (input: string): { street: string; number: number | null } => {
        const match = input.match(/(\D+)\s*(\d+)/i);
        if (match) {
          return {
            street: match[1].trim().toLowerCase(),
            number: parseInt(match[2])
          };
        }
        return { street: input.toLowerCase().trim(), number: null };
      };
      
      const { street, number } = extractHouseNumber(addressInput);
      
      // Street segments with start/end coordinates for interpolation
      const streetSegments = [
        // Rua Principal (Avenida Brasil) - Main commercial street
        {
          name: 'rua principal',
          aliases: ['avenida brasil', 'av brasil', 'rua principal'],
          start: { lat: -22.7320, lng: -48.5720, number: 1 },
          end: { lat: -22.7300, lng: -48.5690, number: 1000 },
          neighborhood: "Centro"
        },
        
        // Rua Quinze de Novembro
        {
          name: 'quinze de novembro',
          aliases: ['15 de novembro', 'rua 15', 'quinze de novembro'],
          start: { lat: -22.7315, lng: -48.5715, number: 1 },
          end: { lat: -22.7305, lng: -48.5700, number: 500 },
          neighborhood: "Centro"
        },
        
        // Rua Coronel (important street)
        {
          name: 'rua coronel',
          aliases: ['coronel', 'rua coronel'],
          start: { lat: -22.7325, lng: -48.5710, number: 1 },
          end: { lat: -22.7295, lng: -48.5680, number: 800 },
          neighborhood: "Centro"
        },
        
        // Rua São Paulo (Jardim São Paulo)
        {
          name: 'rua são paulo',
          aliases: ['são paulo', 'rua são paulo'],
          start: { lat: -22.7350, lng: -48.5740, number: 1 },
          end: { lat: -22.7320, lng: -48.5710, number: 600 },
          neighborhood: "Jardim São Paulo"
        },
        
        // Rua Vila Nova
        {
          name: 'rua vila nova',
          aliases: ['vila nova', 'rua vila nova'],
          start: { lat: -22.7290, lng: -48.5690, number: 1 },
          end: { lat: -22.7270, lng: -48.5660, number: 400 },
          neighborhood: "Vila Nova"
        },
        
        // Rua Bela Vista
        {
          name: 'rua bela vista',
          aliases: ['bela vista', 'rua bela vista'],
          start: { lat: -22.7360, lng: -48.5750, number: 1 },
          end: { lat: -22.7340, lng: -48.5720, number: 500 },
          neighborhood: "Residencial Bela Vista"
        },
        
        // Rua das Nações
        {
          name: 'rua das nações',
          aliases: ['nações', 'rua das nações'],
          start: { lat: -22.7275, lng: -48.5675, number: 1 },
          end: { lat: -22.7255, lng: -48.5645, number: 300 },
          neighborhood: "Parque das Nações"
        },
        
        // Rua América
        {
          name: 'rua américa',
          aliases: ['américa', 'rua américa'],
          start: { lat: -22.7350, lng: -48.5700, number: 1 },
          end: { lat: -22.7330, lng: -48.5670, number: 400 },
          neighborhood: "Jardim América"
        }
      ];
      
      // Check if we have a street with house number for precise location
      if (number !== null) {
        for (const segment of streetSegments) {
          if (segment.aliases.some(alias => street.includes(alias) || alias.includes(street))) {
            // Interpolate position based on house number
            const totalNumbers = segment.end.number - segment.start.number;
            const positionRatio = (number - segment.start.number) / totalNumbers;
            
            // Clamp ratio between 0 and 1
            const clampedRatio = Math.max(0, Math.min(1, positionRatio));
            
            const interpolatedLat = segment.start.lat + (segment.end.lat - segment.start.lat) * clampedRatio;
            const interpolatedLng = segment.start.lng + (segment.end.lng - segment.start.lng) * clampedRatio;
            
            const preciseLocation = {
              lat: interpolatedLat,
              lng: interpolatedLng,
              neighborhood: segment.neighborhood
            };
            
            console.log(`Precise location calculated for ${street} ${number}:`, preciseLocation);
            
            const newPosition: [number, number] = [preciseLocation.lat, preciseLocation.lng];
            setMarkerPosition(newPosition);
            setMapCenter(newPosition);
            setNeighborhood(preciseLocation.neighborhood);
            setSelectedAddress(addressInput);
            
            // Center map on the location
            if (mapInstance) {
              mapInstance.setView(newPosition, 17); // Higher zoom for precision
            }
            
            onLocationSelect({
              latitude: preciseLocation.lat,
              longitude: preciseLocation.lng,
              address: addressInput,
              neighborhood: preciseLocation.neighborhood
            });
            
            setAddressInput("");
            return;
          }
        }
      }
      
      // Fallback to landmark matching if no precise street number found
      const saoManuelLocations = [
        // Centro/Commercial Area (Main downtown)
        { keywords: ['centro', 'praça', 'comercial', 'matriz'], lat: -22.7311, lng: -48.5706, neighborhood: "Centro" },
        { keywords: ['rua principal', 'avenida brasil', 'av brasil'], lat: -22.7308, lng: -48.5703, neighborhood: "Centro" },
        { keywords: ['praça da matriz', 'igreja matriz', 'matriz'], lat: -22.7315, lng: -48.5701, neighborhood: "Centro" },
        { keywords: ['quinze de novembro', '15 de novembro', 'rua 15'], lat: -22.7305, lng: -48.5708, neighborhood: "Centro" },
        
        // Jardim São Paulo
        { keywords: ['jardim são paulo', 'são paulo', 'jardim sp'], lat: -22.7335, lng: -48.5728, neighborhood: "Jardim São Paulo" },
        { keywords: ['rua são paulo', 'avenida são paulo'], lat: -22.7332, lng: -48.5725, neighborhood: "Jardim São Paulo" },
        
        // Vila Nova
        { keywords: ['vila nova', 'nova'], lat: -22.7281, lng: -48.5682, neighborhood: "Vila Nova" },
        { keywords: ['rua vila nova', 'bairro vila nova'], lat: -22.7278, lng: -48.5685, neighborhood: "Vila Nova" },
        
        // Residencial Bela Vista
        { keywords: ['residencial bela vista', 'bela vista', 'residencial bv'], lat: -22.7352, lng: -48.5741, neighborhood: "Residencial Bela Vista" },
        { keywords: ['rua bela vista', 'avenida bela vista'], lat: -22.7349, lng: -48.5738, neighborhood: "Residencial Bela Vista" },
        
        // Parque das Nações
        { keywords: ['parque das nações', 'nações', 'parque nations'], lat: -22.7267, lng: -48.5668, neighborhood: "Parque das Nações" },
        { keywords: ['rua nações', 'avenida nações'], lat: -22.7264, lng: -48.5671, neighborhood: "Parque das Nações" },
        
        // Jardim América
        { keywords: ['jardim américa', 'américa', 'jardim america'], lat: -22.7341, lng: -48.5693, neighborhood: "Jardim América" },
        { keywords: ['rua américa', 'avenida américa'], lat: -22.7338, lng: -48.5696, neighborhood: "Jardim América" },
        
        // Schools and Education
        { keywords: ['escola', 'colégio', 'educação', 'ensino', 'emei', 'emeief'], lat: -22.7302, lng: -48.5708, neighborhood: "Centro" },
        { keywords: ['faculdade', 'universidade', 'curso'], lat: -22.7315, lng: -48.5712, neighborhood: "Centro" },
        
        // Health Services
        { keywords: ['hospital', 'ubs', 'saúde', 'posto', 'clinica', 'upa'], lat: -22.7321, lng: -48.5709, neighborhood: "Centro" },
        
        // Public Services
        { keywords: ['prefeitura', 'câmara', 'vereadoria', 'cartório'], lat: -22.7310, lng: -48.5703, neighborhood: "Centro" },
        
        // Markets and Commerce
        { keywords: ['mercado', 'feira', 'comércio', 'lojas', 'supermercado'], lat: -22.7304, lng: -48.5707, neighborhood: "Centro" },
        
        // Parks and Recreation
        { keywords: ['praça', 'parque', 'lazer', 'recreação', 'quadra'], lat: -22.7290, lng: -48.5705, neighborhood: "Centro" },
        
        // Residential Areas
        { keywords: ['rua das flores', 'flores'], lat: -22.7285, lng: -48.5688, neighborhood: "Vila Nova" },
        { keywords: ['rua das palmeiras', 'palmeiras'], lat: -22.7345, lng: -48.5735, neighborhood: "Residencial Bela Vista" },
        { keywords: ['rua dos jardins', 'jardins'], lat: -22.7333, lng: -48.5690, neighborhood: "Jardim América" },
        
        // Streets and Roads
        { keywords: ['rua coronel', 'coronel'], lat: -22.7306, lng: -48.5704, neighborhood: "Centro" },
        { keywords: ['avenida independência', 'independência'], lat: -22.7288, lng: -48.5680, neighborhood: "Vila Nova" },
        { keywords: ['rua da paz', 'paz'], lat: -22.7348, lng: -48.5745, neighborhood: "Residencial Bela Vista" },
        
        // More Specific Streets
        { keywords: ['rua brasil', 'brasil'], lat: -22.7308, lng: -48.5703, neighborhood: "Centro" },
        { keywords: ['rua são joão', 'são joão', 'joão'], lat: -22.7334, lng: -48.5727, neighborhood: "Jardim São Paulo" },
        { keywords: ['rua santa maria', 'santa maria', 'maria'], lat: -22.7282, lng: -48.5683, neighborhood: "Vila Nova" },
        { keywords: ['rua das nações', 'nações'], lat: -22.7265, lng: -48.5670, neighborhood: "Parque das Nações" },
        
        // Fallback - City Center
        // Fallback - City Center (São Manuel official coordinates)
        { keywords: [], lat: -22.7311, lng: -48.5706, neighborhood: "Centro" }
      ];

      const normalizedInput = addressInput.toLowerCase().trim();
      console.log('Searching for:', normalizedInput);
      
      let matchedLocation = { lat: -22.7219, lng: -48.5715, neighborhood: "Centro" };
      let bestMatchScore = 0;
      let bestMatchDetails = '';

      // Enhanced matching algorithm with partial keyword matching
      for (const location of saoManuelLocations) {
        let score = 0;
        let matchedKeywords = [];
        
        // Exact matches worth more
        for (const keyword of location.keywords) {
          if (normalizedInput.includes(keyword)) {
            score += keyword.length * 3; // Exact matches get triple points
            matchedKeywords.push(`exact: ${keyword}`);
          }
        }
        
        // Partial matches (substring matching)
        for (const keyword of location.keywords) {
          if (keyword.includes(normalizedInput) || normalizedInput.includes(keyword)) {
            score += Math.min(keyword.length, normalizedInput.length) * 2; // Partial matches get double points
            if (!matchedKeywords.includes(`partial: ${keyword}`)) {
              matchedKeywords.push(`partial: ${keyword}`);
            }
          }
        }
        
        // Word-by-word matching
        const inputWords = normalizedInput.split(' ');
        for (const word of inputWords) {
          if (word.length > 2) { // Only consider words with 3+ characters
            for (const keyword of location.keywords) {
              if (keyword.includes(word) || word.includes(keyword)) {
                score += word.length;
                if (!matchedKeywords.includes(`word: ${word}`)) {
                  matchedKeywords.push(`word: ${word}`);
                }
              }
            }
          }
        }
        
        if (score > bestMatchScore) {
          bestMatchScore = score;
          matchedLocation = location;
          bestMatchDetails = matchedKeywords.join(', ');
        }
        
        // Debug logging
        if (score > 0) {
          console.log(`Location: ${location.neighborhood} (${location.lat}, ${location.lng})`);
          console.log(`  Score: ${score}, Keywords: ${matchedKeywords.join(', ')}`);
        }
      }
      
      console.log('Best match:', matchedLocation.neighborhood, 'Score:', bestMatchScore);
      console.log('Matched keywords:', bestMatchDetails);

      const newPosition: [number, number] = [matchedLocation.lat, matchedLocation.lng];
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      setNeighborhood(matchedLocation.neighborhood);
      setSelectedAddress(addressInput);

      // Center map on the location
      if (mapInstance) {
        mapInstance.setView(newPosition, 16);
      }

      onLocationSelect({
        latitude: matchedLocation.lat,
        longitude: matchedLocation.lng,
        address: addressInput,
        neighborhood: matchedLocation.neighborhood
      });

      setAddressInput("");
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    console.log('Drag end triggered');
    const marker = e.target as L.Marker;
    const newPosition = marker.getLatLng();
    
    const newPositionTuple: [number, number] = [newPosition.lat, newPosition.lng];
    setMarkerPosition(newPositionTuple);
    setMapCenter(newPositionTuple); // Also update map center
    setIsDragging(false);
    
    // Update map view
    if (mapInstance) {
      mapInstance.setView(newPositionTuple, 16);
    }
    
    onLocationSelect({
      latitude: newPosition.lat,
      longitude: newPosition.lng,
      address: selectedAddress || `Coordenadas: ${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`,
      neighborhood: neighborhood || "Indeterminado"
    });
  };

  const handleMarkerDragStart = () => {
    console.log('Drag start triggered');
    setIsDragging(true);
  };



  const clearSelection = () => {
    setSelectedAddress(null);
    setNeighborhood(null);
    setAddressInput("");
    const defaultCenter: [number, number] = [-22.7311, -48.5706];
    setMarkerPosition(defaultCenter);
    setMapCenter(defaultCenter);
    onLocationSelect({ latitude: 0, longitude: 0 });
  };



  return (
    <div className="space-y-4">
      {/* Manual Address Mode with Interactive Map */}
      <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Informar Endereço e Ajustar no Mapa
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="address-input" className="text-sm">
                  Descreva o local
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="address-input"
                    type="text"
                    placeholder="Ex: Rua Principal, 123 - Centro"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddressSubmit()}
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={handleAddressSubmit}
                    disabled={!addressInput.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>💡 Dica: Digite o nome da rua, bairro ou ponto de referência</p>
                  <p className="font-medium text-blue-600">📍 Após digitar, mova o marcador vermelho para o local exato do problema</p>
                </div>
              </div>

              {/* Selected Address Display */}
              {selectedAddress && (
                <div className="p-3 bg-background border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedAddress}</p>
                      {neighborhood && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Bairro: <span className="font-medium text-green-600">{neighborhood}</span>
                        </p>
                      )}
                      <p className="text-xs text-blue-600 mt-1">
                        Coordenadas: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                      </p>
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

          {/* Interactive Map */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-3 border-b">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {isDragging ? "Movendo marcador..." : "Arraste o marcador para o local exato"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p className="font-medium text-green-700">👆 Clique e arraste o marcador vermelho</p>
                <p>Posicione exatamente onde está o problema</p>
                <p className="text-blue-600 font-medium">Precisão: {Math.round(markerPosition[0] * 1000000) / 1000000}, {Math.round(markerPosition[1] * 1000000) / 1000000}</p>
              </div>
            </div>
            
            <div className="h-80 w-full">
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                ref={(map) => {
                  if (map) setMapInstance(map);
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={markerPosition}
                  draggable={true}
                  eventHandlers={{
                    dragstart: handleMarkerDragStart,
                    dragend: handleMarkerDragEnd,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Posição Atual</div>
                      <div className="text-xs">
                        Lat: {markerPosition[0].toFixed(6)}<br/>
                        Lng: {markerPosition[1].toFixed(6)}
                      </div>
                      {selectedAddress && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {selectedAddress}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>


    </div>
  );
}