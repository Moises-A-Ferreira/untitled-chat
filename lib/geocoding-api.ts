import axios from 'axios';
<<<<<<< HEAD
import { 
  normalizeText, 
  generateSearchVariations, 
  deduplicateResults, 
  sortResultsByRelevance,
  findClosestMatch
} from './address-normalizer';

=======

// Interface para resultados da geocodificação
>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
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
<<<<<<< HEAD
    country?: string;
  };
  boundingbox: [string, string, string, string];
  importance?: number;
  type?: string;
}

=======
  };
  boundingbox: [string, string, string, string];
}

// Interface para resposta da API
>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
interface GeocodingResponse {
  success: boolean;
  data?: GeocodeResult;
  error?: string;
<<<<<<< HEAD
  suggestions?: string[];
  metadata?: {
    totalResults: number;
    filteredResults: number;
    searchMethod: string;
    variationsTried: number;
  };
=======
>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
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
    
<<<<<<< HEAD
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
=======
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
>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
          },
          timeout: 5000
        });
        
<<<<<<< HEAD
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
      
=======
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

>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
      const isValidCoord = Number.isFinite(lat) && Number.isFinite(lng);
      const distanceFromCenter = Math.sqrt(
        Math.pow(lat - (-22.7311), 2) + Math.pow(lng - (-48.5706), 2)
      );
      const withinSaoManuel = distanceFromCenter < 0.05; // ~5km
<<<<<<< HEAD
      
=======

>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
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
<<<<<<< HEAD
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
          variationsTried: searchVariations.length
        }
      };
    } else {
      // Se não encontrou resultados, retornar sugestão útil
      return {
        success: false,
        error: `Endereço "${address}" não encontrado. Tente formatos como: "Rua Principal 150", "Av. Brasil", ou "Praça da Matriz".`,
        suggestions: [
          "Verifique se o nome da rua está correto",
          "Tente remover acentos e caracteres especiais",
          "Use formatos como: 'Rua Nome 123' ou 'Avenida Nome'",
          "Certifique-se de estar buscando em São Manuel"
        ]
=======
          displayName: result.display_name,
          address: result.address || {},
          boundingbox: result.boundingbox
        }
      };
    } else {
      return {
        success: false,
        error: 'Não foi possível geocodificar o endereço (nenhum resultado encontrado).'
>>>>>>> 79e73dd08ffd9c64743269f7d6553d59ecb89a7f
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