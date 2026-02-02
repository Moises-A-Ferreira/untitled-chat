import { NextResponse } from "next/server";
import { listOcorrenciasPendentes } from "@/lib/db/file-db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const { user, response } = await requireAuth({ requireAdmin: true });
  if (response || !user) return response ?? NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const ocorrencias = listOcorrenciasPendentes();
    
    return NextResponse.json({
      ocorrencias: ocorrencias.map((oc) => ({
        id: oc.id,
        tipo: oc.tipo,
        descricao: oc.descricao,
        foto_url: oc.foto_url,
        latitude: oc.latitude,
        longitude: oc.longitude,
        created_at: oc.created_at,
        user: {
          id: oc.user.id,
          nome: oc.user.nome,
          email: oc.user.email,
          telefone: oc.user.telefone,
        },
      })),
    });
  } catch (error) {
    console.error("[admin/ocorrencias] error", error);
    return NextResponse.json(
      { error: "Erro ao carregar ocorrências." },
      { status: 500 }
    );
  }
}



