"use client";

import React, { useState } from "react";
import LocationSelector from "@/components/SimpleLocationSelector";
import { MapPin, CheckCircle } from "lucide-react";

export default function TestLocationPage() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [testInputs, setTestInputs] = useState([
    "Centro",
    "Rua Principal", 
    "Jardim São Paulo",
    "Vila Nova",
    "Escola Municipal",
    "Hospital",
    "Mercado",
    "Posto de Saúde"
  ]);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    console.log('Selected Location:', location);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Teste de Localização</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Selector */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Seletor de Localização</h2>
            <LocationSelector 
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Results Display */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Localização Selecionada</h2>
            {selectedLocation ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Coordenadas:</p>
                    <p className="text-sm text-green-700">
                      Lat: {selectedLocation.latitude}
                    </p>
                    <p className="text-sm text-green-700">
                      Lng: {selectedLocation.longitude}
                    </p>
                  </div>
                </div>
                
                {selectedLocation.address && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">Endereço:</p>
                    <p className="text-sm text-blue-700">{selectedLocation.address}</p>
                  </div>
                )}
                
                {selectedLocation.neighborhood && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-800">Bairro:</p>
                    <p className="text-sm text-purple-700">{selectedLocation.neighborhood}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma localização selecionada</p>
            )}
          </div>
        </div>

        {/* Test Cases */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Casos de Teste</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {testInputs.map((input, index) => (
              <button
                key={index}
                onClick={() => {
                  // Simulate the location selection process
                  const event = {
                    target: { value: input }
                  } as React.ChangeEvent<HTMLInputElement>;
                  
                  // This would normally be handled by the component internally
                  console.log('Testing input:', input);
                }}
                className="p-3 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
              >
                {input}
              </button>
            ))}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Informações de Depuração</h3>
          <p className="text-sm text-yellow-700">
            Coordenadas de São Manuel: Latitude -22.7219, Longitude -48.5715
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Coordenadas esperadas variam por bairro:
          </p>
          <ul className="text-xs text-yellow-600 mt-2 list-disc list-inside">
            <li>Centro: -22.7219, -48.5715</li>
            <li>Jardim São Paulo: -22.7235, -48.5728</li>
            <li>Vila Nova: -22.7201, -48.5692</li>
            <li>Bela Vista: -22.7252, -48.5741</li>
          </ul>
        </div>
      </div>
    </div>
  );
}