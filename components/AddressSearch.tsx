"use client";

import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X } from "lucide-react";
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

interface AddressSearchProps {
  onLocationFound: (location: {
    lat: number;
    lng: number;
    address: string;
    displayName: string;
  }) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

interface SearchResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export default function AddressSearch({
  onLocationFound,
  initialCenter = [-22.7311, -48.5706],
  initialZoom = 15,
}: AddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    displayName: string;
  } | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const lastRequestTime = useRef<number>(0);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Função principal de busca usando sistema híbrido
   * @param query Texto da busca (nome da rua)
   */
  const searchAddress = async (query: string) => {
    // Limpar timeouts anteriores
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Validar entrada
    if (!query.trim()) {
      setError("Por favor, digite um endereço válido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // PRIMEIRO: Tentar sistema de geocodificação local precisa para São Manuel
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      const localResult = findPreciseLocation(query);
      
      if (localResult.success && localResult.lat && localResult.lng) {
        console.log('Geocodificação local precisa bem-sucedida:', localResult);
        
        // Criar resultado formatado
        const result: SearchResult = {
          lat: localResult.lat,
          lng: localResult.lng,
          displayName: `${localResult.address}, ${localResult.neighborhood}, São Manuel - SP`,
          address: {
            road: localResult.address,
            neighbourhood: localResult.neighborhood,
            city: localResult.city || 'São Manuel',
            state: 'São Paulo',
            country: 'Brasil'
          }
        };
        
        setSearchResults([result]);
        selectLocation(result);
        setIsLoading(false);
        return;
      }
      
      console.log('Geocodificação local não encontrou resultado, usando Nominatim...');

      // SEGUNDO: Fallback para Nominatim API se não encontrou localmente
      // Respeitar limite de 1 requisição por segundo
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      if (timeSinceLastRequest < 1000) {
        // Aguardar para respeitar o rate limit
        const delay = 1000 - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      lastRequestTime.current = Date.now();

      // Formatar query com contexto automático
      const fullQuery = `${query}, São Manuel, SP, Brasil`;
      
      // Configurar headers conforme requisitos do Nominatim
      const headers = {
        'User-Agent': 'SaoManuel-Ocorrencias-App/1.0 (moi.sm@outlook.com)',
        'Accept': 'application/json'
      };

      // SEGUNDO: Fallback para Nominatim API com viewbox de São Manuel
      lastRequestTime.current = Date.now();
      
      // Viewbox para São Manuel (prioriza resultados nesta área)
      const viewbox = '-48.6000,-22.7000,-48.5400,-22.7600';
      
      // Tentar múltiplas variações da query
      const searchVariations = [
        `${query}, São Manuel, SP, Brasil`,
        `${query}, São Manuel, São Paulo`,
        `${query}, São Manuel - SP`
      ];
      
      let allResults: SearchResult[] = [];
      
      for (const searchQuery of searchVariations) {
        try {
          const url = new URL('https://nominatim.openstreetmap.org/search');
          url.searchParams.append('q', searchQuery);
          url.searchParams.append('format', 'json');
          url.searchParams.append('addressdetails', '1');
          url.searchParams.append('limit', '5');
          url.searchParams.append('countrycodes', 'BR');
          url.searchParams.append('viewbox', viewbox);
          url.searchParams.append('bounded', '1'); // Prioriza viewbox
          url.searchParams.append('accept-language', 'pt-BR,pt');
          
          const response = await fetch(url.toString(), { 
            headers, 
            signal: AbortSignal.timeout(5000) 
          });

          if (!response.ok) {
            console.warn(`Erro na API para query "${searchQuery}": ${response.status}`);
            continue;
          }

          const data = await response.json();

          if (data && data.length > 0) {
            // Filtrar resultados próximos a São Manuel
            const localResults = data.filter((item: any) => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              const distance = Math.sqrt(
                Math.pow(lat - (-22.7311), 2) + Math.pow(lon - (-48.5706), 2)
              );
              return distance < 0.05; // ~5km
            });
            
            if (localResults.length > 0) {
              allResults = localResults.map((item: any) => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName: item.display_name,
                address: item.address || {}
              }));
              
              console.log(`Encontrados ${allResults.length} resultados com query: "${searchQuery}"`);
              break; // Parar na primeira query bem-sucedida
            }
          }
          
          // Aguardar 1 segundo entre requisições (rate limit)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (err) {
          console.error(`Erro na busca com query "${searchQuery}":`, err);
          continue;
        }
      }

      if (allResults.length === 0) {
        // Último recurso: tentar sem filtro de distância e pegar o primeiro resultado do último request
        try {
          const fallbackUrl = new URL('https://nominatim.openstreetmap.org/search');
          fallbackUrl.searchParams.append('q', `${query}, São Manuel, SP, Brasil`);
          fallbackUrl.searchParams.append('format', 'json');
          fallbackUrl.searchParams.append('addressdetails', '1');
          fallbackUrl.searchParams.append('limit', '1');
          fallbackUrl.searchParams.append('countrycodes', 'BR');

          const fallbackResponse = await fetch(fallbackUrl.toString(), { 
            headers, 
            signal: AbortSignal.timeout(5000) 
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && fallbackData.length > 0) {
              allResults = [{
                lat: parseFloat(fallbackData[0].lat),
                lng: parseFloat(fallbackData[0].lon),
                displayName: fallbackData[0].display_name,
                address: fallbackData[0].address || {}
              }];
            }
          }
        } catch (err) {
          console.error('Fallback Nominatim sem filtro falhou:', err);
        }

        if (allResults.length === 0) {
          setError("Endereço não encontrado em São Manuel. Tente ser mais específico ou use outra forma de escrever.");
          setSearchResults([]);
          return;
        }
      }

      // Processar resultados
      setSearchResults(allResults);
      
      // Selecionar primeiro resultado automaticamente
      if (allResults.length > 0) {
        const firstResult = allResults[0];
        selectLocation(firstResult);
      }

    } catch (err: any) {
      console.error("Erro na busca:", err);
      
      if (err.name === 'AbortError') {
        setError("Tempo limite excedido. Tente novamente.");
      } else if (err.message.includes('429')) {
        setError("Muitas requisições. Aguarde um momento.");
      } else {
        setError(`Erro na busca: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Selecionar localização e atualizar mapa
   * @param result Resultado da busca
   */
  const selectLocation = (result: SearchResult) => {
    const location = {
      lat: result.lat,
      lng: result.lng,
      displayName: result.displayName
    };

    setSelectedLocation(location);
    
    // Centralizar mapa na localização encontrada
    if (mapRef.current) {
      mapRef.current.setView([result.lat, result.lng], 17);
    }

    // Chamar callback com resultado
    onLocationFound({
      lat: result.lat,
      lng: result.lng,
      address: result.address.road || "Endereço não especificado",
      displayName: result.displayName
    });
  };

  /**
   * Lidar com submit do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchAddress(searchQuery);
    }
  };

  /**
   * Lidar com mudança no input com debounce
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Limpar erro ao digitar
    if (error) setError(null);
    
    // Limpar seleção anterior
    if (selectedLocation) setSelectedLocation(null);
  };

  /**
   * Limpar busca
   */
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedLocation(null);
    setError(null);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário de busca */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="address-search" className="text-sm font-medium">
            Buscar Endereço
          </Label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                id="address-search"
                type="text"
                placeholder="Ex: Rua Plinio Aristides Targa"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="pr-10"
                disabled={isLoading}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !searchQuery.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            💡 Dica: Digite o nome completo da rua. O sistema adiciona automaticamente "São Manuel, SP, Brasil".
          </p>
        </div>
      </form>

      {/* Resultados da busca */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted">
          <h3 className="font-medium text-sm mb-2">Resultados encontrados:</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded cursor-pointer border text-sm ${
                  selectedLocation?.displayName === result.displayName
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                }`}
                onClick={() => selectLocation(result)}
              >
                <div className="font-medium">
                  {result.address.road || "Rua não especificada"}
                </div>
                <div className="text-xs opacity-75">
                  {result.address.neighbourhood || result.address.suburb || "Bairro não especificado"}
                  {result.address.city && `, ${result.address.city}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapa interativo */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-3 border-b">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedLocation 
                ? `Localização: ${selectedLocation.displayName}` 
                : "Mapa de São Manuel"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedLocation 
              ? "Clique e arraste o marcador para ajustar a posição exata"
              : "Digite um endereço acima para localizar no mapa"}
          </p>
        </div>
        
        <div className="h-80 w-full">
          <MapContainer
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : initialCenter}
            zoom={selectedLocation ? 17 : initialZoom}
            style={{ height: '100%', width: '100%' }}
            ref={(map) => {
              if (map) mapRef.current = map;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marcador da localização selecionada */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const newPosition = marker.getLatLng();
                    
                    // Atualizar posição do marcador
                    setSelectedLocation({
                      ...selectedLocation,
                      lat: newPosition.lat,
                      lng: newPosition.lng
                    });
                    
                    // Chamar callback com nova posição
                    onLocationFound({
                      lat: newPosition.lat,
                      lng: newPosition.lng,
                      address: selectedLocation.displayName,
                      displayName: selectedLocation.displayName
                    });
                  }
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium mb-1">Localização Selecionada</div>
                    <div className="text-xs">
                      Lat: {selectedLocation.lat.toFixed(6)}<br/>
                      Lng: {selectedLocation.lng.toFixed(6)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {selectedLocation.displayName}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}