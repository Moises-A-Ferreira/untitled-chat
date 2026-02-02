"use client";

import React from "react"

import { useState, useEffect, useRef } from "react";
import LocationSelector from "@/components/DynamicLocationSelector";
import { SmartAssistant } from "@/components/SmartAssistant";
import { ProactiveAddressSearch } from "@/components/ProactiveAddressSearch";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SatisfactionFeedback from "@/components/SatisfactionFeedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS_OCORRENCIA = [
  { value: "buraco", label: "Buraco na via" },
  { value: "iluminacao", label: "Iluminação pública" },
  { value: "lixo", label: "Lixo/Entulho irregular" },
  { value: "calcada", label: "Calçada danificada" },
  { value: "sinalizacao", label: "Sinalização" },
  { value: "arvore", label: "Árvore/Poda" },
  { value: "esgoto", label: "Esgoto/Saneamento" },
  { value: "agua", label: "Vazamento de água" },
  { value: "outros", label: "Outros" },
];

// Using the geolocation hook instead of manual state management

export default function RegistrarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ 
    latitude: number; 
    longitude: number; 
    address?: string;
    neighborhood?: string;
  } | null>(null);
  const [enderecoManual, setEnderecoManual] = useState("");
  const [pontoReferencia, setPontoReferencia] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: number } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const data = await res.json();
        if (!data?.user) {
          router.push("/login");
          return;
        }
        setUser({ id: data.user.id });
      } catch (err) {
        console.error("[registrar] auth check error", err);
        router.push("/login");
        return;
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // Location is now handled by LocationSelector component

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 5MB");
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFoto(null);
    setFotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          descricao,
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
          endereco: selectedLocation?.address || enderecoManual,
          bairro: selectedLocation?.neighborhood,
          ponto_referencia: pontoReferencia
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Erro ao enviar ocorrência. Tente novamente.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.log("[v0] Submit error:", err);
      setError("Erro ao enviar ocorrência. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <p className="text-blue-700 font-medium text-lg">Verificando autenticação...</p>
          <p className="text-gray-500 text-sm mt-2">Aguarde um momento</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
        {/* Enhanced Success Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/registrar">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-green-600 hover:bg-green-50 hover:text-green-800 rounded-full"
                >
                  <ArrowLeft className="h-6 w-6" />
                  <span className="sr-only">Voltar</span>
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative bg-white rounded-xl p-2 shadow-lg border border-white/50">
                    <Image
                      src="/brasao.png"
                      alt="Brasão de São Manuel"
                      width={48}
                      height={48}
                      className="rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
                    São Manuel
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">Sucesso!</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Success Content */}
        <section className="flex-1 py-12 px-4 max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent mb-6">
            Ocorrência Registrada!
          </h1>
          
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-xl mb-10 max-w-lg">
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">
              Parabéns! Sua solicitação foi enviada com sucesso para a Prefeitura Municipal de São Manuel.
            </p>
            <div className="space-y-3 text-left bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">Protocolo gerado automaticamente</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">Equipe técnica será acionada</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">Você receberá atualizações por e-mail</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 w-full max-w-md">
            <Button
              size="lg"
              className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => router.push("/meus-chamados")}
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Acompanhar minhas ocorrências</span>
              </div>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 text-xl font-bold rounded-2xl border-2 border-green-600 text-green-700 bg-white hover:bg-green-50 shadow-lg transition-all duration-300 hover:scale-[1.02]"
              onClick={() => {
                setSuccess(false);
                setTipo("");
                setDescricao("");
                setFoto(null);
                setFotoFile(null);
                setSelectedLocation(null);
                setEnderecoManual("");
                setPontoReferencia("");
              }}
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9.5 9h5" />
                  <path d="M8 12h8" />
                </svg>
                <span>Registrar nova ocorrência</span>
              </div>
            </Button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200/50">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Como foi sua experiência?</h3>
              <SatisfactionFeedback 
                ocorrenciaId={0} // ID temporário, pois a ocorrência ainda não foi criada
                userId={user?.id || 0}
              />
            </div>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Obrigado por ajudar a tornar São Manuel uma cidade melhor! 🇧🇷
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>Prefeitura Municipal de São Manuel - SP</span>
              <span>•</span>
              <span>Ad Maiora Quotidie</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Enhanced Header with São Manuel Branding */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-full"
              >
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Voltar</span>
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-white rounded-xl p-2 shadow-lg border border-white/50">
                  <Image
                    src="/brasao.png"
                    alt="Brasão de São Manuel"
                    width={48}
                    height={48}
                    className="rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
                  São Manuel
                </h1>
                <p className="text-sm text-gray-600 font-medium">Cidadão Digital</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/meus-chamados">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-sm font-medium border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 rounded-xl transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="hidden sm:inline">Meus Chamados</span>
                <span className="sm:hidden">Chamados</span>
              </Button>
            </Link>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700">Sistema Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Content Area */}
      <section className="flex-1 py-8 px-4 max-w-4xl mx-auto w-full">
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">\                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9.5 9h5" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Registrar Ocorrência
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Ajude a melhorar nossa cidade relatando problemas urbanos. Sua contribuição é fundamental para São Manuel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">Dados da ocorrência</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">Confirmação</span>
            </div>
          </div>
          {/* Enhanced Tipo de ocorrência */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9.5 9h5" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div>
                <Label htmlFor="tipo" className="text-lg font-semibold text-gray-800">
                  Tipo de ocorrência
                </Label>
                <p className="text-sm text-gray-500">Selecione a categoria do problema *</p>
              </div>
            </div>
            <Select value={tipo} onValueChange={setTipo} required>
              <SelectTrigger className="h-14 text-base bg-white/80 border-2 border-gray-200/50 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/30 transition-all duration-300 rounded-xl">
                <SelectValue placeholder="Escolha o tipo de problema" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-xl">
                {TIPOS_OCORRENCIA.map((t) => (
                  <SelectItem 
                    key={t.value} 
                    value={t.value}
                    className="py-3 px-4 hover:bg-blue-50 rounded-lg mx-1 my-0.5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{t.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Descrição e Ponto de Referência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div>
                  <Label htmlFor="descricao" className="text-lg font-semibold text-gray-800">
                    Descrição detalhada
                  </Label>
                  <p className="text-sm text-gray-500">Conte mais sobre o problema (opcional)</p>
                </div>
              </div>
              <Textarea
                id="descricao"
                placeholder="Descreva o problema com mais detalhes... Por exemplo: tamanho do buraco, horário que percebeu, frequência, etc."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="min-h-32 text-base resize-none bg-white/80 border-2 border-gray-200/50 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/30 transition-all duration-300 rounded-xl p-4"
              />
              <p className="text-xs text-gray-400 mt-2 ml-1">Dicas: mencione tamanho, local exato, horário e qualquer informação relevante</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                  </svg>
                </div>
                <div>
                  <Label htmlFor="referencia" className="text-lg font-semibold text-gray-800">
                    Ponto de referência
                  </Label>
                  <p className="text-sm text-gray-500">Ajude a localizar (ex: próximo à padaria)</p>
                </div>
              </div>
              <Textarea
                id="referencia"
                placeholder="Ex: próximo à padaria, esquina com tal rua, frente ao número 100"
                value={pontoReferencia}
                onChange={(e) => setPontoReferencia(e.target.value)}
                className="min-h-32 text-base resize-none bg-white/80 border-2 border-gray-200/50 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/30 transition-all duration-300 rounded-xl p-4"
              />
              <p className="text-xs text-gray-400 mt-2 ml-1">Importante para equipes de campo encontrarem o local</p>
            </div>
          </div>

          {/* Enhanced Foto */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Camera className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Label className="text-lg font-semibold text-gray-800">
                  Foto da ocorrência
                </Label>
                <p className="text-sm text-gray-500">Mostre onde está o problema (opcional mas recomendado)</p>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="foto-input"
            />

            {foto ? (
              <div className="relative group/image rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg">
                <img
                  src={foto}
                  alt="Foto da ocorrência"
                  className="w-full h-52 object-cover transition-transform duration-300 group-hover/image:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-3 right-3 shadow-lg hover:scale-110 transition-transform"
                  onClick={removeFoto}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remover foto</span>
                </Button>
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium">Foto adicionada</p>
                </div>
              </div>
            ) : (
              <label
                htmlFor="foto-input"
                className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-purple-300/50 rounded-xl cursor-pointer hover:bg-purple-50/50 hover:border-purple-400 transition-all duration-300 group/foto bg-white/50"
              >
                <div className="flex flex-col items-center gap-3 p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover/foto:bg-purple-200 transition-colors">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-purple-700 font-semibold mb-1">Adicionar foto</p>
                    <p className="text-sm text-purple-500">Clique para tirar foto ou escolher da galeria</p>
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Enhanced Localização */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Label className="text-lg font-semibold text-gray-800">
                  Localização exata
                </Label>
                <p className="text-sm text-gray-500">Indique onde está o problema no mapa</p>
              </div>
            </div>
            
            {/* Campo de busca proativa de endereços */}
            <div className="mb-4">
              <Label htmlFor="endereco" className="text-base font-medium text-gray-700 mb-2 block">
                Buscar endereço (opcional)
              </Label>
              <ProactiveAddressSearch
                value={enderecoManual}
                onChange={setEnderecoManual}
                onLocationSelect={(location) => {
                  setSelectedLocation({
                    latitude: location.lat,
                    longitude: location.lng,
                    address: location.address
                  });
                  // Extrair bairro do endereço se possível
                  const bairroMatch = location.address.match(/(?:bairro|distrito)\s+([^,]+)/i);
                  if (bairroMatch) {
                    setSelectedLocation(prev => ({
                      ...prev!,
                      neighborhood: bairroMatch[1].trim()
                    }));
                  }
                }}
                placeholder="Digite o endereço (ex: Rua Principal, 150)"
              />
              <p className="text-xs text-gray-500 mt-2">Sistema integrado ao OpenStreetMap para sugestões precisas</p>
            </div>
            
            <div className="rounded-xl overflow-hidden border-2 border-gray-200/30 shadow-inner bg-white/50">
              <LocationSelector 
                onLocationSelect={setSelectedLocation}
                initialLocation={selectedLocation ? { 
                  latitude: selectedLocation.latitude, 
                  longitude: selectedLocation.longitude 
                } : null}
              />
            </div>
            
            {/* Enhanced Display selected location */}
            {selectedLocation && selectedLocation.latitude !== 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl shadow-sm animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-green-800 mb-2">
                      Localização confirmada!
                    </p>
                    <div className="space-y-1">
                      {selectedLocation.address && (
                        <p className="text-sm text-green-700 flex items-start gap-2">
                          <span className="font-medium">📍</span>
                          {selectedLocation.address}
                        </p>
                      )}
                      {selectedLocation.neighborhood && (
                        <p className="text-sm text-green-600 flex items-center gap-2">
                          <span className="font-medium">🏘️</span>
                          Bairro: {selectedLocation.neighborhood}
                        </p>
                      )}
                      <p className="text-xs text-green-600 bg-green-100 rounded-lg px-2 py-1 inline-block mt-2">
                        📍 Coordenadas: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-shake">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-red-800 mb-1">Ops! Algo deu errado</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-4 pb-2 -mx-6 px-6">
            <Button
              type="submit"
              size="lg"
              className={`w-full h-16 text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                submitting || !tipo || !selectedLocation || selectedLocation.latitude === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-blue-500/30 hover:shadow-blue-500/50'
              }`}
              disabled={submitting || !tipo || !selectedLocation || selectedLocation.latitude === 0}
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Enviando sua ocorrência...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span>Enviar ocorrência para São Manuel</span>
                </div>
              )}
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-3">
              Ao enviar, você concorda com os termos de uso da plataforma
            </p>
          </div>
        </form>
        
        {/* Assistente Inteligente Proativo */}
        <SmartAssistant
          address={enderecoManual || selectedLocation?.address || ""}
          setAddress={setEnderecoManual}
          coordinates={selectedLocation ? { 
            lat: selectedLocation.latitude, 
            lng: selectedLocation.longitude 
          } : null}
          setCoordinates={(coords) => {
            if (coords) {
              setSelectedLocation({
                latitude: coords.lat,
                longitude: coords.lng,
                address: selectedLocation?.address
              });
            }
          }}
          referencePoint={pontoReferencia}
          setReferencePoint={setPontoReferencia}
          description={descricao}
          onLocationSuggestion={(suggestion) => {
            // Tratar sugestões do assistente
            console.log("Sugestão do assistente:", suggestion);
          }}
        />
      </section>
    </main>
  );
}
