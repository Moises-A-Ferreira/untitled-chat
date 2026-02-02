"use client";

import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  MapPin,
  Calendar,
  Bell,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SatisfactionFeedback from "@/components/SatisfactionFeedback";

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
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendente: {
    label: "Pendente",
    icon: <Clock className="h-3 w-3" />,
    variant: "secondary",
  },
  em_analise: {
    label: "Em análise",
    icon: <AlertCircle className="h-3 w-3" />,
    variant: "outline",
  },
  em_andamento: {
    label: "Em andamento",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    variant: "default",
  },
  concluido: {
    label: "Concluído",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
  },
  fechado: {
    label: "Fechado",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
  },
  cancelado: {
    label: "Cancelado",
    icon: <XCircle className="h-3 w-3" />,
    variant: "destructive",
  },
  finalizado: {
    label: "Finalizado",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
  },
  resolvido: {
    label: "Resolvido",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
  },
};

type Ocorrencia = {
  id: number;
  tipo: string;
  descricao: string | null;
  status: string;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at?: string;
};

export default function MinhasOcorrenciasPage() {
  const router = useRouter();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<{[key: number]: boolean}>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

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
        setCurrentUser(data.user);
        setCheckingAuth(false);
        loadOcorrencias(data.user.id);
      } catch (err) {
        console.error("[minhas-ocorrencias] auth check error", err);
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const loadOcorrencias = async (userId: number) => {
    try {
      const response = await fetch(`/api/user/${userId}/ocorrencias`);
      const data = await response.json();
      
      if (response.ok) {
        setOcorrencias(data.ocorrencias || []);
        // Check for new updates
        checkForUpdates(data.ocorrencias);
      }
    } catch (error) {
      console.error("[minhas-ocorrencias] error loading ocorrencias:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = (currentOcorrencias: Ocorrencia[]) => {
    const newNotifications: {[key: number]: boolean} = {};
    const lastCheckTime = lastChecked.getTime();
    
    currentOcorrencias.forEach(oc => {
      const updatedAt = new Date(oc.updated_at || oc.created_at).getTime();
      if (updatedAt > lastCheckTime) {
        newNotifications[oc.id] = true;
      }
    });
    
    if (Object.keys(newNotifications).length > 0) {
      setNotifications(newNotifications);
      // Show notification toast or banner
      showNotificationBanner(Object.keys(newNotifications).length);
    }
    
    setLastChecked(new Date());
  };

  const showNotificationBanner = (count: number) => {
    // Create a temporary banner notification
    const banner = document.createElement('div');
    banner.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2';
    banner.innerHTML = `
      <Bell className="h-5 w-5" />
      <span>${count} ${count === 1 ? 'ocorrência foi' : 'ocorrências foram'} atualizada${count === 1 ? '' : 's'}!</span>
    `;
    document.body.appendChild(banner);
    
    setTimeout(() => {
      banner.classList.add('animate-fade-out');
      setTimeout(() => document.body.removeChild(banner), 300);
    }, 5000);
  };

  const clearNotification = (id: number) => {
    setNotifications(prev => {
      const newNotifications = {...prev};
      delete newNotifications[id];
      return newNotifications;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const refreshOcorrencias = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.user) {
        await loadOcorrencias(data.user.id);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setLoading(false);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Enhanced Header with São Manuel Branding */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/registrar">
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
                <p className="text-sm text-gray-600 font-medium">Meus Chamados</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshOcorrencias}
              disabled={loading}
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-full"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Link href="/registrar">
              <Button size="icon" className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="h-5 w-5" />
                <span className="sr-only">Nova ocorrência</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Enhanced Content */}
      <section className="flex-1 py-6 px-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Meus Chamados
            </h1>
            <p className="text-gray-600">
              {ocorrencias.length}{' '}
              {ocorrencias.length === 1 ? 'chamado registrado' : 'chamados registrados'}
            </p>
          </div>
        </div>
              
        {/* Feedback Section - Appears when user enters the app */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Avalie sua experiência
          </h2>
          <p className="text-gray-600 mb-4">Sua opinião é muito importante para melhorar nossos serviços</p>
          <SatisfactionFeedback 
            ocorrenciaId={0} // ID 0 indica feedback geral do sistema
            userId={currentUser?.id || 0}
          />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <p className="text-blue-700 font-medium text-lg">Carregando seus chamados...</p>
              <p className="text-gray-500 text-sm mt-2">Aguarde um momento</p>
            </div>
          </div>
        ) : ocorrencias.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-xl opacity-30"></div>
              <div className="relative w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Nenhum chamado registrado
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Você ainda não registrou nenhum chamado. Ajude a melhorar nossa cidade reportando problemas urbanos.
            </p>
            <Link href="/registrar">
              <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-5 w-5 mr-2" />
                Registrar novo chamado
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ocorrencias.map((ocorrencia) => {
              const statusConfig = STATUS_CONFIG[ocorrencia.status] || STATUS_CONFIG.pendente;
              const hasNotification = notifications[ocorrencia.id];
              
              return (
                <div
                  key={ocorrencia.id}
                  className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group ${
                    hasNotification ? 'ring-2 ring-green-400 animate-pulse-once' : ''
                  }`}
                  onClick={() => hasNotification && clearNotification(ocorrencia.id)}
                >
                  {/* Notification indicator */}
                  {hasNotification && (
                    <div className="bg-green-500 text-white px-4 py-2 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm font-medium">Atualizado! Clique para ver</span>
                    </div>
                  )}
                  
                  {ocorrencia.foto_url && (
                    <div className="relative">
                      <img
                        src={ocorrencia.foto_url}
                        alt={TIPOS_OCORRENCIA[ocorrencia.tipo] || ocorrencia.tipo}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-gray-800 text-lg flex-1">
                        {TIPOS_OCORRENCIA[ocorrencia.tipo] || ocorrencia.tipo}
                      </h3>
                      <Badge 
                        variant={statusConfig.variant} 
                        className="gap-1.5 shrink-0 px-3 py-1.5 text-sm font-semibold"
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {ocorrencia.descricao && (
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {ocorrencia.descricao}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(ocorrencia.created_at)}
                      </div>
                      {ocorrencia.latitude && ocorrencia.longitude && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {ocorrencia.latitude.toFixed(4)}, {ocorrencia.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {ocorrencia.updated_at && ocorrencia.updated_at !== ocorrencia.created_at && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Atualizado em: {formatDate(ocorrencia.updated_at)}
                        </p>
                      </div>
                    )}
                    
                    {/* Mostrar o componente de feedback para ocorrências finalizadas */}
                    {(ocorrencia.status === 'concluido' || ocorrencia.status === 'finalizado' || ocorrencia.status === 'resolvido') && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <SatisfactionFeedback 
                          ocorrenciaId={ocorrencia.id} 
                          userId={currentUser?.id}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-lg border-t border-white/30 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Prefeitura Municipal de São Manuel - SP • Ad Maiora Quotidie
          </p>
        </div>
      </footer>
    </main>
  );
}