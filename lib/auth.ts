/**
 * Auth helper centralizado para rotas de API
 * - Recupera sessão a partir do cookie "session_token"
 * - Valida expiração
 * - Opcional: exige role admin
 * - Opcional: permite anônimo (para /auth/me retornar { user: null })
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findValidSession, findUserById, type Session, type User } from "@/lib/db/file-db";

export type AuthResult = {
  session: Session | null;
  user: User | null;
  response?: NextResponse;
};

export type RequireAuthOptions = {
  requireAdmin?: boolean;
  allowUnauthenticated?: boolean;
};

function unauthorized() {
  return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
}

function forbidden(message = "Acesso negado.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Recupera sessão e usuário a partir do cookie.
 * - Se allowUnauthenticated for true, retorna { user: null } ao invés de 401.
 * - Se requireAdmin for true, valida role.
 */
export async function requireAuth(options: RequireAuthOptions = {}): Promise<AuthResult> {
  const { requireAdmin = false, allowUnauthenticated = false } = options;

  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    if (allowUnauthenticated) return { session: null, user: null };
    return { session: null, user: null, response: unauthorized() };
  }

  const session = findValidSession(token);
  if (!session) {
    if (allowUnauthenticated) return { session: null, user: null };
    return { session: null, user: null, response: unauthorized() };
  }

  const user = findUserById(session.user_id) || null;
  if (!user) {
    if (allowUnauthenticated) return { session: null, user: null };
    return { session: null, user: null, response: unauthorized() };
  }

  if (requireAdmin && user.role !== "admin") {
    return { session, user, response: forbidden("Apenas administradores.") };
  }

  return { session, user };
}

/**
 * Garante que o usuário seja o dono do recurso ou admin.
 */
export function ensureUserAccess(targetUserId: number, user: User): NextResponse | null {
  if (user.role === "admin") return null;
  if (user.id !== targetUserId) {
    return forbidden("Acesso negado.");
  }
  return null;
}
