"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MapPin, 
  Loader2, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  importance: number;
}

interface ProactiveAddressSearchProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

export function ProactiveAddressSearch({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Digite o endereço...",
  className = ""
}: ProactiveAddressSearchProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Busca proativa de endereços
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length > 3) {
      debounceTimerRef.current = setTimeout(() => {
        searchAddresses(value);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  const searchAddresses = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(true);

    try {
      // Normalizar query
      const normalizedQuery = query
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(normalizedQuery + ', São Manuel')}&` +
        `format=json&` +
        `limit=8&` +
        `addressdetails=1&` +
        `countrycodes=br&` +
        `accept-language=pt-BR`,
        {
          headers: {
            'User-Agent': 'SaoManuel-Ocorrencias-Assistente/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro na busca de endereços');
      }

      const results: AddressSuggestion[] = await response.json();
      
      // Filtrar resultados relevantes para São Manuel
      const filteredResults = results.filter(result => 
        result.address.city?.toLowerCase().includes('são manuel') ||
        result.display_name.toLowerCase().includes('são manuel')
      );

      setSuggestions(filteredResults.slice(0, 5));
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar endereços. Tente novamente.",
        variant: "destructive"
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const fullAddress = suggestion.display_name;
    onChange(fullAddress);
    onLocationSelect({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: fullAddress
    });
    setShowSuggestions(false);
    
    toast({
      title: "Localização selecionada",
      description: `Endereço: ${fullAddress}`
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getAddressPreview = (address: AddressSuggestion['address']) => {
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.neighbourhood) parts.push(address.neighbourhood);
    else if (address.suburb) parts.push(address.suburb);
    if (address.city && !address.city.toLowerCase().includes('são manuel')) {
      parts.push(address.city);
    }
    return parts.join(', ');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim().length > 3 && setSuggestions([]) && searchAddresses(value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full mt-1 w-full z-50 shadow-lg">
          <CardContent className="p-0">
            <ScrollArea className="max-h-60">
              <div className="py-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.lat}-${suggestion.lon}`}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {getAddressPreview(suggestion.address)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.display_name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Importância: {(suggestion.importance * 100).toFixed(0)}%
                        </div>
                      </div>
                      {index === selectedIndex && (
                        <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && value.trim() && (
        <Card className="absolute top-full mt-1 w-full z-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Nenhum endereço encontrado. Tente reformular a busca ou clique no mapa.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}