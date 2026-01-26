import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createOcorrencia, findValidSession } from "@/lib/db/file-db";
import { 
  createRateLimitKey, 
  checkRateLimit,
  RATE_LIMITS 
} from "@/lib/rate-limit";

export async function POST(request: Request) {
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

  // Rate limiting: máximo 10 ocorrências por usuário a cada 1 hora
  try {
    const key = createRateLimitKey(RATE_LIMITS.CREATE_OCORRENCIA.key, session.user_id);
    checkRateLimit(key, RATE_LIMITS.CREATE_OCORRENCIA.limit, RATE_LIMITS.CREATE_OCORRENCIA.window);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Limite de ocorrências atingido. Você pode enviar 10 ocorrências por hora. Tente novamente em " + Math.ceil(error.resetIn / 60000) + " minutos." },
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '3600',
          'X-RateLimit-Reset': new Date(Date.now() + (error.resetIn || 0)).toISOString(),
        }
      }
    );
  }

  const body = await request.json().catch(() => null);
  const tipo = body?.tipo?.toString().trim();
  const descricao = body?.descricao?.toString().trim() || "";
  const latitude = body?.latitude as number | null;
  const longitude = body?.longitude as number | null;

  if (!tipo) {
    return NextResponse.json(
      { error: "Tipo de ocorrência é obrigatório." },
      { status: 400 }
    );
  }

  try {
    createOcorrencia({
      user_id: session.user_id,
      tipo,
      descricao,
      latitude,
      longitude,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[ocorrencias] error", error);
    return NextResponse.json(
      { error: "Erro ao registrar ocorrência. Tente novamente." },
      { status: 500 }
    );
  }
}


