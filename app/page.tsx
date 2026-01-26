"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InstitutionalLoadingScreen from "@/components/InstitutionalLoadingScreen";
import { useInstitutionalLoading } from "@/hooks/use-institutional-loading";

export default function Home() {
  const router = useRouter();
  
  // Initialize institutional loading with custom messages
  const { isLoading, currentMessage, setIsLoading } = useInstitutionalLoading({
    initialLoading: true,
    messages: [
      "Carregando sistema municipal...",
      "Inicializando serviços públicos...",
      "Conectando à base de dados...",
      "Preparando ambiente cidadão..."
    ]
  });

  useEffect(() => {
    // Simulate app initialization
    const initTimer = setTimeout(() => {
      setIsLoading(false);
      // Redirect after loading completes
      setTimeout(() => {
        router.push("/login");
      }, 500);
    }, 2500);

    return () => clearTimeout(initTimer);
  }, [router, setIsLoading]);

  return (
    <main className="min-h-screen bg-[#1e3a8a] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Institutional Loading Screen */}
      <InstitutionalLoadingScreen 
        isLoading={isLoading}
        message={currentMessage}
        onLoaded={() => console.log('App initialization completed')}
      />

      {/* Main content (visible after loading) */}
      <div className={`relative z-10 w-full max-w-md flex flex-col items-center transition-opacity duration-500 ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Logo */}
        <div className="animate-fade-in mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-105 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl">
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
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            São Manuel
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-white font-medium text-sm">Cidadão Digital</span>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="animate-fade-in flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-medium">Redirecionando...</p>
        </div>

        {/* Register link */}
        <div className="mt-8 text-center animate-fade-in animation-delay-300">
          <p className="text-white/80 mb-2">Ainda não tem cadastro?</p>
          <button 
            onClick={() => router.push("/registro")}
            className="text-white hover:text-white/80 font-semibold underline transition-colors"
          >
            Cadastre-se
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto pt-12 text-center animate-fade-in">
        <div className="inline-flex flex-col items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <p className="font-semibold text-white text-sm">Prefeitura Municipal de São Manuel - SP</p>
          </div>
          <p className="text-white/80 text-xs font-medium tracking-wide">Ad Maiora Quotidie</p>
        </div>
      </footer>
    </main>
  );
}