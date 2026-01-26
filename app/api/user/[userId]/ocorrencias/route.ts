import { NextResponse } from "next/server";
import { listUserOcorrencias } from "@/lib/db/file-db";
import { ensureUserAccess, requireAuth } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { user, response } = await requireAuth();
  if (response || !user) return response ?? NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const userId = parseInt(params.userId);
  if (isNaN(userId)) {
    return NextResponse.json(
      { error: "ID de usuário inválido." },
      { status: 400 }
    );
  }

  const accessError = ensureUserAccess(userId, user);
  if (accessError) return accessError;

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