import axios from 'axios';

// Interface para resultados da geocodificação
interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  boundingbox: [string, string, string, string];
}

// Interface para resposta da API
interface GeocodingResponse {
  success: boolean;
  data?: GeocodeResult;
  error?: string;
}

/**
 * Busca coordenadas precisas usando OpenStreetMap Nominatim API
 * @param address Endereço completo (ex: "Rua Principal 150, São Manuel")
 * @returns Promise com coordenadas ou erro
 */
export async function geocodeAddress(address: string): Promise<GeocodingResponse> {
  try {
    // Adiciona contexto de São Manuel, SP para melhorar precisão
    const fullAddress = `${address}, São Manuel, SP, Brasil`;
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: fullAddress,
        format: 'json',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'BR'
      },
      headers: {
        'User-Agent': 'SaoManuel-Ocorrencias-App/1.0'
      },
      timeout: 5000 // 5 segundos timeout
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      return {
        success: true,
        data: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
          address: result.address || {},
          boundingbox: result.boundingbox
        }
      };
    } else {
      return {
        success: false,
        error: 'Endereço não encontrado'
      };
    }
  } catch (error: any) {
    console.error('Geocoding API error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Timeout na requisição - tente novamente'
      };
    }
    
    return {
      success: false,
      error: 'Erro na geocodificação: ' + (error.message || 'Falha desconhecida')
    };
  }
}

/**
 * Reverse geocoding - converte coordenadas em endereço
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise com endereço formatado
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResponse> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'SaoManuel-Ocorrencias-App/1.0'
      },
      timeout: 5000
    });

    if (response.data && response.data.address) {
      return {
        success: true,
        data: {
          lat: lat,
          lng: lng,
          displayName: response.data.display_name,
          address: response.data.address,
          boundingbox: response.data.boundingbox
        }
      };
    } else {
      return {
        success: false,
        error: 'Coordenadas não encontradas'
      };
    }
  } catch (error: any) {
    console.error('Reverse geocoding error:', error.message);
    return {
      success: false,
      error: 'Erro no reverse geocoding: ' + (error.message || 'Falha desconhecida')
    };
  }
}

/**
 * Função auxiliar para formatar endereço do resultado
 * @param result Resultado da geocodificação
 * @returns Endereço formatado
 */
export function formatAddress(result: GeocodeResult): string {
  const parts = [];
  
  if (result.address.road) {
    parts.push(result.address.road);
  }
  
  if (result.address.house_number) {
    parts[parts.length - 1] = `${parts[parts.length - 1]}, ${result.address.house_number}`;
  }
  
  if (result.address.neighbourhood || result.address.suburb) {
    parts.push(result.address.neighbourhood || result.address.suburb);
  }
  
  if (result.address.city) {
    parts.push(result.address.city);
  }
  
  if (result.address.state) {
    parts.push(result.address.state);
  }
  
  return parts.join(', ');
}

// Cache simples para evitar requisições repetidas
const geocodeCache = new Map<string, GeocodeResult>();

/**
 * Versão cacheada da geocodificação
 * @param address Endereço para geocodificar
 * @param useCache Usar cache (default: true)
 * @returns Promise com resultado
 */
export async function geocodeWithCache(address: string, useCache = true): Promise<GeocodingResponse> {
  const cacheKey = address.toLowerCase().trim();
  
  if (useCache && geocodeCache.has(cacheKey)) {
    return {
      success: true,
      data: geocodeCache.get(cacheKey)!
    };
  }
  
  const result = await geocodeAddress(address);
  
  if (result.success && result.data && useCache) {
    geocodeCache.set(cacheKey, result.data);
  }
  
  return result;
}