import type { AuthError } from "@supabase/supabase-js";

type MaybeAuthError = Pick<AuthError, "message" | "status" | "code"> | null | undefined;

export function getSupabaseAuthErrorMessage(error: MaybeAuthError): string | null {
  if (!error) return null;

  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();
  const status = error.status;

  // Prefer known codes first (more stable than message matching)
  if (code === "email_address_invalid" || code === "email_invalid") {
    return "E-mail inválido. Verifique e tente novamente.";
  }
  if (code === "weak_password") {
    return "Senha fraca. Use uma senha mais forte (mínimo 6 caracteres).";
  }
  if (code === "user_already_exists") {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }
  if (code === "email_not_confirmed") {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }
  if (code === "invalid_login_credentials") {
    return "E-mail ou senha incorretos. Tente novamente.";
  }

  // Message fallbacks (Supabase can vary by version / provider)
  if (msg.includes("already registered") || msg.includes("user already registered")) {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }
  if (msg.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Tente novamente.";
  }
  if (msg.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }
  if (msg.includes("invalid email") || msg.includes("email address is invalid")) {
    return "E-mail inválido. Verifique e tente novamente.";
  }
  if (msg.includes("password should be at least") || msg.includes("weak password")) {
    return "Senha fraca. Use uma senha mais forte (mínimo 6 caracteres).";
  }
  if (status === 429 || msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  }

  return "Não foi possível concluir. Verifique os dados e tente novamente.";
}


