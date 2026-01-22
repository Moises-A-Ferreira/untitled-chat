import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findValidSession, listUserOcorrencias } from "@/lib/db/file-db";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
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

  const userId = parseInt(params.userId);
  if (isNaN(userId)) {
    return NextResponse.json(
      { error: "ID de usuário inválido." },
      { status: 400 }
    );
  }

  // Check if user is accessing their own data or is admin
  if (session.user_id !== userId) {
    // Check if user is admin
    // For now, only allow users to access their own data
    return NextResponse.json(
      { error: "Acesso negado." },
      { status: 403 }
    );
  }

  try {
    const ocorrencias = listUserOcorrencias(userId);
    
    return NextResponse.json({
      ocorrencias: ocorrencias.map((oc: any) => ({
        id: oc.id,
        tipo: oc.tipo,
        descricao: oc.descricao,
        foto_url: oc.foto_url,
        latitude: oc.latitude,
        longitude: oc.longitude,
        status: oc.status,
        created_at: oc.created_at,
        updated_at: oc.updated_at
      }))
    });
  } catch (error) {
    console.error("[user/ocorrencias] error", error);
    return NextResponse.json(
      { error: "Erro ao carregar ocorrências." },
      { status: 500 }
    );
  }
}