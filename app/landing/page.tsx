"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">São Manuel Cidadão</h1>
              <p className="text-sm text-gray-600">Prefeitura Municipal de São Manuel - SP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Ad Maiora Quotidie</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Registre <span className="text-blue-600">ocorrências</span> e contribua para nossa cidade
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Um sistema simples e eficiente para cidadãos registrarem problemas urbanos e acompanharem soluções.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cadastro Simples</h3>
                  <p className="text-sm text-gray-600">Apenas nome, CPF e contato</p>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Seguro e Rápido</h3>
                  <p className="text-sm text-gray-600">Processo otimizado para menos desistências</p>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Proteção de Dados</h3>
                  <p className="text-sm text-gray-600">Conforme LGPD e segurança garantida</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => router.push("/login-simples")}
                >
                  Acessar Sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 text-lg font-semibold border-2"
                  onClick={() => router.push("/registrar")}
                >
                  Registrar Ocorrência
                </Button>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white font-medium">Sistema Online</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">Buracos na via</span>
                          <span className="text-white font-medium">24</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">Iluminação pública</span>
                          <span className="text-white font-medium">18</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">Lixo irregular</span>
                          <span className="text-white font-medium">12</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-white/80 text-sm text-center">
                        Última atualização: hoje às 14:30
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              © {new Date().getFullYear()} Prefeitura Municipal de São Manuel - SP. Todos os direitos reservados.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Sistema desenvolvido para melhor atender nossa comunidade
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}