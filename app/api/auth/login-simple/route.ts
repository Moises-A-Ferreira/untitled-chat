import { cookies } from "next/headers";
import { NextResponse } from "next/server";
// @ts-ignore
import bcrypt from "bcryptjs";
import { readDb } from "@/lib/db/file-db";

const SESSION_TTL_HOURS = 24;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const cpf = body?.cpf?.toString().trim();
  const senha = body?.senha?.toString() ?? "";

  if (!cpf || !senha) {
    return NextResponse.json(
      { error: "Informe CPF e senha." },
      { status: 400 }
    );
  }

  try {
    const cleanCPF = cpf.replace(/\D/g, "");
    const db = readDb();
    
    // Find user by CPF (stored in telefone field)
    const user = db.users.find(u => u.telefone === cleanCPF);

    if (!user) {
      return NextResponse.json(
        { error: "CPF ou senha incorretos." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(senha, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "CPF ou senha incorretos." },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = {
      token: sessionId,
      user_id: user.id,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    };

    db.sessions.push(session);
    // Save session to database
    const { writeDb } = await import("@/lib/db/file-db");
    writeDb(db);
    
    const cookieStore = await cookies();
    cookieStore.set("session_token", session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      }
    });

  } catch (error) {
    console.error("[simple-login] error", error);
    return NextResponse.json(
      { error: "Erro ao fazer login. Tente novamente." },
      { status: 500 }
    );
  }
}