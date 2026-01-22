import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findValidSession, findUserById, listOcorrenciasPendentes } from "@/lib/db/file-db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  const session = findValidSession(token);
  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 }
    );
  }

  const user = findUserById(session.user_id);
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores." },
      { status: 403 }
    );
  }

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



