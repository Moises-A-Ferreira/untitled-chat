import { NextResponse } from "next/server";
import { geocodeWithCache, reverseGeocode } from "@/lib/geocoding-api";
import { 
  getClientIp, 
  createRateLimitKey, 
  checkRateLimit,
  RATE_LIMITS 
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limiting: máximo 20 requisições por minuto por IP
  try {
    const ip = getClientIp(request);
    const key = createRateLimitKey(RATE_LIMITS.GEOCODE.key, ip);
    checkRateLimit(key, RATE_LIMITS.GEOCODE.limit, RATE_LIMITS.GEOCODE.window);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Limite de requisições de geocodificação excedido. Tente novamente em " + Math.ceil(error.resetIn / 1000) + " segundos." },
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '60',
          'X-RateLimit-Reset': new Date(Date.now() + (error.resetIn || 0)).toISOString(),
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { address, lat, lng, type } = body;

    if (type === "reverse" && lat && lng) {
      // Reverse geocoding
      const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
      return NextResponse.json(result);
    } else if (type === "forward" && address) {
      // Forward geocoding
      const result = await geocodeWithCache(address);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Geocoding API route error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Rate limiting: máximo 20 requisições por minuto por IP
  try {
    const ip = getClientIp(request);
    const key = createRateLimitKey(RATE_LIMITS.GEOCODE.key, ip);
    checkRateLimit(key, RATE_LIMITS.GEOCODE.limit, RATE_LIMITS.GEOCODE.window);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Limite de requisições de geocodificação excedido. Tente novamente em " + Math.ceil(error.resetIn / 1000) + " segundos." },
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '60',
          'X-RateLimit-Reset': new Date(Date.now() + (error.resetIn || 0)).toISOString(),
        }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type") || "forward";

  try {
    if (type === "reverse" && lat && lng) {
      const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
      return NextResponse.json(result);
    } else if (type === "forward" && address) {
      const result = await geocodeWithCache(address);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Geocoding API route error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}