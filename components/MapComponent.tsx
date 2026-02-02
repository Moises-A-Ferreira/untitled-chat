"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  MapPin,
  Calendar,
  User,
  Loader2
} from "lucide-react";
// Removed DropdownMenu imports to fix popup positioning issues

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TIPOS_OCORRENCIA: Record<string, string> = {
  buraco: "Buraco na via",
  iluminacao: "Iluminação pública",
  lixo: "Lixo/Entulho irregular",
  calcada: "Calçada danificada",
  sinalizacao: "Sinalização",
  arvore: "Árvore/Poda",
  esgoto: "Esgoto/Saneamento",
  agua: "Vazamento de água",
  outros: "Outros",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  pendente: {
    label: "Novo",
    icon: <AlertCircle className="h-3 w-3" />,
    variant: "destructive",
    color: "#ef4444"
  },
  em_analise: {
    label: "Em Análise",
    icon: <Clock className="h-3 w-3" />,
    variant: "outline",
    color: "#3b82f6"
  },
  atribuido: {
    label: "Atribuído",
    icon: <User className="h-3 w-3" />,
    variant: "secondary",
    color: "#8b5cf6"
  },
  em_andamento: {
    label: "Em Andamento",
    icon: <Loader2 className="h-3 w-3" />,
    variant: "default",
    color: "#f97316"
  },
  resolvido: {
    label: "Resolvido",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
    color: "#10b981"
  },
  fechado: {
    label: "Fechado",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "secondary",
    color: "#6b7280"
  },
  cancelado: {
    label: "Cancelado",
    icon: <XCircle className="h-3 w-3" />,
    variant: "destructive",
    color: "#9ca3af"
  },
};

interface Occurrence {
  id: string;
  tipo: string;
  descricao: string | null;
  status: string;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  user_id: string;
  profiles?: {
    nome_completo: string | null;
    email: string | null;
    telefone: string | null;
  } | null;
}

interface MapComponentProps {
  occurrences: Occurrence[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
  onStatusChange?: (occurrenceId: string, newStatus: string) => void;
  onMarkerClick?: (occurrence: Occurrence) => void;
}

const createCustomIcon = (color: string, isHovered = false, hasImage = false) => {
  const size = isHovered ? 36 : 30;
  const borderWidth = isHovered ? 3 : 2;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        transition: all 0.2s ease;
        transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
      ">
        <!-- Main marker circle -->
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${borderWidth}px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${isHovered ? 20 : 16}" height="${isHovered ? 20 : 16}" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        
        <!-- Image indicator badge -->
        ${hasImage ? `
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            background-color: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  });
};

export function MapComponent({
  occurrences,
  defaultCenter = [-22.7219, -48.5715], // São Manuel coordinates
  defaultZoom = 13,
  onStatusChange,
  onMarkerClick
}: MapComponentProps) {
  const mapRef = useRef<L.Map>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  // Filter occurrences with valid coordinates and exclude closed ones
  const validOccurrences = occurrences.filter(
    (occ) => occ.latitude !== null && 
             occ.longitude !== null && 
             occ.status !== 'fechado'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkerClick = (occurrence: Occurrence) => {
    if (onMarkerClick) {
      onMarkerClick(occurrence);
    }
  };

  const handleStatusChange = (occurrenceId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(occurrenceId, newStatus);
    }
  };

  const openMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      "_blank"
    );
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validOccurrences.map((occurrence) => {
          const statusConfig = STATUS_CONFIG[occurrence.status] || STATUS_CONFIG.pendente;
          const isHovered = hoveredMarker === occurrence.id;
          const hasImage = !!occurrence.foto_url;
          const icon = createCustomIcon(statusConfig.color, isHovered, hasImage);
          
          return (
            <Marker
              key={occurrence.id}
              position={[occurrence.latitude!, occurrence.longitude!]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(occurrence),
                mouseover: () => setHoveredMarker(occurrence.id),
                mouseout: () => setHoveredMarker(null),
              }}
            >
              <Popup className="min-w-[320px] max-w-md">
                <div className="space-y-4">
                  {/* Image Section */}
                  {occurrence.foto_url && (
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <img 
                        src={occurrence.foto_url} 
                        alt="Foto da ocorrência" 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="p-2 bg-gray-100 text-xs text-gray-600 text-center">
                        Foto enviada pelo cidadão
                      </div>
                    </div>
                  )}
                  
                  {/* Header with type and status */}
                  <div className="border-b pb-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-gray-900">
                        {TIPOS_OCORRENCIA[occurrence.tipo] || occurrence.tipo}
                      </h3>
                      <Badge variant={statusConfig.variant} className="gap-1 flex-shrink-0">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    {occurrence.descricao && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {occurrence.descricao}
                      </p>
                    )}
                  </div>

                  {/* Details section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{formatDate(occurrence.created_at)}</span>
                    </div>
                    
                    {occurrence.profiles && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {occurrence.profiles.nome_completo || occurrence.profiles.email}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Lat: {occurrence.latitude?.toFixed(6)}, 
                        Lng: {occurrence.longitude?.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openMaps(occurrence.latitude!, occurrence.longitude!)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Google Maps
                    </Button>
                    
                    {onStatusChange && (
                      <>
                        {/* Quick Resolution Buttons */}
                        {occurrence.status === 'pendente' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleStatusChange(occurrence.id, 'em_analise')}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Analisar
                          </Button>
                        )}
                        
                        {(occurrence.status === 'em_analise' || occurrence.status === 'atribuido') && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleStatusChange(occurrence.id, 'em_andamento')}
                          >
                            <Loader2 className="h-4 w-4 mr-2" />
                            Iniciar
                          </Button>
                        )}
                        
                        {occurrence.status === 'em_andamento' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusChange(occurrence.id, 'resolvido')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Resolver
                          </Button>
                        )}
                        
                        {occurrence.status === 'resolvido' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-gray-600 hover:bg-gray-700"
                            onClick={() => handleStatusChange(occurrence.id, 'fechado')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Fechar
                          </Button>
                        )}
                        
                        {/* Status Change Buttons - Inline approach to avoid popup positioning issues */}
                        <div className="w-full">
                          <div className="text-xs text-gray-500 mb-2 text-center">Alterar Status:</div>
                          <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                            {Object.entries(STATUS_CONFIG)
                              .filter(([status]) => status !== occurrence.status)
                              .map(([status, config]) => (
                                <Button
                                  key={status}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(occurrence.id, status)}
                                  className="text-xs py-1 px-2 h-8"
                                  title={`Alterar para ${config.label}`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                    style={{ backgroundColor: config.color }}
                                  />
                                  {config.label}
                                </Button>
                              ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {validOccurrences.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma ocorrência com localização</p>
            <p className="text-gray-400 text-sm mt-1">
              As ocorrências aparecerão no mapa quando tiverem coordenadas geográficas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapComponent;