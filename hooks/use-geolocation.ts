"use client";

import { useState, useEffect, useCallback } from "react";

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  isSupported: boolean;
  refreshLocation: () => void;
  stopWatching: () => void;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 25000,
  maximumAge: 60000, // Cache for 1 minute
  watch: false,
};

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    setPosition(pos);
    setError(null);
    setLoading(false);
  }, []);

  const updateError = useCallback((err: GeolocationError) => {
    setError(err);
    setLoading(false);
  }, []);

  const getLocation = useCallback(() => {
    // Prevent multiple simultaneous requests
    if (loading || position) {
      return;
    }

    if (!isSupported) {
      setError({
        code: 0,
        message: "Geolocalização não suportada pelo navegador",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log('[GEOLOCATION] Requesting location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[GEOLOCATION] Success:', pos.coords);
        updatePosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (error) => {
        console.log('[GEOLOCATION] Error:', error);
        let errorMessage = "Erro ao obter localização";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permissão de localização negada. Por favor, habilite o acesso à localização nas configurações do seu navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Localização indisponível. Verifique se o GPS está ativado.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Tempo esgotado ao obter localização. Tente novamente.";
        }
        
        updateError({
          code: error.code,
          message: errorMessage,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [isSupported, mergedOptions, updatePosition, updateError, loading, position]);

  const startWatching = useCallback(() => {
    if (!isSupported || watchId !== null) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        updatePosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        updateError({
          code: error.code,
          message: error.message,
        });
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );

    setWatchId(id);
  }, [isSupported, watchId, mergedOptions, updatePosition, updateError]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const refreshLocation = useCallback(() => {
    console.log('[GEOLOCATION] Refresh requested');
    if (mergedOptions.watch) {
      startWatching();
    } else {
      getLocation();
    }
  }, [mergedOptions.watch, startWatching, getLocation]);

  // Removed automatic initialization - let consumer components control when to get location
  // This prevents conflicts with page-level useEffect hooks

  return {
    position,
    error,
    loading,
    isSupported,
    refreshLocation,
    stopWatching,
  };
}