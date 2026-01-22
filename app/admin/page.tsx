"use client";

import React from "react";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      // Check for existing admin session
      const adminToken = localStorage.getItem('admin_session');
      
      if (adminToken) {
        // Verify session is still valid
        try {
          const response = await fetch('/api/admin/ocorrencias');
          if (response.ok) {
            router.push("/admin/dashboard");
            return;
          }
        } catch (error) {
          // Session invalid, continue to login
          localStorage.removeItem('admin_session');
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Demo credentials for admin access
      // In production, this would connect to your actual authentication system
      const ADMIN_EMAIL = "admin@saomanuel.sp.gov.br";
      const ADMIN_PASSWORD = "admin123";

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Create admin session
        const sessionToken = 'admin_' + Date.now().toString();
        localStorage.setItem('admin_session', sessionToken);
        
        router.push("/admin/dashboard");
      } else {
        setError("Credenciais inválidas");
      }
    } catch (error) {
      setError("Erro no servidor");
      console.error("[admin] Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo-prefeitura.svg"
              alt="Prefeitura Municipal de São Manuel"
              width={180}
              height={54}
              className="h-14 w-auto mb-6"
            />
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              Acesso restrito a funcionários
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@saomanuel.sp.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-11"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-sm p-3 rounded-lg">
              <strong>Demo:</strong> Use admin@saomanuel.sp.gov.br / admin123
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Prefeitura Municipal de São Manuel - SP
        </p>
      </div>
    </main>
  );
}
