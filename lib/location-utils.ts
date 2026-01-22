/**
 * Location validation utilities for improving geolocation accuracy
 */

interface ValidatedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

/**
 * Validates if coordinates are within reasonable bounds for São Manuel - SP
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  // São Manuel coordinates approximate bounds
  const MIN_LAT = -22.8;
  const MAX_LAT = -22.6;
  const MIN_LNG = -48.7;
  const MAX_LNG = -48.5;
  
  return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
}

/**
 * Validates geolocation accuracy and provides confidence level
 */
export function validateLocation(location: {
  latitude: number;
  longitude: number;
  accuracy: number;
}): ValidatedLocation {
  const { latitude, longitude, accuracy } = location;
  
  // Check if coordinates are valid numbers
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return {
      latitude,
      longitude,
      accuracy,
      isValid: false,
      confidence: 'low',
      error: 'Coordenadas inválidas'
    };
  }
  
  // Check if location is within São Manuel bounds
  if (!validateCoordinates(latitude, longitude)) {
    return {
      latitude,
      longitude,
      accuracy,
      isValid: false,
      confidence: 'low',
      error: 'Localização fora dos limites da cidade'
    };
  }
  
  // Determine confidence based on accuracy
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (accuracy <= 10) {
    confidence = 'high'; // Very accurate (GPS)
  } else if (accuracy <= 50) {
    confidence = 'medium'; // Moderately accurate (WiFi/cell tower)
  } else {
    confidence = 'low'; // Low accuracy
  }
  
  return {
    latitude,
    longitude,
    accuracy,
    isValid: true,
    confidence
  };
}

/**
 * Rounds coordinates to appropriate decimal places based on accuracy
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  accuracy: number
): { lat: string; lng: string } {
  // Higher accuracy = more decimal places
  let decimals = 6; // Default 6 decimal places (~0.11m accuracy)
  
  if (accuracy <= 5) {
    decimals = 7; // ~0.01m accuracy
  } else if (accuracy <= 20) {
    decimals = 6; // ~0.11m accuracy
  } else if (accuracy <= 100) {
    decimals = 5; // ~1.1m accuracy
  } else {
    decimals = 4; // ~11m accuracy
  }
  
  return {
    lat: latitude.toFixed(decimals),
    lng: longitude.toFixed(decimals)
  };
}

/**
 * Gets location quality message based on accuracy
 */
export function getLocationQualityMessage(accuracy: number): string {
  if (accuracy <= 10) {
    return 'Localização muito precisa (GPS)';
  } else if (accuracy <= 30) {
    return 'Localização precisa (GPS/WiFi)';
  } else if (accuracy <= 100) {
    return 'Localização moderada (rede móvel)';
  } else if (accuracy <= 500) {
    return 'Localização aproximada';
  } else {
    return 'Localização imprecisa';
  }
}