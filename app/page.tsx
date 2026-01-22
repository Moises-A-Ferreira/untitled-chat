"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page immediately
    router.push("/login");
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/25 to-blue-200/25 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      </div>

      {/* Loading content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="animate-fade-in mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-3xl blur-xl scale-105 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-2xl">
              <Image
                src="/brasao.png"
                alt="Brasão de São Manuel"
                width={160}
                height={160}
                className="drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10 animate-slide-up opacity-0 animation-delay-100">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2 tracking-tight">
            São Manuel
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-white/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-blue-700 font-medium text-sm">Cidadão Digital</span>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="animate-fade-in flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-700 font-medium">Redirecionando...</p>
        </div>

        {/* Register link */}
        <div className="mt-8 text-center animate-fade-in animation-delay-300">
          <p className="text-gray-600 mb-2">Ainda não tem cadastro?</p>
          <button 
            onClick={() => router.push("/registro")}
            className="text-blue-600 hover:text-blue-800 font-semibold underline transition-colors"
          >
            Cadastre-se
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto pt-12 text-center animate-fade-in">
        <div className="inline-flex flex-col items-center gap-2 px-6 py-3 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <p className="font-semibold text-blue-800 text-sm">Prefeitura Municipal de São Manuel - SP</p>
          </div>
          <p className="text-blue-600 text-xs font-medium tracking-wide">Ad Maiora Quotidie</p>
        </div>
      </footer>
    </main>
  );
}
