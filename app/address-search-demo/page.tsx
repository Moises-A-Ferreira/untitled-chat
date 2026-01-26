"use client";

import React, { useState } from "react";
import AddressSearch from "@/components/AddressSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddressSearchDemo() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  const handleLocationFound = (location: any) => {
    setSelectedLocation(location);
    
    // Adicionar ao histórico
    setSearchHistory(prev => [{
      ...location,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 4)]); // Manter apenas últimos 5
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-primary">📍</span>
              Sistema de Busca de Endereços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Funcionalidades:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Busca por nome da rua usando Nominatim (OpenStreetMap)</li>
                  <li>• Contexto automático: "São Manuel, SP, Brasil"</li>
                  <li>• Rate limiting de 1 requisição por segundo</li>
                  <li>• User-Agent configurado corretamente</li>
                  <li>• Marcador vermelho draggable no mapa</li>
                  <li>• Integração completa com Leaflet</li>
                  <li>• Tratamento de erros e feedback visual</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Como usar:</h3>
                <ol className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Digite o nome completo da rua</li>
                  <li>2. Clique em "Buscar" ou pressione Enter</li>
                  <li>3. O mapa centraliza automaticamente</li>
                  <li>4. Um marcador vermelho aparece na localização</li>
                  <li>5. Arraste o marcador para ajustar a posição exata</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Busca de Endereços</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressSearch 
                  onLocationFound={handleLocationFound}
                  initialCenter={[-22.7311, -48.5706]}
                  initialZoom={15}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Informações da localização selecionada */}
            {selectedLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📍 Localização Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium text-green-700">Coordenadas:</div>
                    <div className="font-mono text-xs bg-muted p-2 rounded">
                      Lat: {selectedLocation.lat.toFixed(6)}<br/>
                      Lng: {selectedLocation.lng.toFixed(6)}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium text-blue-700">Endereço:</div>
                    <div className="text-xs bg-muted p-2 rounded">
                      {selectedLocation.displayName}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Última atualização: {new Date().toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico de buscas */}
            {searchHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Histórico Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchHistory.map((item, index) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded">
                        <div className="font-medium truncate">{item.displayName}</div>
                        <div className="text-muted-foreground">
                          {item.timestamp} • {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exemplos de endereços para teste */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🧪 Exemplos para Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div 
                    className="p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      // Simular clique no input com exemplo
                      const event = new CustomEvent('exampleClick', {
                        detail: 'Rua Principal'
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    📍 Rua Principal
                  </div>
                  <div 
                    className="p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      const event = new CustomEvent('exampleClick', {
                        detail: 'Avenida Brasil'
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    📍 Avenida Brasil
                  </div>
                  <div 
                    className="p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      const event = new CustomEvent('exampleClick', {
                        detail: 'Rua Coronel'
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    📍 Rua Coronel
                  </div>
                  <div 
                    className="p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      const event = new CustomEvent('exampleClick', {
                        detail: 'Praça da Matriz'
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    📍 Praça da Matriz
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}