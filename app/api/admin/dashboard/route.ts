import { NextResponse } from "next/server";
import { listAllOcorrencias } from "@/lib/db/file-db";

export async function GET(request: Request) {
  // Simple admin check - in production, implement proper authentication
  const url = new URL(request.url);
  const adminParam = url.searchParams.get('admin');
  
  // For demo purposes, we'll accept a simple admin parameter
  // In production, implement proper JWT or session-based authentication
  if (adminParam !== 'true') {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores." },
      { status: 403 }
    );
  }

  try {
    // Return all occurrences (not just pending ones for admin view)
    const allOccurrences = listAllOcorrencias().map(oc => ({
      id: oc.id,
      tipo: oc.tipo,
      descricao: oc.descricao,
      foto_url: oc.foto_url,
      latitude: oc.latitude,
      longitude: oc.longitude,
      status: oc.status,
      created_at: oc.created_at,
      user: {
        id: oc.user.id,
        nome: oc.user.nome,
        email: oc.user.email,
        telefone: oc.user.telefone,
      },
    }));

    return NextResponse.json({
      ocorrencias: allOccurrences,
    });
  } catch (error) {
    console.error("[admin/ocorrencias] error", error);
    return NextResponse.json(
      { error: "Erro ao carregar ocorrências." },
      { status: 500 }
    );
  }
}