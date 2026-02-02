"use client";

import { useState, useEffect } from "react";



interface SmartAssistantProps {
  address: string;
  setAddress: (address: string) => void;
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (coords: { lat: number; lng: number } | null) => void;
  referencePoint: string;
  setReferencePoint: (ref: string) => void;
  description: string;
  onLocationSuggestion: (suggestion: any) => void;
}

export function SmartAssistant({
  address,
  setAddress,
  coordinates,
  setCoordinates,
  referencePoint,
  setReferencePoint,
  description,
  onLocationSuggestion
}: SmartAssistantProps) {
  const [isActive, setIsActive] = useState(true);
  
  // Sempre manter ativo - apenas mostrar status básico
  useEffect(() => {
    // Mantém o assistente sempre ativo
    setIsActive(true);
  }, []);

  // Assistente minimalista - sempre visível quando ativo
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        <span className="font-medium text-sm">Assistente Inteligente Ativo</span>
      </div>
    </div>
  );
}