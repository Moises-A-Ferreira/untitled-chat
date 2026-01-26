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
 * Busca coordenadas precisas usando sistema híbrido (local + OpenStreetMap Nominatim API)
 * @param address Endereço completo (ex: "Rua Principal 150, São Manuel")
 * @returns Promise com coordenadas ou erro
 */
export async function geocodeAddress(address: string): Promise<GeocodingResponse> {
  try {
    // PRIMEIRO: Tentar sistema de geocodificação local precisa para São Manuel
    const { findPreciseLocation } = await import('./precise-geocoding');
    const localResult = findPreciseLocation(address);
    
    if (localResult.success && localResult.lat && localResult.lng) {
      console.log('Geocodificação local precisa bem-sucedida:', localResult);
      
      return {
        success: true,
        data: {
          lat: localResult.lat,
          lng: localResult.lng,
          displayName: `${localResult.address}, ${localResult.neighborhood}, ${localResult.city} - SP, Brasil`,
          address: {
            road: localResult.address,
            neighbourhood: localResult.neighborhood,
            city: localResult.city || 'São Manuel',
            state: 'São Paulo'
          },
          boundingbox: [
            String(localResult.lat - 0.001),
            String(localResult.lat + 0.001),
            String(localResult.lng - 0.001),
            String(localResult.lng + 0.001)
          ]
        }
      };
    }
    
    console.log('Geocodificação local não encontrou resultado, tentando Nominatim API...');
    
    // SEGUNDO: Fallback para OpenStreetMap Nominatim API com viewbox de São Manuel
    // Coordenadas aproximadas de São Manuel: -22.7311, -48.5706
    // Viewbox: define área prioritária de busca (left, top, right, bottom)
    const viewbox = '-48.6000,-22.7000,-48.5400,-22.7600'; // Área de São Manuel
    
    // Tentar múltiplas variações da busca
    const searchQueries = [
      `${address}, São Manuel, SP, Brasil`,
      `${address}, São Manuel, São Paulo, Brasil`,
      `${address}, São Manuel - SP`,
      address // busca simples como último recurso
    ];
    
    let bestResult = null;
    
    for (const query of searchQueries) {
      try {
        console.log(`Tentando Nominatim com query: "${query}"`);
        
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'BR',
            viewbox: viewbox,
            bounded: 1, // Prioriza resultados dentro do viewbox
            'accept-language': 'pt-BR,pt'
          },
          headers: {
            'User-Agent': 'SaoManuel-Ocorrencias-App/1.0 (contato@saomanuel.sp.gov.br)'
          },
          timeout: 5000
        });
        
        if (response.data && response.data.length > 0) {
          // Filtrar resultados que estão próximos de São Manuel
          const resultsInSaoManuel = response.data.filter((item: any) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            // Verificar se está dentro de ~5km do centro de São Manuel
            const distance = Math.sqrt(
              Math.pow(lat - (-22.7311), 2) + Math.pow(lon - (-48.5706), 2)
            );
            return distance < 0.05; // ~5km em graus
          });
          
          if (resultsInSaoManuel.length > 0) {
            bestResult = resultsInSaoManuel[0];
            console.log(`Resultado encontrado com query: "${query}"`);
            break;
          }
        }
        
        // Aguardar 1 segundo entre requisições (rate limit do Nominatim)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.error(`Erro na tentativa com query "${query}":`, err);
        continue;
      }
    }
    
    // Se nada no viewbox, usar primeiro resultado da última busca como último recurso
    const response = { data: bestResult ? [bestResult] : [] };

    if (!bestResult) {
      try {
        const fallback = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: `${address}, São Manuel, SP, Brasil`,
            format: 'json',
            addressdetails: 1,
            limit: 1,
            countrycodes: 'BR'
          },
          headers: {
            'User-Agent': 'SaoManuel-Ocorrencias-App/1.0 (contato@saomanuel.sp.gov.br)'
          },
          timeout: 5000
        });

        if (fallback.data && fallback.data.length > 0) {
          response.data = [fallback.data[0]];
          console.log('Usando resultado fallback do Nominatim (sem viewbox)');
        }
      } catch (fallbackErr) {
        console.error('Fallback Nominatim sem viewbox falhou:', fallbackErr);
      }
    }

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      const isValidCoord = Number.isFinite(lat) && Number.isFinite(lng);
      const distanceFromCenter = Math.sqrt(
        Math.pow(lat - (-22.7311), 2) + Math.pow(lng - (-48.5706), 2)
      );
      const withinSaoManuel = distanceFromCenter < 0.05; // ~5km

      if (!isValidCoord || !withinSaoManuel) {
        return {
          success: false,
          error: 'Não foi possível geocodificar o endereço (coordenadas inválidas ou fora de São Manuel).'
        };
      }
      
      return {
        success: true,
        data: {
          lat,
          lng,
          displayName: result.display_name,
          address: result.address || {},
          boundingbox: result.boundingbox
        }
      };
    } else {
      return {
        success: false,
        error: 'Não foi possível geocodificar o endereço (nenhum resultado encontrado).'
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
      error: 'Erro ao buscar coordenadas: ' + (error.message || 'Falha desconhecida')
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
    const cached = geocodeCache.get(cacheKey)!;

    // Evitar resultados antigos que estejam fora de São Manuel
    const centerLat = -22.7311;
    const centerLng = -48.5706;
    const distance = Math.sqrt(
      Math.pow(cached.lat - centerLat, 2) + Math.pow(cached.lng - centerLng, 2)
    );

    if (distance < 0.1) { // ~11km em graus, aceitável para área urbana
      return { success: true, data: cached };
    }

    // Se o cache está fora da área, descarta e recalcula
    geocodeCache.delete(cacheKey);
  }
  
  const result = await geocodeAddress(address);
  
  if (result.success && result.data && useCache) {
    geocodeCache.set(cacheKey, result.data);
  }
  
  return result;
}