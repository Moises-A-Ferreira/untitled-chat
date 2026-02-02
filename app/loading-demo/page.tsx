"use client";

import React, { useState, useEffect } from "react";
import InstitutionalLoadingScreen from "@/components/InstitutionalLoadingScreen";

export default function LoadingDemo() {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Carregando sistema...");
  const [progress, setProgress] = useState(0);

  // Simulate loading process
  useEffect(() => {
    if (showLoading) {
      const messages = [
        "Carregando sistema...",
        "Inicializando serviços...",
        "Conectando ao banco de dados...",
        "Preparando ambiente...",
        "Finalizando carregamento..."
      ];

      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress <= 100) {
            const messageIndex = Math.floor(newProgress / 20);
            setLoadingMessage(messages[Math.min(messageIndex, messages.length - 1)]);
          }
          return newProgress;
        });
      }, 300);

      // Hide loading screen after simulation
      const hideTimer = setTimeout(() => {
        setShowLoading(false);
      }, 3500);

      return () => {
        clearInterval(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [showLoading]);

  const handleReload = () => {
    setProgress(0);
    setLoadingMessage("Carregando sistema...");
    setShowLoading(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Main content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
              Demonstração - Tela de Loading Institucional
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-blue-800 mb-4">Características</h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Fundo azul institucional elegante</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Logo com animação suave de pulse</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Spinner circular discreto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Texto informativo claro</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Fade-out suave ao concluir</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Compatível com desktop e mobile</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-blue-800 mb-4">Simulação</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-2">Progresso atual:</p>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-blue-600 mt-1">{progress}%</p>
                  </div>
                  
                  <button
                    onClick={handleReload}
                    disabled={showLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    {showLoading ? "Carregando..." : "Reiniciar Demonstração"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Instruções de Uso</h2>
            <div className="prose max-w-none">
              <h3 className="text-blue-800">Como implementar:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Importe o componente <code className="bg-gray-100 px-2 py-1 rounded">InstitutionalLoadingScreen</code></li>
                <li>Controle a visibilidade através da prop <code className="bg-gray-100 px-2 py-1 rounded">isLoading</code></li>
                <li>Opcionalmente, customize a mensagem e o logo</li>
                <li>O componente se auto-remove após o fade-out</li>
              </ol>
              
              <h3 className="text-blue-800 mt-6">Propriedades disponíveis:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><code className="bg-gray-100 px-2 py-1 rounded">isLoading</code> - Controla a visibilidade (boolean)</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">onLoaded</code> - Callback quando o loading termina</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">logoSrc</code> - Caminho personalizado para o logo</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">message</code> - Mensagem de carregamento personalizada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Screen Overlay */}
      <InstitutionalLoadingScreen 
        isLoading={showLoading}
        message={loadingMessage}
        onLoaded={() => console.log('Loading completed')}
      />
    </div>
  );
}