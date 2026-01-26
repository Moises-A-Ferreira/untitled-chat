"use client";

import React, { useState } from "react";
import InteractiveLocationSelector from "@/components/InteractiveLocationSelector";
import { MapPin, CheckCircle } from "lucide-react";

export default function TestInteractiveLocationPage() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [testInputs] = useState([
    "Centro",
    "Rua Principal", 
    "Jardim São Paulo",
    "Vila Nova",
    "Escola Municipal",
    "Hospital"
  ]);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    console.log('Selected Location:', location);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Teste de Localização Interativa</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Location Selector */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Seletor de Localização Interativo</h2>
            <InteractiveLocationSelector 
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Results Display */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Localização Selecionada</h2>
            {selectedLocation ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Coordenadas Precisas:</p>
                    <p className="text-sm text-green-700">
                      Latitude: {selectedLocation.latitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-green-700">
                      Longitude: {selectedLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
                
                {selectedLocation.address && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">Descrição:</p>
                    <p className="text-sm text-blue-700">{selectedLocation.address}</p>
                  </div>
                )}
                
                {selectedLocation.neighborhood && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-800">Bairro Identificado:</p>
                    <p className="text-sm text-purple-700">{selectedLocation.neighborhood}</p>
                  </div>
                )}
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Como usar:</p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                    <li>Digite uma descrição do local</li>
                    <li>Clique em "Buscar"</li>
                    <li>Arraste o marcador vermelho para o local exato</li>
                    <li>As coordenadas serão atualizadas automaticamente</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma localização usando o mapa interativo</p>
                <p className="text-sm mt-2">Você poderá mover o marcador para posicionar exatamente onde está o problema</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Instruções para o Munícipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-800 font-medium mb-2">1. Descreva o Local</div>
              <p className="text-sm text-blue-700">Digite uma descrição aproximada como "Rua Principal, 123 - Centro"</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-green-800 font-medium mb-2">2. Ajuste no Mapa</div>
              <p className="text-sm text-green-700">Arraste o marcador vermelho para o local exato do problema</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-purple-800 font-medium mb-2">3. Confirme</div>
              <p className="text-sm text-purple-700">As coordenadas precisas serão salvas para o administrador</p>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Casos de Teste Rápidos</h2>
          <div className="flex flex-wrap gap-2">
            {testInputs.map((input, index) => (
              <button
                key={index}
                onClick={() => {
                  // This would simulate clicking the input in the actual component
                  console.log('Quick test:', input);
                }}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
              >
                {input}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Clique nos botões acima e depois digite o texto no campo de endereço para testar diferentes localizações
          </p>
        </div>
      </div>
    </div>
  );
}