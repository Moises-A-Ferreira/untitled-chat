"use client";

import React from "react"

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Informe um e-mail.");
      setLoading(false);
      return;
    }

    // Extra safety beyond <input type="email" />
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!emailLooksValid) {
      setError("E-mail inválido. Verifique e tente novamente.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email: trimmedEmail,
          telefone: telefone.replace(/\D/g, ""),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("[cadastro] register error", err);
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary p-4 flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Voltar</span>
            </Button>
          </Link>
          <Image
            src="/logo-prefeitura.svg"
            alt="Prefeitura Municipal de São Manuel"
            width={160}
            height={48}
            className="h-10 w-auto"
          />
        </header>

        <section className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <CheckCircle className="h-20 w-20 text-primary mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Cadastro realizado!
          </h1>
          <p className="text-muted-foreground mb-8">
            Enviamos um e-mail de confirmação para{" "}
            <strong className="text-foreground">{email}</strong>. Verifique sua
            caixa de entrada e clique no link para ativar sua conta.
          </p>
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => router.push("/login")}
          >
            Ir para Login
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary p-4 flex items-center gap-4">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Voltar</span>
          </Button>
        </Link>
        <Image
          src="/logo-prefeitura.svg"
          alt="Prefeitura Municipal de São Manuel"
          width={160}
          height={48}
          className="h-10 w-auto"
        />
      </header>

      {/* Content */}
      <section className="flex-1 p-6 flex flex-col overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Cadastrar</h1>
          <p className="text-muted-foreground text-sm">
            Crie sua conta para registrar ocorrências
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base">
              Nome completo
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="h-12 text-base"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-base">
              Telefone
            </Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(14) 99999-9999"
              value={telefone}
              onChange={handlePhoneChange}
              required
              className="h-12 text-base"
              autoComplete="tel"
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base pr-12"
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-12 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base">
              Confirmar senha
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 text-base"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Cadastrando...
              </>
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
