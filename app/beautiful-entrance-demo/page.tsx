"use client";

import React, { useState } from "react";
import InstitutionalLoadingScreen from "@/components/InstitutionalLoadingScreen";

export default function BeautifulEntranceDemo() {
  const [showLoading, setShowLoading] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  const handleRestart = () => {
    setShowLoading(false);
    setTimeout(() => {
      setShowLoading(true);
      setCycleCount(prev => prev + 1);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Demonstração de Animação de Entrada Aprimorada
        </h1>
        <p className="text-blue-200 text-lg mb-8">
          Veja a nova animação de entrada mais elegante e profissional
        </p>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Características da Nova Animação:</h2>
          <ul className="text-left text-blue-100 space-y-2 mb-6">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Entrada escalonada com timing preciso</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Animação "pop" elegante para a logo</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Elementos flutuantes no background</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Efeito de brilho pulsante na logo</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Transições suaves e profissionais</span>
            </li>
          </ul>
          
          <button
            onClick={handleRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {showLoading ? "Assistir Animação" : "Reiniciar Demonstração"}
          </button>
          
          <p className="text-blue-300 mt-4 text-sm">
            Ciclo atual: {cycleCount + 1}
          </p>
        </div>
      </div>

      <div className="text-center text-blue-300 text-sm mt-8">
        <p>Observação: A animação completa leva cerca de 2 segundos para se apresentar totalmente</p>
      </div>

      {/* Loading Screen Overlay */}
      <InstitutionalLoadingScreen 
        isLoading={showLoading}
        message="Demonstrando animação aprimorada..."
        onLoaded={() => console.log('Beautiful entrance animation completed')}
      />
    </div>
  );
}