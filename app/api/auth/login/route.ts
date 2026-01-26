import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, findUserByEmail } from "@/lib/db/file-db";
import { 
  getClientIp, 
  createRateLimitKey, 
  checkRateLimit,
  RATE_LIMITS 
} from "@/lib/rate-limit";

const SESSION_TTL_HOURS = 24;

export async function POST(request: Request) {
  // Rate limiting: máximo 5 tentativas por IP a cada 15 minutos
  try {
    const ip = getClientIp(request);
    const key = createRateLimitKey(RATE_LIMITS.LOGIN.key, ip);
    checkRateLimit(key, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.window);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '900',
          'X-RateLimit-Reset': new Date(Date.now() + (error.resetIn || 0)).toISOString(),
        }
      }
    );
  }

  const body = await request.json().catch(() => null);

  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString() ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Informe e-mail e senha." },
      { status: 400 }
    );
  }

  try {
    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos. Tente novamente." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos. Tente novamente." },
        { status: 401 }
      );
    }

    const session = createSession(user.id, SESSION_TTL_HOURS);
    const cookieStore = await cookies();
    cookieStore.set("session_token", session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expires_at),
    });

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
      },
    });
  } catch (error) {
    console.error("[auth/login] error", error);
    return NextResponse.json(
      { error: "Erro ao entrar. Tente novamente." },
      { status: 500 }
    );
  }
}


