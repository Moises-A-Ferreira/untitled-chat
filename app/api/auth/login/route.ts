import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, findUserByEmail } from "@/lib/db/file-db";

const SESSION_TTL_HOURS = 24;

export async function POST(request: Request) {
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


