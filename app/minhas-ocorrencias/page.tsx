"use client";

import React from "react"

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

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
    icon: <Loader2 className="h-3 w-3" />,
    variant: "default",
  },
  concluido: {
    label: "Concluído",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "default",
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
};

export default function MinhasOcorrenciasPage() {
  const router = useRouter();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const loadOcorrencias = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCheckingAuth(false);

      const { data, error } = await supabase
        .from("ocorrencias")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("[v0] Error loading ocorrencias:", error);
      } else {
        setOcorrencias(data || []);
      }

      setLoading(false);
    };

    loadOcorrencias();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary p-4 flex items-center gap-4">
<<<<<<< HEAD
        <Link href="/registrar">
=======
        <Link href="/">
>>>>>>> fa95f88f0a2e4a3f92d155e004edb13f769df551
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Voltar</span>
          </Button>
        </Link>
        <Image
          src="/logo-prefeitura.svg"
          alt="Prefeitura Municipal de São Manuel"
          width={160}
          height={48}
          className="h-10 w-auto"
        />
      </header>

      {/* Content */}
      <section className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Minhas Ocorrências
            </h1>
            <p className="text-muted-foreground text-sm">
              {ocorrencias.length}{" "}
              {ocorrencias.length === 1 ? "registro" : "registros"}
            </p>
          </div>
          <Link href="/registrar">
            <Button size="icon" className="h-12 w-12 rounded-full">
              <Plus className="h-6 w-6" />
              <span className="sr-only">Nova ocorrência</span>
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ocorrencias.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-muted rounded-full p-6 mb-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma ocorrência
            </h2>
            <p className="text-muted-foreground mb-6">
              Você ainda não registrou nenhuma ocorrência
            </p>
            <Link href="/registrar">
              <Button size="lg" className="h-14 px-8">
                <Plus className="h-5 w-5 mr-2" />
                Registrar agora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {ocorrencias.map((ocorrencia) => {
              const statusConfig =
                STATUS_CONFIG[ocorrencia.status] || STATUS_CONFIG.pendente;
              return (
                <div
                  key={ocorrencia.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  {ocorrencia.foto_url && (
                    <img
                      src={ocorrencia.foto_url || "/placeholder.svg"}
                      alt={TIPOS_OCORRENCIA[ocorrencia.tipo] || ocorrencia.tipo}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {TIPOS_OCORRENCIA[ocorrencia.tipo] || ocorrencia.tipo}
                      </h3>
                      <Badge variant={statusConfig.variant} className="gap-1 shrink-0">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {ocorrencia.descricao && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {ocorrencia.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(ocorrencia.created_at)}
                      </div>
                      {ocorrencia.latitude && ocorrencia.longitude && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {ocorrencia.latitude.toFixed(4)},{" "}
                            {ocorrencia.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
