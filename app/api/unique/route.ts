// app/api/unique/route.ts
import { NextResponse } from "next/server";
import { Agent } from "undici";

import { fetchIamToken } from "@/server/auth/iam";
import type { ApiType, Environment } from "@/types/shared";
import { buildRequest, getBaseUrl } from "@/server/api/registry";

export const runtime = "nodejs";

function base64UrlDecode(input: string) {
  // base64url -> base64
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  // padding
  const pad = input.length % 4;
  if (pad) input += "=".repeat(4 - pad);
  return Buffer.from(input, "base64").toString("utf8");
}

function decodeJwtClaims(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return { isJwt: false as const };

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { isJwt: true as const, header, payload };
  } catch {
    return { isJwt: false as const };
  }
}

function tokenFingerprint(token: string) {
  // fingerprint simples: tamanho + primeiros/últimos chars (não revela o token)
  const t = token || "";
  return {
    len: t.length,
    head: t.slice(0, 12),
    tail: t.slice(-12),
    parts: t.split(".").length,
  };
}

const insecureDispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

function safeJson(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

function serializeError(e: any) {
  return {
    name: e?.name,
    message: e?.message,
    code: e?.code,
    cause: e?.cause
      ? {
          name: e.cause?.name,
          message: e.cause?.message,
          code: e.cause?.code,
          hostname: e.cause?.hostname,
          port: e.cause?.port,
        }
      : undefined,
  };
}

export async function POST(req: Request) {
  const start = Date.now();

  try {
    const { environment, apiType, payload } = (await req.json()) as {
      environment: Environment;
      apiType: ApiType;
      payload: any;
    };

    const baseUrl = getBaseUrl(apiType, environment);
    const built = buildRequest(apiType, baseUrl, payload);

    const token = await fetchIamToken(environment);

    const headers = {
      ...built.headers,
      Authorization: `Bearer ${token.accessToken}`,
    };

    const requestDebug = {
      url: built.url,
      method: built.method,
      headers: { ...headers, Authorization: "Bearer ********" },
      body: built.body ?? null,
    };

    const res = await fetch(built.url, {
      method: built.method,
      headers,
      body: built.body ? JSON.stringify(built.body) : undefined,
      cache: "no-store",
      dispatcher: insecureDispatcher,
    } as any);

    const elapsedMs = Date.now() - start;

    const text = await res.text();
    const parsed = safeJson(text);

    const meta = {
      ok: res.ok,
      status: res.status,
      elapsedMs,
      url: built.url,
      method: built.method,
      timestamp: new Date().toISOString(),
      request: requestDebug,
    };

    if (!res.ok) {
      return NextResponse.json({ meta, error: parsed }, { status: res.status });
    }

    return NextResponse.json({ meta, data: parsed }, { status: 200 });
  } catch (err: any) {
    const elapsedMs = Date.now() - start;

    return NextResponse.json(
      {
        meta: {
          ok: false,
          status: null,
          elapsedMs,
          timestamp: new Date().toISOString(),
        },
        error: {
          message: err?.message ?? "fetch failed",
          details: serializeError(err),
        },
      },
      { status: 500 },
    );
  }
}
