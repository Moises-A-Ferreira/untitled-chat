"use client";

import React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  MapPin,
  Calendar,
  User,
  RefreshCw,
  Search,
  ChevronDown,
  List,
  Map,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import Loading from "./loading"; // Import the Loading component
import DynamicMap from "@/components/DynamicMap";

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

const STATUS_OPTIONS = [
  { value: "pendente", label: "Novo", color: "bg-red-500" },
  { value: "em_analise", label: "Em Análise", color: "bg-blue-500" },
  { value: "atribuido", label: "Atribuído", color: "bg-purple-500" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-orange-500" },
  { value: "resolvido", label: "Resolvido", color: "bg-green-500" },
  { value: "fechado", label: "Fechado", color: "bg-gray-500" },
  { value: "cancelado", label: "Cancelado", color: "bg-gray-400" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendente: {
    label: "Novo",
    icon: <AlertCircle className="h-3 w-3" />,
    variant: "destructive",
  },
  em_analise: {
    label: "Em Análise",
    icon: <Clock className="h-3 w-3" />,
    variant: "outline",
  },
  atribuido: {
    label: "Atribuído",
    icon: <User className="h-3 w-3" />,
    variant: "secondary",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: <Loader2 className="h-3 w-3" />,
    variant: "default",
  },
  resolvido: {
    label: "Resolvido",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
  },
  fechado: {
    label: "Fechado",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "secondary",
  },
  cancelado: {
    label: "Cancelado",
    icon: <XCircle className="h-3 w-3" />,
    variant: "destructive",
  },
};

type Ocorrencia = {
  id: string;
  tipo: string;
  descricao: string | null;
  status: string;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  user_id: string;
  profiles: {
    nome_completo: string | null;
    email: string | null;
    telefone: string | null;
  } | null;
};

type Stats = {
  total: number;
  pendente: number;
  em_analise: number;
  em_andamento: number;
  concluido: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Use useSearchParams here
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [filteredOcorrencias, setFilteredOcorrencias] = useState<Ocorrencia[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pendente: 0,
    em_analise: 0,
    em_andamento: 0,
    concluido: 0,
  });

  const loadOcorrencias = async () => {
    setLoading(true);
    
    try {
      // Load from file-based database with admin parameter
      const response = await fetch('/api/admin/dashboard?admin=true');
      const result = await response.json();
      
      if (result.ocorrencias) {
        // Transform the data to match the expected structure
        const transformedData = result.ocorrencias.map((item: any) => ({
          id: item.id.toString(),
          tipo: item.tipo,
          descricao: item.descricao,
          status: item.status,
          foto_url: item.foto_url,
          latitude: item.latitude,
          longitude: item.longitude,
          created_at: item.created_at,
          user_id: item.user.id.toString(),
          profiles: {
            nome_completo: item.user.nome,
            email: item.user.email,
            telefone: item.user.telefone,
          }
        }));
        
        setOcorrencias(transformedData);
        
        // Calculate stats
        const newStats: Stats = {
          total: transformedData.length,
          pendente: transformedData.filter((o: any) => o.status === "pendente").length,
          em_analise: transformedData.filter((o: any) => o.status === "em_analise").length,
          em_andamento: transformedData.filter((o: any) => o.status === "em_andamento").length,
          concluido: transformedData.filter((o: any) => o.status === "resolvido" || o.status === "fechado").length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.log("[v0] Error loading ocorrencias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for admin session in local storage or cookies
        const adminToken = localStorage.getItem('admin_session');
        
        if (!adminToken) {
          // Check if we can access the admin occurrences API
          const response = await fetch('/api/admin/dashboard?admin=true');
          if (response.status === 401 || response.status === 403) {
            router.push("/admin");
            return;
          }
        }
        
        setCheckingAuth(false);
        loadOcorrencias();
      } catch (error) {
        console.log("[v0] Error checking auth:", error);
        router.push("/admin");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    let filtered = [...ocorrencias];

    if (filterStatus !== "all") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    if (filterTipo !== "all") {
      filtered = filtered.filter((o) => o.tipo === filterTipo);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.descricao?.toLowerCase().includes(term) ||
          o.profiles?.nome_completo?.toLowerCase().includes(term) ||
          o.profiles?.email?.toLowerCase().includes(term)
      );
    }

    setFilteredOcorrencias(filtered);
  }, [ocorrencias, filterStatus, filterTipo, searchTerm]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Novo',
      'em_analise': 'Em Análise',
      'atribuido': 'Atribuído',
      'em_andamento': 'Em Andamento',
      'resolvido': 'Resolvido',
      'fechado': 'Fechado',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const handleStatusChange = async (
    ocorrenciaId: string,
    newStatus: string
  ) => {
    try {
      console.log(`[ADMIN] Attempting to update occurrence ${ocorrenciaId} to status ${newStatus}`);
      
      // Make API call to update the status
      const response = await fetch('/api/ocorrencias/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          occurrenceId: parseInt(ocorrenciaId),
          newStatus
        }),
      });

      const result = await response.json();
       
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }
      
      console.log(`[ADMIN] Successfully updated occurrence ${ocorrenciaId} to status ${newStatus}`);
      console.log('[ADMIN] Response:', result);
      
      // Reload occurrences to reflect changes
      loadOcorrencias();
      
      // Show success message to user
      alert(`Status atualizado com sucesso para: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error("[ADMIN] Error updating status:", error);
      // Show error to user
      alert('Erro ao atualizar status: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    // Clear admin session
    localStorage.removeItem('admin_session');
    router.push("/admin");
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

  const openMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      "_blank"
    );
  };

  const generateReport = () => {
    // Create printable report window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar o relatório');
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Ocorrências - Prefeitura Municipal de São Manuel</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .stat-label {
            font-size: 14px;
            color: #64748b;
            margin-top: 5px;
          }
          .occurrences {
            margin-top: 30px;
          }
          .occurrence {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: white;
          }
          .occurrence-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .occurrence-title {
            font-weight: bold;
            font-size: 16px;
            color: #1e293b;
          }
          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-pendente { background: #fee2e2; color: #dc2626; }
          .status-em_analise { background: #dbeafe; color: #2563eb; }
          .status-atribuido { background: #f3e8ff; color: #9333ea; }
          .status-em_andamento { background: #ffedd5; color: #ea580c; }
          .status-resolvido { background: #dcfce7; color: #16a34a; }
          .status-fechado { background: #f3f4f6; color: #6b7280; }
          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .detail-item {
            font-size: 14px;
          }
          .detail-label {
            font-weight: bold;
            color: #64748b;
            margin-right: 5px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Prefeitura Municipal de São Manuel</h1>
          <p>Relatório de Ocorrências</p>
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.pendente}</div>
            <div class="stat-label">Novos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.em_analise}</div>
            <div class="stat-label">Em Análise</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.em_andamento}</div>
            <div class="stat-label">Em Andamento</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.concluido}</div>
            <div class="stat-label">Concluídos</div>
          </div>
        </div>
        
        <div class="occurrences">
          <h2>Lista de Ocorrências (${filteredOcorrencias.length})</h2>
          ${filteredOcorrencias.map(occ => `
            <div class="occurrence">
              <div class="occurrence-header">
                <div class="occurrence-title">${TIPOS_OCORRENCIA[occ.tipo] || occ.tipo}</div>
                <div class="status-badge status-${occ.status}">
                  ${STATUS_CONFIG[occ.status]?.label || occ.status}
                </div>
              </div>
              <div class="details">
                <div class="detail-item">
                  <span class="detail-label">Descrição:</span>
                  ${occ.descricao || 'Não informada'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Cidadão:</span>
                  ${(occ.profiles?.nome_completo || occ.profiles?.email || 'Não identificado')}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Data:</span>
                  ${formatDate(occ.created_at)}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Localização:</span>
                  ${occ.latitude && occ.longitude ? 
                    `Lat: ${occ.latitude.toFixed(6)}, Lng: ${occ.longitude.toFixed(6)}` : 
                    'Não informada'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 12px;">
          Relatório gerado automaticamente pelo sistema de gestão de ocorrências
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait a bit for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 text-white sticky top-0 z-10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover:bg-white/30 transition-all duration-300" />
              <Image
                src="/logo-prefeitura.svg"
                alt="Prefeitura Municipal de São Manuel"
                width={160}
                height={48}
                className="h-12 w-auto relative drop-shadow-lg"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-lg font-bold tracking-tight">Painel Administrativo</span>
              <span className="text-blue-100 text-sm font-medium">Gestão de Ocorrências</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={generateReport}
              className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-200"
              title="Imprimir Relatório"
            >
              <Printer className="h-5 w-5" />
              <span className="sr-only">Imprimir</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadOcorrencias}
              className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-200"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Atualizar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-700 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Total
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-900">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-red-700 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Novos
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-red-900">{stats.pendente}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-700 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Em Análise
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-900">{stats.em_analise}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-orange-700 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  <path d="M12 8v4l3 3" />
                </svg>
                Em Andamento
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-orange-900">{stats.em_andamento}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-700 font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Resolvidos
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-green-900">{stats.concluido}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* View Toggle and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* View Toggle Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  onClick={() => setViewMode('map')}
                  className="gap-2"
                >
                  <Map className="h-4 w-4" />
                  Mapa
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição, nome ou e-mail..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos tipos</SelectItem>
                      {Object.entries(TIPOS_OCORRENCIA).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occurrences View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          filteredOcorrencias.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma ocorrência encontrada
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOcorrencias.map((ocorrencia) => {
                const statusConfig =
                  STATUS_CONFIG[ocorrencia.status] || STATUS_CONFIG.pendente;
                return (
                  <Card key={ocorrencia.id}>
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {ocorrencia.foto_url && (
                          <div className="lg:w-48 lg:shrink-0">
                            <img
                              src={ocorrencia.foto_url || "/placeholder.svg"}
                              alt={
                                TIPOS_OCORRENCIA[ocorrencia.tipo] ||
                                ocorrencia.tipo
                              }
                              className="w-full h-40 lg:h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground text-lg">
                                {TIPOS_OCORRENCIA[ocorrencia.tipo] ||
                                  ocorrencia.tipo}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(ocorrencia.created_at)}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 bg-transparent"
                                >
                                  <Badge
                                    variant={statusConfig.variant}
                                    className="gap-1"
                                  >
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                  </Badge>
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {STATUS_OPTIONS.map((s) => (
                                  <DropdownMenuItem
                                    key={s.value}
                                    onClick={() =>
                                      handleStatusChange(ocorrencia.id, s.value)
                                    }
                                    disabled={ocorrencia.status === s.value}
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full ${s.color} mr-2`}
                                    />
                                    {s.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {ocorrencia.descricao && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {ocorrencia.descricao}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            {ocorrencia.profiles && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>
                                  {ocorrencia.profiles.nome_completo ||
                                    ocorrencia.profiles.email}
                                </span>
                              </div>
                            )}
                            {ocorrencia.latitude && ocorrencia.longitude && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-primary"
                                onClick={() =>
                                  openMaps(
                                    ocorrencia.latitude!,
                                    ocorrencia.longitude!
                                  )
                                }
                              >
                                <MapPin className="h-4 w-4 mr-1" />
                                Ver no mapa
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          /* Map View */
          <Card className="h-[600px] overflow-hidden">
            <CardContent className="p-0 h-full">
              <div className="h-full relative">
                {filteredOcorrencias.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Nenhuma ocorrência encontrada</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Tente ajustar os filtros ou adicionar novas ocorrências
                      </p>
                    </div>
                  </div>
                ) : (
                  <DynamicMap
                    occurrences={filteredOcorrencias}
                    onStatusChange={handleStatusChange}
                    onMarkerClick={(occurrence) => {
                      // Optional: Handle marker click if needed
                      console.log('Marker clicked:', occurrence);
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

// Wrap the AdminDashboardPage component in a Suspense boundary
export function AdminDashboardPageWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboardPage />
    </Suspense>
  );
}
