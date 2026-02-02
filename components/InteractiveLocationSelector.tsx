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
      // Usar o sistema híbrido de geocodificação global (precise-geocoding)
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      console.log('Tentando geocodificação para:', addressInput);
      let result = findPreciseLocation(addressInput);
      
      if (result.success && result.lat && result.lng) {
        console.log('Geocodificação bem-sucedida:', result);
        
        const newPosition: [number, number] = [result.lat, result.lng];
        setMarkerPosition(newPosition);
        setMapCenter(newPosition);
        setNeighborhood(result.neighborhood || "Indeterminado");
        setSelectedAddress(result.address);
        
        // Center map with appropriate zoom based on precision
        const zoomLevel = result.precision === 'high' ? 18 : 16;
        if (mapInstance) {
          mapInstance.setView(newPosition, zoomLevel);
        }
        
        onLocationSelect({
          latitude: result.lat,
          longitude: result.lng,
          address: result.address,
          neighborhood: result.neighborhood || "Indeterminado"
        });
        
        setAddressInput("");
        return;
      }
      
      // Fallback: Se não encontrou no banco local, tenta Nominatim
      if (result.needsFallback) {
        console.log('Banco local não tem este endereço, tentando Nominatim...');
        
        try {
          // Criar query para Nominatim
          const query = `${addressInput}, São Manuel, SP, Brasil`;
          
          // Viewbox de São Manuel para priorizar resultados
          const viewbox = '-48.6000,-22.7000,-48.5400,-22.7600';
          
          const url = new URL('https://nominatim.openstreetmap.org/search');
          url.searchParams.append('q', query);
          url.searchParams.append('format', 'json');
          url.searchParams.append('addressdetails', '1');
          url.searchParams.append('limit', '5');
          url.searchParams.append('countrycodes', 'BR');
          url.searchParams.append('viewbox', viewbox);
          url.searchParams.append('bounded', '1');
          
          const response = await fetch(url.toString(), {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data && data.length > 0) {
              // Filtrar por São Manuel
              const saoManuelResults = data.filter((item: any) => {
                const lat = parseFloat(item.lat);
                const lng = parseFloat(item.lon);
                const distance = Math.sqrt(
                  Math.pow(lat - (-22.7311), 2) + Math.pow(lng - (-48.5706), 2)
                );
                return distance < 0.05; // ~5km
              });
              
              if (saoManuelResults.length > 0) {
                const selectedResult = saoManuelResults[0];
                const lat = parseFloat(selectedResult.lat);
                const lng = parseFloat(selectedResult.lon);
                
                console.log('Resultado encontrado via Nominatim:', selectedResult);
                
                const newPosition: [number, number] = [lat, lng];
                setMarkerPosition(newPosition);
                setMapCenter(newPosition);
                setNeighborhood(selectedResult.address?.neighbourhood || "Indeterminado");
                setSelectedAddress(selectedResult.display_name);
                
                if (mapInstance) {
                  mapInstance.setView(newPosition, 17);
                }
                
                onLocationSelect({
                  latitude: lat,
                  longitude: lng,
                  address: addressInput,
                  neighborhood: selectedResult.address?.neighbourhood || "Indeterminado"
                });
                
                setAddressInput("");
                return;
              }
            }
          }
        } catch (err) {
          console.error('Erro no fallback Nominatim:', err);
        }
        
        alert(`Não foi encontrado no banco de dados local. Tente ser mais específico ou verifique a grafia do endereço.`);
        setAddressInput("");
        return;
      }
      
      console.log('Geocodificação falhou:', result.error);
      alert(`Não foi possível encontrar o endereço: ${result.error}`);
      setAddressInput("");
      return;
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