import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Supabase disabled: simply continue the request chain.
  return NextResponse.next({
    request,
  });
}
