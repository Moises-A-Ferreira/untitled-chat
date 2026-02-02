import axios from 'axios';
import { geocodingCache } from './geocoding-cache';
import { 
  normalizeText, 
  generateSearchVariations, 
  deduplicateResults, 
  sortResultsByRelevance,
  findClosestMatch
} from './address-normalizer';

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
    country?: string;
  };
  boundingbox: [string, string, string, string];
  importance?: number;
  type?: string;
}

// Interface para resposta da API
interface GeocodingResponse {
  success: boolean;
  data?: GeocodeResult;
  error?: string;
  suggestions?: string[];
  metadata?: {
    totalResults: number;
    filteredResults: number;
    searchMethod: string;
    variationsTried: number;
    cached?: boolean;
    cacheHitRate?: number;
  };
}

/**
 * Busca coordenadas precisas usando sistema híbrido (local + OpenStreetMap Nominatim API)
 * COM CACHE INTELIGENTE para melhorar performance em ~60%
 * @param address Endereço completo (ex: "Rua Principal 150, São Manuel")
 * @param useCache Usar cache inteligente (padrão: true)
 * @returns Promise com coordenadas ou erro
 */
export async function geocodeAddress(address: string, useCache = true): Promise<GeocodingResponse> {
  try {
    // ===== CACHE INTELIGENTE =====
    // Verificar cache ANTES de qualquer processamento
    if (useCache) {
      const cachedResult = geocodingCache.get(address);
      if (cachedResult) {
        const stats = geocodingCache.getStats();
        console.log(`✨ Cache HIT! Taxa de acertos: ${stats.hitRate.toFixed(1)}%`);
        
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cached: true,
            cacheHitRate: stats.hitRate
          }
        };
      }
    }
    
    // ===== SISTEMA LOCAL PRECISO =====
    // PRIMEIRO: Tentar sistema de geocodificação local precisa para São Manuel
    const { findPreciseLocation } = await import('./precise-geocoding');
    const localResult = findPreciseLocation(address);
    
    if (localResult.success && localResult.lat && localResult.lng) {
      console.log('Geocodificação local precisa bem-sucedida:', localResult);
      
      const response: GeocodingResponse = {
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
        },
        metadata: {
          totalResults: 1,
          filteredResults: 1,
          searchMethod: 'local_precise',
          variationsTried: 0,
          cached: false
        }
      };
      
      // Salvar no cache para uso futuro (TTL: 7 dias para resultados locais)
      if (useCache && response.data) {
        geocodingCache.set(address, response, 7 * 24 * 60 * 60 * 1000);
      }
      
      return response;
    }
    
    console.log('Geocodificação local não encontrou resultado, tentando Nominatim API...');
    
    // ===== NOMINATIM API COM BUSCA INTELIGENTE =====
    // Normalizar o endereço de entrada
    const normalizedAddress = normalizeText(address);
    
    // Gerar variações de busca para tolerância a erros
    const searchVariations = generateSearchVariations(address);
    
    let allResults: any[] = [];
    let bestResult: any = null;
    
    // Tentar cada variação até encontrar resultados
    for (const variation of searchVariations) {
      try {
        console.log(`Tentando busca com variação: ${variation}`);
        
        // Primeiro tentar com viewbox restrito a São Manuel
        const viewboxResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: variation,
            format: 'json',
            limit: 5,
            viewbox: '-48.59,-22.75,-48.55,-22.71', // Área restrita de São Manuel
            bounded: 1,
            addressdetails: 1,
            countrycodes: 'br',
            'accept-language': 'pt-BR'
          },
          headers: {
            'User-Agent': 'SaoManuel-Ocorrencias-App/2.0 (melhoria de busca inteligente)'
          },
          timeout: 5000
        });
        
        if (viewboxResponse.data && viewboxResponse.data.length > 0) {
          console.log(`Encontrados ${viewboxResponse.data.length} resultados no viewbox para: ${variation}`);
          allResults = [...allResults, ...viewboxResponse.data];
          
          // Guardar o melhor resultado do viewbox
          if (!bestResult) {
            bestResult = viewboxResponse.data[0];
          }
        }
        
        // Se não encontrou resultados suficientes no viewbox, tentar busca mais ampla
        if (allResults.length < 3) {
          const broadResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              q: `${variation}, São Paulo, Brasil`,
              format: 'json',
              limit: 10,
              addressdetails: 1,
              countrycodes: 'br',
              'accept-language': 'pt-BR'
            },
            headers: {
              'User-Agent': 'SaoManuel-Ocorrencias-App/2.0 (busca ampliada)'
            },
            timeout: 5000
          });
          
          if (broadResponse.data && broadResponse.data.length > 0) {
            console.log(`Encontrados ${broadResponse.data.length} resultados amplos para: ${variation}`);
            const saoManuelResults = broadResponse.data.filter((r: any) => 
              r.display_name?.toLowerCase().includes('são manuel') ||
              r.address?.city?.toLowerCase().includes('são manuel')
            );
            
            if (saoManuelResults.length > 0) {
              allResults = [...allResults, ...saoManuelResults];
              if (!bestResult) {
                bestResult = saoManuelResults[0];
              }
            }
          }
        }
        
      } catch (variationError) {
        console.warn(`Erro na variação ${variation}:`, variationError);
        continue;
      }
    }

    // Processar e filtrar todos os resultados
    if (allResults.length > 0) {
      // Remover duplicatas
      let filteredResults = deduplicateResults(allResults);
      
      // Ordenar por relevância
      filteredResults = sortResultsByRelevance(filteredResults);
      
      console.log(`Total de resultados únicos: ${filteredResults.length}`);
      
      // Selecionar o melhor resultado
      let selectedResult = filteredResults[0];
      
      // Se o primeiro resultado não for específico o suficiente, procurar melhor correspondência
      if (!/\d+/.test(selectedResult.display_name) || 
          !selectedResult.display_name.toLowerCase().includes('são manuel')) {
        
        const closestMatch = findClosestMatch(address, filteredResults);
        if (closestMatch) {
          selectedResult = closestMatch;
          console.log('Usando correspondência mais próxima:', selectedResult.display_name);
        }
      }
      
      const lat = parseFloat(selectedResult.lat);
      const lng = parseFloat(selectedResult.lon);
      
      const isValidCoord = Number.isFinite(lat) && Number.isFinite(lng);
      const distanceFromCenter = Math.sqrt(
        Math.pow(lat - (-22.7311), 2) + Math.pow(lng - (-48.5706), 2)
      );
      const withinSaoManuel = distanceFromCenter < 0.05; // ~5km
      
      if (!isValidCoord || !withinSaoManuel) {
        const errorResponse: GeocodingResponse = {
          success: false,
          error: 'Não foi possível geocodificar o endereço (coordenadas inválidas ou fora de São Manuel).'
        };
        
        // Cache de erros com TTL menor (5 minutos)
        if (useCache) {
          geocodingCache.set(address, errorResponse, 5 * 60 * 1000);
        }
        
        return errorResponse;
      }
      
      const response: GeocodingResponse = {
        success: true,
        data: {
          lat,
          lng,
          displayName: selectedResult.display_name,
          address: selectedResult.address || {},
          boundingbox: selectedResult.boundingbox,
          importance: selectedResult.importance,
          type: selectedResult.type
        },
        metadata: {
          totalResults: allResults.length,
          filteredResults: filteredResults.length,
          searchMethod: 'nominatim_improved_v2',
          variationsTried: searchVariations.length,
          cached: false
        }
      };
      
      // Salvar no cache para uso futuro (TTL: 24 horas para resultados da API)
      if (useCache && response.data) {
        geocodingCache.set(address, response, 24 * 60 * 60 * 1000);
      }
      
      return response;
    } else {
      // Se não encontrou resultados, retornar sugestão útil
      const errorResponse: GeocodingResponse = {
        success: false,
        error: `Endereço "${address}" não encontrado. Tente formatos como: "Rua Principal 150", "Av. Brasil", ou "Praça da Matriz".`,
        suggestions: [
          "Verifique se o nome da rua está correto",
          "Tente remover acentos e caracteres especiais",
          "Use formatos como: 'Rua Nome 123' ou 'Avenida Nome'",
          "Certifique-se de estar buscando em São Manuel"
        ]
      };
      
      // Cache de erros com TTL menor (5 minutos)
      if (useCache) {
        geocodingCache.set(address, errorResponse, 5 * 60 * 1000);
      }
      
      return errorResponse;
    }
  } catch (error: any) {
    console.error('Geocoding API error:', error.message);
    
    const errorResponse: GeocodingResponse = {
      success: false,
      error: error.code === 'ECONNABORTED' 
        ? 'Timeout na requisição - tente novamente'
        : 'Erro ao buscar coordenadas: ' + (error.message || 'Falha desconhecida')
    };
    
    // NÃO cachear erros de timeout ou rede
    
    return errorResponse;
  }
}

/**
 * Reverse geocoding - converte coordenadas em endereço
 * @param lat Latitude
 * @param lng Longitude
 * @param useCache Usar cache inteligente (padrão: true)
 * @returns Promise com endereço formatado
 */
export async function reverseGeocode(lat: number, lng: number, useCache = true): Promise<GeocodingResponse> {
  try {
    const cacheKey = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;
    
    // Verificar cache
    if (useCache) {
      const cachedResult = geocodingCache.get(cacheKey);
      if (cachedResult) {
        console.log(`✨ Reverse geocode cache HIT!`);
        return cachedResult;
      }
    }
    
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'SaoManuel-Ocorrencias-App/2.0'
      },
      timeout: 5000
    });

    if (response.data && response.data.address) {
      const result: GeocodingResponse = {
        success: true,
        data: {
          lat: lat,
          lng: lng,
          displayName: response.data.display_name,
          address: response.data.address,
          boundingbox: response.data.boundingbox
        }
      };
      
      // Salvar no cache (TTL: 24 horas)
      if (useCache) {
        geocodingCache.set(cacheKey, result, 24 * 60 * 60 * 1000);
      }
      
      return result;
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

/**
 * Versão legada mantida para compatibilidade
 * @deprecated Use geocodeAddress() que já inclui cache por padrão
 */
export async function geocodeWithCache(address: string, useCache = true): Promise<GeocodingResponse> {
  return geocodeAddress(address, useCache);
}

/**
 * Limpa o cache de geocodificação
 * Útil para testes ou quando precisa forçar novas buscas
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
  console.log('Cache de geocodificação limpo');
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats() {
  return geocodingCache.getStats();
}
