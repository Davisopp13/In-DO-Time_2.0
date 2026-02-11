import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Rate limiting: in-memory store (resets on server restart — fine for single-user app)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

export function createApiSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function checkRateLimit(keyHash: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(keyHash);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(keyHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

function apiError(message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json(
    { success: false, error: message, generated_at: new Date().toISOString() },
    { status, headers }
  );
}

export async function validateApiKey(
  request: NextRequest
): Promise<{ valid: true } | { valid: false; response: NextResponse }> {
  // Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      response: apiError("Missing or invalid Authorization header. Use: Bearer <api_key>", 401),
    };
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return {
      valid: false,
      response: apiError("API key is empty", 401),
    };
  }

  // Hash the provided key and look it up
  const keyHash = await hashApiKey(apiKey);

  // Check rate limit before DB query
  const rateLimit = checkRateLimit(keyHash);
  if (!rateLimit.allowed) {
    return {
      valid: false,
      response: apiError("Rate limit exceeded. Max 60 requests per minute.", 429, {
        "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
      }),
    };
  }

  // Validate against database
  const supabase = createApiSupabaseClient();
  const { data: keyRecord, error } = await supabase
    .from("api_keys")
    .select("id, is_active")
    .eq("key_hash", keyHash)
    .single();

  if (error || !keyRecord) {
    return {
      valid: false,
      response: apiError("Invalid API key", 401),
    };
  }

  if (!keyRecord.is_active) {
    return {
      valid: false,
      response: apiError("API key has been revoked", 401),
    };
  }

  // Update last_used_at (fire and forget — don't block the response)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)
    .then();

  return { valid: true };
}

export function apiSuccess(data: unknown, summary?: string) {
  const response: Record<string, unknown> = {
    success: true,
    data,
    generated_at: new Date().toISOString(),
  };
  if (summary) {
    response.summary = summary;
  }
  return NextResponse.json(response);
}

export { apiError };
