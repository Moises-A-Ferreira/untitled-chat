"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    contato: "",
    senha: "",
    confirmarSenha: ""
  });

  // Pre-fill from URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nomeParam = urlParams.get('nome');
    const cpfParam = urlParams.get('cpf');
    
    if (nomeParam) {
      setFormData(prev => ({ ...prev, nome: decodeURIComponent(nomeParam) }));
    }
    if (cpfParam) {
      const formattedCPF = cpfParam.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      setFormData(prev => ({ ...prev, cpf: formattedCPF }));
    }
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.length <= 14) {
      setFormData({ ...formData, cpf: formatted });
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, contato: e.target.value });
  };

  const isValidCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    return true;
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const cleanCPF = formData.cpf.replace(/\D/g, "");
      const cleanContact = formData.contato.trim();

      // Validation
      if (!formData.nome.trim()) {
        throw new Error("Informe seu nome completo");
      }
      if (!isValidCPF(formData.cpf)) {
        throw new Error("CPF inválido");
      }
      if (!formData.senha || formData.senha.length < 6) {
        throw new Error("Senha deve ter pelo menos 6 caracteres");
      }
      if (formData.senha !== formData.confirmarSenha) {
        throw new Error("Senhas não conferem");
      }

      // Contact validation (phone or email)
      const isEmail = cleanContact.includes("@");
      if (isEmail) {
        if (!isValidEmail(cleanContact)) {
          throw new Error("E-mail inválido");
        }
      } else {
        if (!isValidPhone(cleanContact)) {
          throw new Error("Telefone inválido");
        }
      }

      // Registration flow
      const response = await fetch("/api/auth/register-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          cpf: cleanCPF,
          contato: cleanContact,
          senha: formData.senha,
          isEmail: isEmail
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro no cadastro");
      }

      setSuccess("Cadastro realizado com sucesso!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cadastro de Cidadão
            </h1>
            <p className="text-gray-600">
              Preencha seus dados para se cadastrar
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="mt-1 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                CPF *
              </Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleCPFChange}
                required
                className="mt-1 h-12 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usado para identificação e segurança
              </p>
            </div>

            <div>
              <Label htmlFor="contato" className="text-sm font-medium text-gray-700">
                Telefone ou E-mail *
              </Label>
              <Input
                id="contato"
                type="text"
                placeholder="(__) _____-____ ou seu@email.com"
                value={formData.contato}
                onChange={handleContactChange}
                required
                className="mt-1 h-12 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Para comunicação sobre suas ocorrências
              </p>
            </div>

            <div>
              <Label htmlFor="senha" className="text-sm font-medium text-gray-700">
                Senha *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmarSenha" className="text-sm font-medium text-gray-700">
                Confirmar Senha *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  required
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cadastrando...
                </div>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Faça login
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Prefeitura Municipal de São Manuel - SP
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ad Maiora Quotidie
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}