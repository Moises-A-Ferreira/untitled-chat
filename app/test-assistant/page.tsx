"use client";

import { useState } from "react";
import { SmartAssistant } from "@/components/SmartAssistant";

export default function TestAssistantPage() {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [referencePoint, setReferencePoint] = useState("");
  const [description, setDescription] = useState("");

  // Testes pré-configurados
  const testCases = [
    { name: "Endereço Genérico", address: "Rua Coronel", desc: "", ref: "" },
    { name: "Endereço Completo", address: "Rua Principal, 150 - Centro", desc: "Buraco grande na via", ref: "Próximo à padaria" },
    { name: "Falta Número", address: "Avenida Brasil", desc: "Poste queimado", ref: "" },
    { name: "Coordenadas Inválidas", address: "", desc: "", ref: "", coords: { lat: -23.5505, lng: -46.6333 } }, // São Paulo
    { name: "Descrição Curta", address: "Rua São Paulo, 100", desc: "Problema", ref: "" },
  ];

  const loadTestCase = (testCase: any) => {
    setAddress(testCase.address || "");
    setDescription(testCase.desc || "");
    setReferencePoint(testCase.ref || "");
    if (testCase.coords) {
      setCoordinates(testCase.coords);
    } else {
      setCoordinates(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔬 Diagnóstico do Assistente IA</h1>
          <p className="text-gray-600">Teste completo das funcionalidades de inteligência artificial</p>
        </div>
        
        {/* Painel de Testes Rápidos */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Testes Pré-configurados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => loadTestCase(testCase)}
                className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all hover:scale-105"
              >
                <div className="font-medium text-blue-800">{testCase.name}</div>
                <div className="text-xs text-blue-600 mt-1 line-clamp-2">
                  {testCase.address || 'Sem endereço'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Teste */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Formulário de Teste
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Endereço *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ex: Rua Principal, 150 - Centro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌍 Coordenadas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCoordinates({ lat: -22.7325, lng: -48.5725 })}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    São Manuel (Centro)
                  </button>
                  <button
                    onClick={() => setCoordinates({ lat: -23.5505, lng: -46.6333 })}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    São Paulo (Inválido)
                  </button>
                  <button
                    onClick={() => setCoordinates(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm col-span-2"
                  >
                    Limpar Coordenadas
                  </button>
                </div>
                {coordinates && (
                  <p className="text-xs text-gray-500 mt-2">
                    Atual: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Ponto de Referência
                </label>
                <input
                  type="text"
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Ex: próximo à padaria, esquina com tal rua"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Descrição do Problema *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Descreva detalhadamente: tamanho do problema, horário, frequência, impacto..."
                />
              </div>
            </div>
          </div>

          {/* Painel de Diagnóstico */}
          <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Diagnóstico em Tempo Real
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="font-medium text-blue-300 mb-2">📍 Endereço</div>
                <div className="text-gray-200">"{address || '(vazio)'}"</div>
                <div className="text-xs text-gray-400 mt-1">
                  Caracteres: {address.length} | 
                  Tem número: {/\d+/.test(address) ? 'Sim' : 'Não'} | 
                  Qualidade: {(address ? Math.min(address.length / 20, 1) * 100 : 0).toFixed(0)}%
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="font-medium text-green-300 mb-2">🌍 Coordenadas</div>
                <div className="text-gray-200">
                  {coordinates 
                    ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` 
                    : '(nenhuma)'
                  }
                </div>
                {coordinates && (
                  <div className="text-xs text-gray-400 mt-1">
                    Válida para São Manuel: {
                      coordinates.lat >= -22.75 && coordinates.lat <= -22.70 &&
                      coordinates.lng >= -48.58 && coordinates.lng <= -48.55
                        ? '✅ Sim' 
                        : '❌ Não'
                    }
                  </div>
                )}
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="font-medium text-purple-300 mb-2">🎯 Referência</div>
                <div className="text-gray-200">"{referencePoint || '(vazia)'}"</div>
                <div className="text-xs text-gray-400 mt-1">
                  Caracteres: {referencePoint.length} | 
                  Status: {referencePoint.length > 10 ? '✅ Boa' : '⚠️ Precisa melhorar'}
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="font-medium text-indigo-300 mb-2">📝 Descrição</div>
                <div className="text-gray-200">"{description || '(vazia)'}"</div>
                <div className="text-xs text-gray-400 mt-1">
                  Caracteres: {description.length} | 
                  Status: {
                    description.length === 0 ? '❌ Obrigatória' :
                    description.length < 20 ? '⚠️ Muito curta' :
                    description.length < 50 ? '✅ Aceitável' :
                    '🏆 Excelente'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assistente Inteligente */}
        <div className="mt-6">
          <SmartAssistant
            address={address}
            setAddress={setAddress}
            coordinates={coordinates}
            setCoordinates={setCoordinates}
            referencePoint={referencePoint}
            setReferencePoint={setReferencePoint}
            description={description}
            onLocationSuggestion={(suggestion) => {
              console.log("🚀 [SUGESTÃO RECEBIDA]:", suggestion);
            }}
          />
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Como Testar
          </h3>
          <ul className="text-yellow-700 space-y-2 text-sm">
            <li>• <strong>Clique nos testes pré-configurados</strong> para ver cenários comuns</li>
            <li>• <strong>Digite endereços variados</strong> para testar as sugestões</li>
            <li>• <strong>Veja o diagnóstico em tempo real</strong> no painel da direita</li>
            <li>• <strong>Verifique o console</strong> (F12) para logs detalhados</li>
            <li>• <strong>O assistente deve aparecer sempre</strong> com o ícone verde pulsante</li>
          </ul>
        </div>
      </div>
    </div>
  );
}