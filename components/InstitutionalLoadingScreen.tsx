"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface InstitutionalLoadingScreenProps {
  isLoading?: boolean;
  onLoaded?: () => void;
  logoSrc?: string;
  message?: string;
}

export default function InstitutionalLoadingScreen({
  isLoading = true,
  onLoaded,
  logoSrc = "/brasao.png",
  message = "Carregando sistema..."
}: InstitutionalLoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 50);

    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    if (!isLoading && isVisible) {
      // Start fade-out animation
      setTimeout(() => {
        setIsVisible(false);
        // Remove from DOM after animation completes
        setTimeout(() => {
          setShouldRender(false);
          onLoaded?.();
        }, 700); // Match CSS transition duration
      }, 300); // Small delay before starting fade-out
    }
  }, [isLoading, isVisible, onLoaded]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ${
        isVisible && isMounted 
          ? 'opacity-100 scale-100' 
          : isVisible && !isMounted
            ? 'opacity-0 scale-105'
            : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{ backgroundColor: '#1e3a8a' }} // Institutional blue
    >
      {/* Enhanced background pattern with floating animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-background-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-background-float animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-blue-200 rounded-full blur-2xl animate-background-float animation-delay-500"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        {/* Logo container with enhanced entrance animation */}
        <div className="mb-10 animate-entrance-logo-pop">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl animate-glow-pulse"></div>
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl">
              <Image
                src={logoSrc}
                alt="Brasão da Prefeitura"
                width={120}
                height={120}
                className="drop-shadow-xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Loading indicator with staggered entrance */}
        <div className="mb-6 animate-entrance-staggered animation-delay-500">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        {/* Loading message with elegant entrance */}
        <p className="text-white text-xl font-medium tracking-wide animate-entrance-fade-in animation-delay-700 mb-2">
          {message}
        </p>

        {/* Enhanced footer text with staggered animation */}
        <div className="animate-entrance-staggered animation-delay-900">
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <p className="text-white/80 text-sm font-light tracking-wide">
              Prefeitura Municipal de São Manuel - SP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}